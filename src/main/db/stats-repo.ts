import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { getAppBaseDir, resolveAppPath } from '../config/app-paths';
import type {
  AtojAppConfig,
  DailyStatItem,
  DeviceStatItem,
  MonthlyStatsReport,
  StorageFolderItem,
} from '@shared/types/domain';

function getCurrentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthlyStatsReport(
  db: Database.Database,
  requestedYearMonth?: string,
): MonthlyStatsReport {
  const monthRows = db
    .prepare(
      `SELECT DISTINCT strftime('%Y-%m', CASE WHEN violation_time LIKE '____-__-__%' THEN violation_time ELSE created_at END) as ym
       FROM conversion_history
       WHERE ym IS NOT NULL
       ORDER BY ym DESC`,
    )
    .all() as { ym: string }[];

  const latestDataMonth = monthRows.find((r) => Boolean(r.ym))?.ym;
  const yearMonth =
    requestedYearMonth && /^\d{4}-\d{2}$/.test(requestedYearMonth)
      ? requestedYearMonth
      : latestDataMonth || getCurrentYearMonth();

  const availableSet = new Set<string>([getCurrentYearMonth(), yearMonth]);
  for (const r of monthRows) {
    if (r.ym) availableSet.add(r.ym);
  }
  const availableMonths = Array.from(availableSet).sort((a, b) => b.localeCompare(a));

  const summaryRow = db
    .prepare(
      `SELECT
         COUNT(*) as totalProcessed,
         SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as totalSuccess,
         SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as totalFailed,
         SUM(CASE WHEN status = 'SKIPPED' THEN 1 ELSE 0 END) as totalSkipped,
         SUM(CASE WHEN status = 'SUCCESS' AND enf_code = '1' THEN 1 ELSE 0 END) as speedCount,
         SUM(CASE WHEN status = 'SUCCESS' AND enf_code = '3' THEN 1 ELSE 0 END) as signalCount,
         ROUND(AVG(CASE WHEN status = 'SUCCESS' AND enf_speed > 0 THEN enf_speed ELSE NULL END), 1) as avgSpeed,
         MAX(CASE WHEN status = 'SUCCESS' THEN enf_speed ELSE 0 END) as maxSpeed,
         COUNT(DISTINCT CASE WHEN status = 'SUCCESS' AND device_code != '-' THEN device_code ELSE NULL END) as activeDeviceCount
       FROM conversion_history
       WHERE strftime('%Y-%m', CASE WHEN violation_time LIKE '____-__-__%' THEN violation_time ELSE created_at END) = @yearMonth`,
    )
    .get({ yearMonth }) as Record<string, number | null>;

  const dailyRows = db
    .prepare(
      `SELECT
         strftime('%Y-%m-%d', CASE WHEN violation_time LIKE '____-__-__%' THEN violation_time ELSE created_at END) as day,
         SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as totalCount,
         SUM(CASE WHEN status = 'SUCCESS' AND enf_code = '1' THEN 1 ELSE 0 END) as speedCount,
         SUM(CASE WHEN status = 'SUCCESS' AND enf_code = '3' THEN 1 ELSE 0 END) as signalCount,
         SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failedCount
       FROM conversion_history
       WHERE strftime('%Y-%m', CASE WHEN violation_time LIKE '____-__-__%' THEN violation_time ELSE created_at END) = @yearMonth
       GROUP BY day
       ORDER BY day ASC`,
    )
    .all({ yearMonth }) as {
    day: string;
    totalCount: number;
    speedCount: number;
    signalCount: number;
    failedCount: number;
  }[];

  const dailyStats: DailyStatItem[] = dailyRows
    .filter((d) => Boolean(d.day))
    .map((d) => ({
      day: d.day,
      label: `${d.day.slice(8, 10)}일`,
      totalCount: d.totalCount ?? 0,
      speedCount: d.speedCount ?? 0,
      signalCount: d.signalCount ?? 0,
      failedCount: d.failedCount ?? 0,
    }));

  const deviceRows = db
    .prepare(
      `SELECT
         device_code as deviceCode,
         COUNT(*) as totalCount,
         SUM(CASE WHEN enf_code = '1' THEN 1 ELSE 0 END) as speedCount,
         SUM(CASE WHEN enf_code = '3' THEN 1 ELSE 0 END) as signalCount,
         ROUND(AVG(CASE WHEN enf_speed > 0 THEN enf_speed ELSE NULL END), 1) as avgSpeed,
         MAX(enf_speed) as maxSpeed
       FROM conversion_history
       WHERE status = 'SUCCESS'
         AND strftime('%Y-%m', CASE WHEN violation_time LIKE '____-__-__%' THEN violation_time ELSE created_at END) = @yearMonth
       GROUP BY device_code
       ORDER BY totalCount DESC`,
    )
    .all({ yearMonth }) as DeviceStatItem[];

  return {
    yearMonth,
    availableMonths,
    totalProcessed: summaryRow?.totalProcessed ?? 0,
    totalSuccess: summaryRow?.totalSuccess ?? 0,
    totalFailed: summaryRow?.totalFailed ?? 0,
    totalSkipped: summaryRow?.totalSkipped ?? 0,
    speedCount: summaryRow?.speedCount ?? 0,
    signalCount: summaryRow?.signalCount ?? 0,
    avgSpeed: summaryRow?.avgSpeed ?? 0,
    maxSpeed: summaryRow?.maxSpeed ?? 0,
    activeDeviceCount: summaryRow?.activeDeviceCount ?? 0,
    dailyStats,
    deviceStats: deviceRows.map((r) => ({
      deviceCode: r.deviceCode,
      totalCount: r.totalCount ?? 0,
      speedCount: r.speedCount ?? 0,
      signalCount: r.signalCount ?? 0,
      avgSpeed: r.avgSpeed ?? 0,
      maxSpeed: r.maxSpeed ?? 0,
    })),
  };
}

