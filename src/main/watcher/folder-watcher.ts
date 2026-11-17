import fs from 'node:fs';
import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { resolveAppPath } from '../config/app-paths';
import { validateAverFileName } from '../converter/aver-parser';
import { convertAverFileToJver } from '../converter/jver-packer';
import type { ConversionRepository } from '../db/conversion-repo';
import { FileLogger } from './file-logger';
import { formatViolationTimestamp } from '@shared/spec-labels';
import type { AtojAppConfig, ConversionRecord, DashboardSummary } from '@shared/types/domain';

export class FolderWatcherService {
  private config: AtojAppConfig;
  private readonly repo: ConversionRepository;
  private readonly logger: FileLogger;
  private watcher: FSWatcher | null = null;
  private isWatching = false;
  private readonly processingSet = new Set<string>();
  private readonly onRecordCallbacks = new Set<(record: ConversionRecord) => void>();
  private readonly onSummaryCallbacks = new Set<(summary: DashboardSummary) => void>();

  constructor(config: AtojAppConfig, repo: ConversionRepository) {
    this.config = config;
    this.repo = repo;
    this.logger = new FileLogger(config.paths.logDir);
  }

  public onConversion(cb: (record: ConversionRecord) => void): () => void {
    this.onRecordCallbacks.add(cb);
    return () => this.onRecordCallbacks.delete(cb);
  }

  public onSummaryChange(cb: (summary: DashboardSummary) => void): () => void {
    this.onSummaryCallbacks.add(cb);
    return () => this.onSummaryCallbacks.delete(cb);
  }

  public updateConfig(newConfig: AtojAppConfig): void {
    const wasWatching = this.isWatching;
    this.stop();
    this.config = newConfig;
    this.logger.setLogDir(newConfig.paths.logDir);
    if (wasWatching) {
      this.start();
    } else {
      this.emitSummary();
    }
  }

  public start(): void {
    if (this.isWatching) return;

    const existingSources = this.config.paths.sources.filter((p) => {
      const ok = fs.existsSync(p) && fs.statSync(p).isDirectory();
      if (!ok) {
        this.logger.write('Observer', 'ERROR', `[경로 오류] 존재하지 않는 경로: ${p}`);
      }
      return ok;
    });

    this.isWatching = true;

    if (existingSources.length === 0) {
      this.logger.write('Observer', 'ERROR', '[옵저버 실행 대기] 유효한 감시 폴더가 없습니다.');
      this.emitSummary();
      return;
    }

    this.watcher = chokidar.watch(existingSources, {
      persistent: true,
      ignoreInitial: !this.config.watcher.scanExistingOnStart,
      awaitWriteFinish: {
        stabilityThreshold: Math.max((this.config.watcher.writeStabilitySec || 1) * 1000, 500),
        pollInterval: 200,
      },
    });

    this.watcher.on('add', (filePath) => {
      void this.processFile(filePath);
    });

    this.watcher.on('unlink', (filePath) => {
      this.logger.write('Watchdog', 'INFO', `[파일 삭제 이벤트 발생] ${filePath}`);
    });

    this.logger.write('Observer', 'INFO', '[옵저버 실행됨]');
    this.logger.write('Watchdog', 'INFO', '[와치독 실행됨]');
    this.emitSummary();
  }

