import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS, type AtojElectronApi } from '@shared/ipc-channels';
import type {
  AtojAppConfig,
  ConversionRecord,
  DashboardSummary,
  HistoryQueryFilter,
} from '@shared/types/domain';

const atojApi: AtojElectronApi = {
  getSummary: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SUMMARY),
  queryHistory: (filter: HistoryQueryFilter) =>
    ipcRenderer.invoke(IPC_CHANNELS.QUERY_HISTORY, filter),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.CLEAR_HISTORY),
  exportHistoryCsv: (filter: HistoryQueryFilter) =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_HISTORY_CSV, filter),
  getConfig: () => ipcRenderer.invoke(IPC_CHANNELS.GET_CONFIG),
  saveConfig: (config: AtojAppConfig) => ipcRenderer.invoke(IPC_CHANNELS.SAVE_CONFIG, config),
  selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY),
  selectInspectFile: () => ipcRenderer.invoke(IPC_CHANNELS.SELECT_INSPECT_FILE),
  inspectBinaryFile: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.INSPECT_BINARY_FILE, filePath),
  convertSingleFile: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONVERT_SINGLE_FILE, filePath),
  toggleWatcher: (enable: boolean) => ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_WATCHER, enable),
  scanSourceFolders: () => ipcRenderer.invoke(IPC_CHANNELS.SCAN_SOURCE_FOLDERS),
  onConversionEvent: (callback: (record: ConversionRecord) => void) => {
    const listener = (_event: IpcRendererEvent, record: ConversionRecord) => callback(record);
    ipcRenderer.on(IPC_CHANNELS.EVENT_CONVERSION, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_CONVERSION, listener);
    };
  },
  onSummaryUpdated: (callback: (summary: DashboardSummary) => void) => {
    const listener = (_event: IpcRendererEvent, summary: DashboardSummary) => callback(summary);
    ipcRenderer.on(IPC_CHANNELS.EVENT_SUMMARY_UPDATED, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.EVENT_SUMMARY_UPDATED, listener);
    };
  },
};

contextBridge.exposeInMainWorld('atojApi', atojApi);
