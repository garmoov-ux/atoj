import fs from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import type {
  ConversionRecord,
  HistoryQueryFilter,
  HistoryQueryResult,
} from '@shared/types/domain';

export interface InsertConversionInput {
  sourcePath: string;
  sourceFileName: string;
  targetPath: string | null;
  targetFileName: string | null;
  deviceCode: string;
  carNum: string;
  enfCode: string;
  enfSpeed: number;
  lane: number;
  carType: number;
  violationTime: string;
  imageCount: number;
  fileSize: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  errorMessage: string | null;
}

interface RawRow {
  id: number;
  source_path: string;
  source_file_name: string;
  target_path: string | null;
  target_file_name: string | null;
  device_code: string;
  car_num: string;
  enf_code: string;
  enf_speed: number;
  lane: number;
  car_type: number;
  violation_time: string;
  image_count: number;
  file_size: number;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error_message: string | null;
  created_at: string;
}

function mapRow(row: RawRow): ConversionRecord {
  return {
    id: row.id,
    sourcePath: row.source_path,
    sourceFileName: row.source_file_name,
    targetPath: row.target_path,
    targetFileName: row.target_file_name,
    deviceCode: row.device_code,
    carNum: row.car_num,
    enfCode: row.enf_code,
    enfSpeed: row.enf_speed,
    lane: row.lane,
    carType: row.car_type,
    violationTime: row.violation_time,
    imageCount: row.image_count,
    fileSize: row.file_size,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export class ConversionRepository {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public insert(input: InsertConversionInput): ConversionRecord {
    const stmt = this.db.prepare(`
      INSERT INTO conversion_history (
        source_path, source_file_name, target_path, target_file_name,
        device_code, car_num, enf_code, enf_speed, lane, car_type,
        violation_time, image_count, file_size, status, error_message
      ) VALUES (
        @sourcePath, @sourceFileName, @targetPath, @targetFileName,
        @deviceCode, @carNum, @enfCode, @enfSpeed, @lane, @carType,
        @violationTime, @imageCount, @fileSize, @status, @errorMessage
      )
    `);

    const info = stmt.run(input);
    const getStmt = this.db.prepare('SELECT * FROM conversion_history WHERE id = ?');
    const row = getStmt.get(info.lastInsertRowid) as RawRow;
    return mapRow(row);
  }

  public query(filter: HistoryQueryFilter): HistoryQueryResult {
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (filter.search && filter.search.trim()) {
      conditions.push(
        '(car_num LIKE @search OR device_code LIKE @search OR source_file_name LIKE @search OR target_file_name LIKE @search)',
      );
      params.search = `%${filter.search.trim()}%`;
    }

    if (filter.enfCode && filter.enfCode !== 'ALL') {
      conditions.push('enf_code = @enfCode');
      params.enfCode = filter.enfCode;
    }

    if (filter.status && filter.status !== 'ALL') {
      conditions.push('status = @status');
      params.status = filter.status;
    }

    if (filter.dateFrom) {
      conditions.push('date(created_at) >= date(@dateFrom)');
      params.dateFrom = filter.dateFrom;
    }

    if (filter.dateTo) {
      conditions.push('date(created_at) <= date(@dateTo)');
      params.dateTo = filter.dateTo;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = Math.min(Math.max(filter.limit ?? 100, 1), 1000);
    const offset = Math.max(filter.offset ?? 0, 0);

    const countStmt = this.db.prepare(
      `SELECT COUNT(*) as cnt FROM conversion_history ${whereClause}`,
    );
    const { cnt } = countStmt.get(params) as { cnt: number };

    const listStmt = this.db.prepare(`
      SELECT * FROM conversion_history
      ${whereClause}
      ORDER BY id DESC
      LIMIT @limit OFFSET @offset
    `);

    const rows = listStmt.all({ ...params, limit, offset }) as RawRow[];
    return {
      items: rows.map(mapRow),
      total: cnt,
    };
  }

  public getStats(): {
    totalConverted: number;
    todayConverted: number;
    speedCount: number;
    signalCount: number;
    failedCount: number;
  } {
    const row = this.db
      .prepare(`
        SELECT
          SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as totalConverted,
          SUM(CASE WHEN status = 'SUCCESS' AND date(created_at) = date('now', 'localtime') THEN 1 ELSE 0 END) as todayConverted,
          SUM(CASE WHEN status = 'SUCCESS' AND enf_code = '1' THEN 1 ELSE 0 END) as speedCount,
          SUM(CASE WHEN status = 'SUCCESS' AND enf_code = '3' THEN 1 ELSE 0 END) as signalCount,
          SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failedCount
        FROM conversion_history
      `)
      .get() as Record<string, number | null>;

    return {
      totalConverted: row?.totalConverted ?? 0,
      todayConverted: row?.todayConverted ?? 0,
      speedCount: row?.speedCount ?? 0,
      signalCount: row?.signalCount ?? 0,
      failedCount: row?.failedCount ?? 0,
    };
  }

  public clearAll(): number {
    const info = this.db.prepare('DELETE FROM conversion_history').run();
    return info.changes;
  }

  public purgeOlderThanDays(days: number): number {
    if (days <= 0) return 0;
    const stmt = this.db.prepare(`
      DELETE FROM conversion_history
      WHERE datetime(created_at) < datetime('now', 'localtime', @modifier)
    `);
    const info = stmt.run({ modifier: `-${Math.floor(days)} days` });
    return info.changes;
  }

  public exportToCsv(filter: HistoryQueryFilter, outputPath: string): number {
    const { items } = this.query({ ...filter, limit: 1000, offset: 0 });
    const header = [
      'ID',
      '처리상태',
      '위반구분',
      '장비코드',
      '차량번호',
      '차로',
      '위반속도(km/h)',
      '위반일시',
      '원본파일명',
      '자규격파일명(.DAT)',
      '파일크기(Byte)',
      '오류메시지',
      '변환시각',
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
      const str = val == null ? '' : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [header.join(',')];
    for (const r of items) {
      const enfLabel = r.enfCode === '1' ? '속도위반' : r.enfCode === '3' ? '신호위반' : r.enfCode;
      lines.push(
        [
          r.id,
          r.status,
          enfLabel,
          r.deviceCode,
          r.carNum,
          r.lane,
          r.enfSpeed,
          r.violationTime,
          r.sourceFileName,
          r.targetFileName,
          r.fileSize,
          r.errorMessage,
          r.createdAt,
        ]
          .map(escapeCsv)
          .join(','),
      );
    }

    const resolved = path.resolve(outputPath);
    const bom = '\uFEFF';
    fs.writeFileSync(resolved, bom + lines.join('\r\n'), 'utf-8');
    return items.length;
  }
}
