import fs from 'node:fs';
import path from 'node:path';
import { resolveAppPath } from '../config/app-paths';
import type { ConversionRepository } from '../db/conversion-repo';
import type { AtojAppConfig, RetentionCleanupResult } from '@shared/types/domain';

export class RetentionCleanerService {
  private config: AtojAppConfig;
  private readonly repo: ConversionRepository;
  private timer: NodeJS.Timeout | null = null;

  constructor(config: AtojAppConfig, repo: ConversionRepository) {
    this.config = config;
    this.repo = repo;
  }

  public updateConfig(nextConfig: AtojAppConfig): void {
    this.config = nextConfig;
  }

  public startPeriodicCleanup(): void {
    this.stopPeriodicCleanup();
    this.runCleanupNow();
    // 1시간 주기로 보관 기간 경과 파일 및 DB 이력 자동 정리
    this.timer = setInterval(() => {
      this.runCleanupNow();
    }, 60 * 60 * 1000);
  }

  public stopPeriodicCleanup(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public runCleanupNow(): RetentionCleanupResult {
    const { retention, paths } = this.config;

    const deletedLogs = this.deleteOldFilesInDir(paths.logDir, retention.logDays, ['.log']);
    const deletedDbRows = this.repo.purgeOlderThanDays(retention.dbHistoryDays);
    const deletedResults = this.deleteOldFilesInDir(paths.targetDir, retention.resultDays, ['.dat']);
    const deletedQuarantines = this.deleteOldFilesInDir(
      paths.quarantineDir,
      retention.quarantineDays,
    );

    return {
      deletedLogs,
      deletedDbRows,
      deletedResults,
      deletedQuarantines,
    };
  }

  private deleteOldFilesInDir(dirPath: string, days: number, allowedExts?: string[]): number {
    if (!days || days <= 0 || !dirPath) return 0;

    const resolved = resolveAppPath(dirPath);
    if (!fs.existsSync(resolved)) return 0;

    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    try {
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;

        if (allowedExts && allowedExts.length > 0) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!allowedExts.includes(ext)) continue;
        }

        const fullPath = path.join(resolved, entry.name);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.mtimeMs < cutoffMs) {
            fs.unlinkSync(fullPath);
            deletedCount++;
          }
        } catch {
          // 사용 중인 파일 등 삭제 실패 시 무시
        }
      }
    } catch {
      // 디렉터리 접근 오류 무시
    }

    return deletedCount;
  }
}
