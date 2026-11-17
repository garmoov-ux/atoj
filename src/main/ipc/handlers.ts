import fs from 'node:fs';
import { dialog, ipcMain, shell, type BrowserWindow } from 'electron';
import { resolveAppPath, toPortableRelativeIfInsideBase } from '../config/app-paths';
import type { ConfigManager } from '../config/config-manager';
import type { ConversionRepository } from '../db/conversion-repo';
import { getMonthlyStatsReport, getStorageFoldersInfo } from '../db/stats-repo';
import type { FolderWatcherService } from '../watcher/folder-watcher';
import type { RetentionCleanerService } from '../watcher/retention-cleaner';
import { inspectBinaryFile } from '../converter/dat-reader';
import { inspectConversionRecord } from '../converter/snapshot-archive';
import { generateMonthlyReportPdf } from '../report/pdf-report-generator';
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
  retentionCleaner: RetentionCleanerService,
  onConfigUpdated?: (nextConfig: AtojAppConfig) => void,
): void {
  ipcMain.handle(IPC_CHANNELS.GET_SUMMARY, () =>
    wrapIpc(() => watcherService.getSummary()),
  );

  ipcMain.handle(IPC_CHANNELS.GET_RECENT_LOGS, (_event, limit?: number) =>
    wrapIpc(() => watcherService.getLogger().readRecentLogs(limit ?? 300)),
  );

  ipcMain.handle(IPC_CHANNELS.GET_MONTHLY_STATS, (_event, yearMonth?: string) =>
    wrapIpc(() => getMonthlyStatsReport(repo.getDatabase(), yearMonth)),
  );

  ipcMain.handle(IPC_CHANNELS.EXPORT_MONTHLY_PDF, async (_event, yearMonth: string) =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const report = getMonthlyStatsReport(repo.getDatabase(), yearMonth);
      const saveRes = await dialog.showSaveDialog(win!, {
        title: '발주처 제출용 월간 통계 PDF 보고서 저장',
        defaultPath: `AtoJ_월간단속변환보고서_${report.yearMonth}.pdf`,
        filters: [{ name: 'PDF 문서 (*.pdf)', extensions: ['pdf'] }],
      });

      if (saveRes.canceled || !saveRes.filePath) {
        throw new Error('PDF 보고서 저장이 취소되었습니다.');
      }

      await generateMonthlyReportPdf(report, saveRes.filePath);
      watcherService
        .getLogger()
        .write('시스템', '정보', `월간 단속 변환 통계 PDF 보고서 출력 완료 | 대상연월: ${report.yearMonth} | 저장경로: ${saveRes.filePath}`);
      return { filePath: saveRes.filePath };
    }),
  );

  ipcMain.handle(IPC_CHANNELS.GET_STORAGE_INFO, () =>
    wrapIpc(() => getStorageFoldersInfo(configManager.loadConfig())),
  );

  ipcMain.handle(IPC_CHANNELS.OPEN_FOLDER_PATH, async (_event, targetPath: string) =>
    wrapIpc(async () => {
      const resolved = resolveAppPath(targetPath);
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      await shell.openPath(resolved);
      return { opened: resolved };
    }),
  );

  ipcMain.handle(IPC_CHANNELS.QUERY_HISTORY, (_event, filter: HistoryQueryFilter) =>
    wrapIpc(() => repo.query(filter || {})),
  );

  ipcMain.handle(IPC_CHANNELS.CLEAR_HISTORY, () =>
    wrapIpc(() => {
      const deleted = repo.clearAll();
      watcherService
        .getLogger()
        .write('시스템', '주의', `사용자에 의해 변환 이력 전체 비우기가 실행되었습니다. (삭제 건수: ${deleted}건)`);
      return { deleted };
    }),
  );

  ipcMain.handle(IPC_CHANNELS.EXPORT_HISTORY_CSV, async (_event, filter: HistoryQueryFilter) =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const saveRes = await dialog.showSaveDialog(win!, {
        title: '변환 이력 파일 저장',
        defaultPath: `AtoJ_변환이력_${today}.csv`,
        filters: [{ name: '엑셀 호환 파일 (*.csv)', extensions: ['csv'] }],
      });

      if (saveRes.canceled || !saveRes.filePath) {
        throw new Error('파일 저장이 취소되었습니다.');
      }

      const count = repo.exportToCsv(filter || {}, saveRes.filePath);
      watcherService
        .getLogger()
        .write('시스템', '정보', `변환 이력 목록 파일 저장 완료 | 저장 건수: ${count}건 | 파일 경로: ${saveRes.filePath}`);
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
      retentionCleaner.updateConfig(saved);
      onConfigUpdated?.(saved);
      return saved;
    }),
  );

  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const res = await dialog.showOpenDialog(win!, {
        title: '폴더 선택 (프로그램 하위 폴더 선택 시 ./상대경로 자동 적용)',
        properties: ['openDirectory', 'createDirectory'],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      return toPortableRelativeIfInsideBase(res.filePaths[0]);
    }),
  );

  ipcMain.handle(IPC_CHANNELS.SELECT_INSPECT_FILE, async () =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const res = await dialog.showOpenDialog(win!, {
        title: '자규격 또는 아규격 단속 파일 선택',
        properties: ['openFile'],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      return res.filePaths[0];
    }),
  );

  ipcMain.handle(IPC_CHANNELS.INSPECT_BINARY_FILE, (_event, filePath: string) =>
    wrapIpc(() => {
      const matchedRecord = repo.findByFilePath(filePath);
      if (matchedRecord) {
        const nav = repo.getNavigationMeta(matchedRecord.id);
        return inspectConversionRecord(matchedRecord, nav);
      }
      return inspectBinaryFile(filePath);
    }),
  );

  ipcMain.handle(IPC_CHANNELS.INSPECT_RECORD, (_event, recordId?: number) =>
    wrapIpc(() => {
      const record = recordId ? repo.getById(recordId) : repo.getLatestSuccess();
      if (!record) return null;
      const nav = repo.getNavigationMeta(record.id);
      return inspectConversionRecord(record, nav);
    }),
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

  ipcMain.handle(IPC_CHANNELS.CONVERT_FOLDER_FILES, async () =>
    wrapIpc(async () => {
      const win = mainWindowGetter();
      const res = await dialog.showOpenDialog(win!, {
        title: '일괄 변환할 아규격 단속 파일 폴더 선택',
        properties: ['openDirectory'],
      });
      if (res.canceled || res.filePaths.length === 0) return null;
      return watcherService.convertFolderBatch(res.filePaths[0]);
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

  ipcMain.handle(IPC_CHANNELS.RUN_RETENTION_CLEANUP, () =>
    wrapIpc(() => retentionCleaner.runCleanupNow()),
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
