import fs from 'node:fs';
import path from 'node:path';
import { resolveAppPath } from '../config/app-paths';
import type { LogEntry } from '@shared/types/domain';

function getTodayCompact(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function getTimestampFormatted(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

export type LogCategory = '감시엔진' | '변환처리' | '자동정리' | '시스템';
export type LogLevel = '정보' | '주의' | '오류';

const LOG_LINE_REGEX = /^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*)$/;

export class FileLogger {
  private logDir: string;

  constructor(logDir: string) {
    this.logDir = resolveAppPath(logDir);
    this.ensureDir();
  }

  public setLogDir(logDir: string): void {
    this.logDir = resolveAppPath(logDir);
    this.ensureDir();
  }

  public getResolvedLogDir(): string {
    return this.logDir;
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public write(
    scope: 'Watchdog' | 'Observer' | LogCategory,
    level: 'INFO' | 'ERROR' | 'WARNING' | LogLevel,
    message: string,
  ): void {
    try {
      this.ensureDir();

      const categoryLabel: LogCategory =
        scope === 'Watchdog'
          ? '변환처리'
          : scope === 'Observer'
            ? '감시엔진'
            : scope;

      const levelLabel: LogLevel =
        level === 'INFO'
          ? '정보'
          : level === 'WARNING'
            ? '주의'
            : level === 'ERROR'
              ? '오류'
              : level;

      const prefix =
        categoryLabel === '변환처리'
          ? 'watchdog'
          : categoryLabel === '감시엔진'
            ? 'observer'
            : 'system';

      const fileName = `${prefix}_${getTodayCompact()}.log`;
      const fullPath = path.join(this.logDir, fileName);
      const line = `[${getTimestampFormatted()}] [${categoryLabel}] [${levelLabel}] ${message}\r\n`;
      fs.appendFileSync(fullPath, line, 'utf-8');
    } catch {
      // 파일 로깅 실패 시 앱 중단 방지
    }
  }

  public readRecentLogs(limit = 300): LogEntry[] {
    try {
      if (!fs.existsSync(this.logDir)) return [];

      const entries = fs
        .readdirSync(this.logDir, { withFileTypes: true })
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.log'))
        .map((e) => {
          const full = path.join(this.logDir, e.name);
          const mtimeMs = fs.statSync(full).mtimeMs;
          return { name: e.name, full, mtimeMs };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs)
        .slice(0, 6);

      const parsed: LogEntry[] = [];
      let seq = 0;

      for (const file of entries) {
        const raw = fs.readFileSync(file.full, 'utf-8');
        const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
        for (const line of lines) {
          seq++;
          const m = LOG_LINE_REGEX.exec(line);
          if (m) {
            parsed.push({
              id: `${file.name}-${seq}`,
              timestamp: m[1],
              category: m[2],
              level: m[3],
              message: m[4],
              fileName: file.name,
            });
          } else {
            parsed.push({
              id: `${file.name}-${seq}`,
              timestamp: '-',
              category: '기타',
              level: '정보',
              message: line,
              fileName: file.name,
            });
          }
        }
      }

      parsed.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return parsed.slice(0, Math.min(Math.max(limit, 50), 1000));
    } catch {
      return [];
    }
  }
}
