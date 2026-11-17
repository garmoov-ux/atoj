import fs from 'node:fs';
import path from 'node:path';
import { resolveAppPath } from '../config/app-paths';

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

  private ensureDir(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public write(
    scope: 'Watchdog' | 'Observer',
    level: 'INFO' | 'ERROR' | 'WARNING',
    message: string,
  ): void {
    try {
      this.ensureDir();
      const prefix = scope === 'Watchdog' ? 'watchdog' : 'observer';
      const fileName = `${prefix}_${getTodayCompact()}.log`;
      const fullPath = path.join(this.logDir, fileName);
      const line = `[${getTimestampFormatted()}] [${scope}] [${level}] - ${message}\r\n`;
      fs.appendFileSync(fullPath, line, 'utf-8');
    } catch {
      // 파일 로깅 실패 시 앱 중단 방지
    }
  }
}
