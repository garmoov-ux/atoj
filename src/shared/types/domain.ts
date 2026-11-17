export type InvalidFilePolicy = 'ignore' | 'quarantine' | 'delete';

export interface AtojPathConfig {
  source: string[];
  target: string;
  log: string;
  sleep: number;
}

export interface AtojAppConfig {
  path: AtojPathConfig;
  invalidFilePolicy: InvalidFilePolicy;
  quarantineDir: string;
  scanExistingOnStart: boolean;
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

export interface DatInspectionResult {
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
