export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS conversion_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_path TEXT NOT NULL,
  source_file_name TEXT NOT NULL,
  target_path TEXT,
  target_file_name TEXT,
  snapshot_path TEXT,
  header_json TEXT,
  device_code TEXT NOT NULL DEFAULT '-',
  car_num TEXT NOT NULL DEFAULT '-',
  enf_code TEXT NOT NULL DEFAULT '-',
  enf_speed INTEGER NOT NULL DEFAULT 0,
  lane INTEGER NOT NULL DEFAULT 0,
  car_type INTEGER NOT NULL DEFAULT 1,
  violation_time TEXT NOT NULL DEFAULT '-',
  image_count INTEGER NOT NULL DEFAULT 0,
  file_size INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'FAILED', 'SKIPPED')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_conversion_created_at ON conversion_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_car_num ON conversion_history(car_num);
CREATE INDEX IF NOT EXISTS idx_conversion_device_code ON conversion_history(device_code);
CREATE INDEX IF NOT EXISTS idx_conversion_enf_code ON conversion_history(enf_code);
CREATE INDEX IF NOT EXISTS idx_conversion_status ON conversion_history(status);
`;
