export type InvalidFilePolicy = 'ignore' | 'quarantine' | 'delete';

export interface AtojPathsConfig {
  sources: string[];
  targetDir: string;
  logDir: string;
  quarantineDir: string;
}

export interface AtojWatcherConfig {
  writeStabilitySec: number;
  scanExistingOnStart: boolean;
  invalidFilePolicy: InvalidFilePolicy;
}

export interface AtojRetentionConfig {
  logDays: number;
  dbHistoryDays: number;
  resultDays: number;
  quarantineDays: number;
}

export interface AtojSystemConfig {
  minimizeToTrayOnClose: boolean;
}

export interface AtojAppConfig {
  paths: AtojPathsConfig;
  watcher: AtojWatcherConfig;
  retention: AtojRetentionConfig;
  system: AtojSystemConfig;
}

export interface RetentionCleanupResult {
  deletedLogs: number;
  deletedDbRows: number;
  deletedResults: number;
  deletedQuarantines: number;
}

export interface AverHeader {
  rawSizeField: string;
  deviceCode: string;
  enfSpeed: number;
  carType: number;
  lane: number;
  enfDate: string;
  enfTime: string;
  carNum: string;
  carNumX: number;
  carNumY: number;
  carNumWidth: number;
  carNumHeight: number;
  useCarNum: number;
  enfCode: '1' | '3' | string;
  enfType: string;
  signalStartPassTime: string;
  signalEndPassTime: string;
  trackingFrameCount: number;
  signalShape: number;
  carDirection: number;
  signalType: number;
  triggerType: string;
}

export interface ParsedAverFile {
  header: AverHeader;
  carImage: Buffer;
  plateImage: Buffer;
  trackingImages: Buffer[];
}

export interface ConversionRecord {
  id: number;
  sourcePath: string;
  sourceFileName: string;
  targetPath: string | null;
  targetFileName: string | null;
  snapshotPath?: string | null;
  headerJson?: string | null;
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
  createdAt: string;
}

export interface DashboardSummary {
  isWatching: boolean;
  watchedFolders: { path: string; exists: boolean }[];
  totalConverted: number;
  todayConverted: number;
  speedCount: number;
  signalCount: number;
  failedCount: number;
  queueSize: number;
}

export interface HistoryQueryFilter {
  search?: string;
  enfCode?: 'ALL' | '1' | '3';
  status?: 'ALL' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryQueryResult {
  items: ConversionRecord[];
  total: number;
}

export type InspectedFileStatus = 'AVAILABLE' | 'EXPORTED_SNAPSHOT' | 'DB_METADATA_ONLY';

export interface DatInspectionResult {
  recordId?: number;
  sourceFileName?: string;
  targetFileName?: string | null;
  deviceCode?: string;
  createdAt?: string;
  fileStatus?: InspectedFileStatus;
  rawHeader?: AverHeader | null;
  prevRecordId?: number | null;
  nextRecordId?: number | null;
  currentPosition?: number;
  totalSuccessCount?: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileFormat: 'JVER_DAT' | 'AVER_RAW';
  violationCode: number;
  violationLabel: string;
  fileVersion: string;
  carType: number;
  carTypeLabel: string;
  carNum: string;
  lane: number;
  violationTime: string;
  hasPlate: number;
  plateBox: { x: number; y: number; width: number; height: number };
  speedLimit?: number;
  violationSpeed: number;
  signalStartPassTime?: number;
  signalEndPassTime?: number;
  signalShape?: number;
  signalShapeLabel?: string;
  carDirection?: number;
  carDirectionLabel?: string;
  signalType?: number;
  trackingCount: number;
  carImageBase64: string | null;
  plateImageBase64: string | null;
  trackingImagesBase64: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  category: string;
  level: string;
  message: string;
  fileName: string;
}

export interface DailyStatItem {
  day: string;
  label: string;
  totalCount: number;
  speedCount: number;
  signalCount: number;
  failedCount: number;
}

export interface DeviceStatItem {
  deviceCode: string;
  totalCount: number;
  speedCount: number;
  signalCount: number;
  avgSpeed: number;
  maxSpeed: number;
}

export interface MonthlyStatsReport {
  yearMonth: string;
  availableMonths: string[];
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  totalSkipped: number;
  speedCount: number;
  signalCount: number;
  avgSpeed: number;
  maxSpeed: number;
  activeDeviceCount: number;
  dailyStats: DailyStatItem[];
  deviceStats: DeviceStatItem[];
}

export interface StorageFolderItem {
  key: 'base' | 'target' | 'log' | 'data' | 'quarantine';
  label: string;
  description: string;
  relativePath: string;
  resolvedPath: string;
  exists: boolean;
  fileCount: number;
  totalBytes: number;
}