  public stop(): void {
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }
    if (this.isWatching) {
      this.isWatching = false;
      this.logger.write('Observer', 'INFO', '[옵저버 종료됨]');
      this.logger.write('Watchdog', 'INFO', '[와치독 종료됨]');
      this.emitSummary();
    }
  }

  public scanAllSourceFoldersNow(): number {
    let count = 0;
    for (const srcDir of this.config.paths.sources) {
      if (!fs.existsSync(srcDir)) continue;
      const files = this.walkFilesRecursive(srcDir);
      for (const f of files) {
        count++;
        void this.processFile(f);
      }
    }
    return count;
  }

  private walkFilesRecursive(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...this.walkFilesRecursive(full));
        } else if (entry.isFile()) {
          results.push(full);
        }
      }
    } catch {
      // 권한 오류 등 무시
    }
    return results;
  }

  public async processFile(filePath: string, forceManual = false): Promise<ConversionRecord | null> {
    const resolved = path.resolve(filePath);
    if (this.processingSet.has(resolved)) return null;
    if (!fs.existsSync(resolved)) return null;

    this.processingSet.add(resolved);
    this.emitSummary();

    try {
      const fileName = path.basename(resolved);
      this.logger.write('Watchdog', 'INFO', `[새로운 파일 생성 이벤트 발생] ${resolved}`);

      if (!forceManual && !validateAverFileName(resolved)) {
        this.logger.write('Watchdog', 'INFO', `[아규격 파일 아님] ${resolved}`);
        this.handleInvalidFile(resolved);

        const skipped = this.repo.insert({
          sourcePath: resolved,
          sourceFileName: fileName,
          targetPath: null,
          targetFileName: null,
          deviceCode: '-',
          carNum: '-',
          enfCode: '-',
          enfSpeed: 0,
          lane: 0,
          carType: 0,
          violationTime: '-',
          imageCount: 0,
          fileSize: fs.existsSync(resolved) ? fs.statSync(resolved).size : 0,
          status: 'SKIPPED',
          errorMessage: `아규격 파일명 정규식 불일치 (정책: ${this.config.watcher.invalidFilePolicy})`,
        });

        this.emitRecord(skipped);
        return skipped;
      }

      const targetDirResolved = resolveAppPath(this.config.paths.targetDir);
      const { outputFilePath, packed } = convertAverFileToJver(
        resolved,
        targetDirResolved,
      );
      const { header, trackingImages } = packed.parsed;
      const rawTime17 = `${header.enfDate}${header.enfTime}000`;

      this.logger.write('Watchdog', 'INFO', '[자규격 파일 저장 완료]');
      this.logger.write('Watchdog', 'INFO', `소스폴더: ${path.dirname(resolved)}`);
      this.logger.write('Watchdog', 'INFO', `타겟폴더: ${targetDirResolved}`);
      this.logger.write('Watchdog', 'INFO', `파일경로: ${outputFilePath}`);

      if (!forceManual && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }

      const record = this.repo.insert({
        sourcePath: resolved,
        sourceFileName: fileName,
        targetPath: outputFilePath,
        targetFileName: packed.fileName,
        deviceCode: header.deviceCode,
        carNum: header.carNum,
        enfCode: header.enfCode,
        enfSpeed: header.enfSpeed,
        lane: header.lane,
        carType: header.carType,
        violationTime: formatViolationTimestamp(rawTime17),
        imageCount: 2 + trackingImages.length,
        fileSize: packed.buffer.length,
        status: 'SUCCESS',
        errorMessage: null,
      });

      this.emitRecord(record);
      return record;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.write('Watchdog', 'ERROR', `[자규격 변환 실패] ${message}`);

      const failed = this.repo.insert({
        sourcePath: resolved,
        sourceFileName: path.basename(resolved),
        targetPath: null,
        targetFileName: null,
        deviceCode: '-',
        carNum: '-',
        enfCode: '-',
        enfSpeed: 0,
        lane: 0,
        carType: 0,
        violationTime: '-',
        imageCount: 0,
        fileSize: fs.existsSync(resolved) ? fs.statSync(resolved).size : 0,
        status: 'FAILED',
        errorMessage: message,
      });

      this.emitRecord(failed);
      return failed;
    } finally {
      this.processingSet.delete(resolved);
      this.emitSummary();
    }
  }

  private handleInvalidFile(filePath: string): void {
    try {
      const policy = this.config.watcher.invalidFilePolicy;
      if (policy === 'delete') {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else if (policy === 'quarantine') {
        const qDir = resolveAppPath(this.config.paths.quarantineDir || './quarantine');
        if (!fs.existsSync(qDir)) fs.mkdirSync(qDir, { recursive: true });
        const dest = path.join(qDir, path.basename(filePath));
        fs.renameSync(filePath, dest);
      }
    } catch {
      // 파일 이동/삭제 예외 무시
    }
  }

  public getSummary(): DashboardSummary {
    const stats = this.repo.getStats();
    const watchedFolders = this.config.paths.sources.map((p) => ({
      path: p,
      exists: fs.existsSync(p) && fs.statSync(p).isDirectory(),
    }));

    return {
      isWatching: this.isWatching,
      watchedFolders,
      ...stats,
      queueSize: this.processingSet.size,
    };
  }

  private emitRecord(record: ConversionRecord): void {
    for (const cb of this.onRecordCallbacks) cb(record);
  }

  private emitSummary(): void {
    const summary = this.getSummary();
    for (const cb of this.onSummaryCallbacks) cb(summary);
  }
}
