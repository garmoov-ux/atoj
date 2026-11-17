import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { resolveAppPath } from '../config/app-paths';
import { SCHEMA_SQL } from './schema';

export function createDatabaseConnection(customDbPath?: string): Database.Database {
  const dbPath = customDbPath || process.env.ATOJ_DB_PATH || './data/app.db';

  if (dbPath !== ':memory:') {
    const resolvedFile = resolveAppPath(dbPath);
    const resolvedDir = path.dirname(resolvedFile);
    if (!fs.existsSync(resolvedDir)) {
      fs.mkdirSync(resolvedDir, { recursive: true });
    }
  }

  const db = new Database(dbPath === ':memory:' ? ':memory:' : resolveAppPath(dbPath));

  // 보안 및 성능 최적화 Pragma 설정
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  db.exec(SCHEMA_SQL);

  return db;
}
