import { dialog, ipcMain, type BrowserWindow } from 'electron';
import type { ConfigManager } from '../config/config-manager';
import type { ConversionRepository } from '../db/conversion-repo';
import type { FolderWatcherService } from '../watcher/folder-watcher';
import { inspectBinaryFile } from '../converter/dat-reader';
import { IPC_CHANNELS, type IpcResult } from '@shared/ipc-channels';
import type { AtojAppConfig, HistoryQueryFilter } from '@shared/types/domain';

function wrapIpc<T>(fn: () => T | Promise<T>): Promise<IpcResult<T>> {
  return Promise.resolve()
    .then(fn)
    .then((data) => ({ success: true, data }))
    .catch((err: unknown) => ({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }));
}

export function registerIpcHandlers(
  mainWindowGetter: () => BrowserWindow | null,
  configManager: ConfigManager,
  repo: ConversionRepository,
  watcherService: FolderWatcherService,
): void {
  ipcMain.handle(IPC_CHANNELS.GET_SUMMARY, () =>
    wrapIpc(() => watcherService.getSummary()),
  );

  ipcMain.handle(IPC_CHANNELS.QUERY_HISTORY, (_event, filter: HistoryQueryFilter) =>
    wrapIpc(() => repo.query(filter || {})),
  );

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () =>
    wrapIpc(() => {
      const deleted = repo.clearAll();
      return { deleted };
    }),
  );

  ipcMain.handle(IPC_CHANNELS.EXPORT_HISTORY_CSV, async (_event, filter: HistoryQueryFilter) =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const saveRes = await dialog.showSaveDialog(win!, {
        title: '변환 이력 CSV 내보내기',
        defaultPath: `AtoJ_변환이력_${today}.csv`,
        filters: [{ name: 'CSV 파일 (*.csv)', extensions: ['csv'] }],
      });

      if (saveRes.canceled || !saveRes.filePath) {
        throw new Error('내보내기가 취소되었습니다.');
      }

      const count = repo.exportToCsv(filter || {}, saveRes.filePath);
      return { filePath: saveRes.filePath, count };
    }),
  );

  ipcMain.handle(IPC_CHANNELS.GET_CONFIG, () =>
    wrapIpc(() => configManager.loadConfig()),
  );

  ipcMain.handle(IPC_CHANNELS.SAVE_CONFIG, (_event, newConfig: AtojAppConfig) =>
    wrapIpc(() => {
      const saved = configManager.saveConfig(newConfig);
      watcherService.updateConfig(saved);
      return saved;
    }),
  );

  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const res = await dialog.showOpenDialog(win!, {
        title: '폴더 선택',
        properties: ['openDirectory', 'createDirectory'],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      return res.filePaths[0].replace(/\\/g, '/');
    }),
  );

  ipcMain.handle(IPC_CHANNELS.SELECT_INSPECT_FILE, async () =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const res = await dialog.showOpenDialog(win!, {
        title: '자규격(.DAT) 또는 아규격 단속 파일 선택',
        properties: ['openFile'],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      return res.filePaths[0];
    }),
  );

  ipcMain.handle(IPC_CHANNELS.INSPECT_BINARY_FILE, (_event, filePath: string) =>
    wrapIpc(() => inspectBinaryFile(filePath)),
  );

  ipcMain.handle(IPC_CHANNELS.CONVERT_SINGLE_FILE, async (_event, filePath: string) =>
    wrapIpc(async () => {
      const record = await watcherService.processFile(filePath, true);
      if (!record) {
        throw new Error('파일 변환을 수행할 수 없습니다.');
      }
      if (record.status === 'FAILED') {
        throw new Error(record.errorMessage || '변환 실패');
      }
      return record;
    }),
  );

  ipcMain.handle(IPC_CHANNELS.TOGGLE_WATCHER, (_event, enable: boolean) =>
    wrapIpc(() => {
      if (enable) {
        watcherService.start();
      } else {
        watcherService.stop();
      }
      return watcherService.getSummary();
    }),
  );

  ipcMain.handle(IPC_CHANNELS.SCAN_SOURCE_FOLDERS, () =>
    wrapIpc(() => {
      const scannedCount = watcherService.scanAllSourceFoldersNow();
      return { scannedCount };
    }),
  );

  watcherService.onConversion((record) => {
    const win = mainWindowGetter();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.EVENT_CONVERSION, record);
    }
  });

  watcherService.onSummaryChange((summary) => {
    const win = mainWindowGetter();
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.EVENT_SUMMARY_UPDATED, summary);
    }
  });
}