function measureDirectory(dirPath: string): { exists: boolean; fileCount: number; totalBytes: number } {
  if (!fs.existsSync(dirPath)) return { exists: false, fileCount: 0, totalBytes: 0 };
  let fileCount = 0;
  let totalBytes = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        fileCount++;
        totalBytes += fs.statSync(full).size;
      } else if (entry.isDirectory() && entry.name === 'snapshots') {
        const sub = measureDirectory(full);
        fileCount += sub.fileCount;
        totalBytes += sub.totalBytes;
      }
    }
  } catch {
    // 권한 오류 무시
  }
  return { exists: true, fileCount, totalBytes };
}

export function getStorageFoldersInfo(config: AtojAppConfig): StorageFolderItem[] {
  const baseDir = getAppBaseDir();
  const defs: {
    key: StorageFolderItem['key'];
    label: string;
    description: string;
    relativePath: string;
    resolvedPath: string;
  }[] = [
    {
      key: 'base',
      label: '프로그램 실행 기준 폴더',
      description: 'config.json 환경설정 및 실행 파일 위치',
      relativePath: './',
      resolvedPath: baseDir,
    },
    {
      key: 'target',
      label: '자규격(.DAT) 변환 결과 폴더',
      description: '변환 완료된 자규격 단속 파일 출력 폴더',
      relativePath: config.paths.targetDir,
      resolvedPath: resolveAppPath(config.paths.targetDir),
    },
    {
      key: 'log',
      label: '실시간 운용 로그 폴더',
      description: '일자별 감시엔진·변환처리·시스템 한글 로그',
      relativePath: config.paths.logDir,
      resolvedPath: resolveAppPath(config.paths.logDir),
    },
    {
      key: 'data',
      label: '내부 DB 및 영상 스냅샷 폴더',
      description: '외부 반출 대비 단속 영상·헤더 스냅샷 및 SQLite DB',
      relativePath: './data',
      resolvedPath: resolveAppPath('./data'),
    },
    {
      key: 'quarantine',
      label: '비규격 파일 격리 폴더',
      description: '파일명 규칙 불일치 비규격 파일 안전 격리소',
      relativePath: config.paths.quarantineDir || './quarantine',
      resolvedPath: resolveAppPath(config.paths.quarantineDir || './quarantine'),
    },
  ];

  return defs.map((d) => {
    const stat = measureDirectory(d.resolvedPath);
    return {
      ...d,
      ...stat,
    };
  });
}
