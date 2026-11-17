import type {
  AtojAppConfig,
  ConversionRecord,
  DashboardSummary,
  DatInspectionResult,
  HistoryQueryFilter,
  HistoryQueryResult,
  RetentionCleanupResult,
} from './types/domain';

export const IPC_CHANNELS = {
  GET_SUMMARY: 'atoj:get-summary',
  GET_RECENT_LOGS: 'atoj:get-recent-logs',
  QUERY_HISTORY: 'atoj:query-history',
  CLEAR_HISTORY: 'atoj:clear-history',
  EXPORT_HISTORY_CSV: 'atoj:export-history-csv',
  GET_CONFIG: 'atoj:get-config',
  SAVE_CONFIG: 'atoj:save-config',
  SELECT_DIRECTORY: 'atoj:select-directory',
  SELECT_INSPECT_FILE: 'atoj:select-inspect-file',
  INSPECT_BINARY_FILE: 'atoj:inspect-binary-file',
  CONVERT_SINGLE_FILE: 'atoj:convert-single-file',
  TOGGLE_WATCHER: 'atoj:toggle-watcher',
  SCAN_SOURCE_FOLDERS: 'atoj:scan-source-folders',
  RUN_RETENTION_CLEANUP: 'atoj:run-retention-cleanup',
  EVENT_CONVERSION: 'atoj:event-conversion',
  EVENT_SUMMARY_UPDATED: 'atoj:event-summary-updated',
} as const;

export interface IpcResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AtojElectronApi {
  getSummary: () => Promise<IpcResult<DashboardSummary>>;
  queryHistory: (filter: HistoryQueryFilter) => Promise<IpcResult<HistoryQueryResult>>;
  clearHistory: () => Promise<IpcResult<{ deleted: number }>>;
  exportHistoryCsv: (filter: HistoryQueryFilter) => Promise<IpcResult<{ filePath: string; count: number }>>;
  getConfig: () => Promise<IpcResult<AtojAppConfig>>;
  saveConfig: (config: AtojAppConfig) => Promise<IpcResult<AtojAppConfig>>;
  selectDirectory: () => Promise<IpcResult<string | null>>;
  selectInspectFile: () => Promise<IpcResult<string | null>>;
  inspectBinaryFile: (filePath: string) => Promise<IpcResult<DatInspectionResult>>;
  convertSingleFile: (filePath: string) => Promise<IpcResult<ConversionRecord>>;
  toggleWatcher: (enable: boolean) => Promise<IpcResult<DashboardSummary>>;
  scanSourceFolders: () => Promise<IpcResult<{ scannedCount: number }>>;
  runRetentionCleanup: () => Promise<IpcResult<RetentionCleanupResult>>;
  onConversionEvent: (callback: (record: ConversionRecord) => void) => () => void;
  onSummaryUpdated: (callback: (summary: DashboardSummary) => void) => () => void;
}
