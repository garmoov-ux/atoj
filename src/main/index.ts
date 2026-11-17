import { join } from 'node:path';
import { app, BrowserWindow, shell } from 'electron';
import { ConfigManager } from './config/config-manager';
import { createDatabaseConnection } from './db/connection';
import { ConversionRepository } from './db/conversion-repo';
import { FolderWatcherService } from './watcher/folder-watcher';
import { RetentionCleanerService } from './watcher/retention-cleaner';
import { createAtojAppIcon, TrayManager } from './tray';
import { registerIpcHandlers } from './ipc/handlers';
import type { AtojAppConfig } from '@shared/types/domain';

let mainWindow: BrowserWindow | null = null;
let watcherService: FolderWatcherService | null = null;
let retentionCleaner: RetentionCleanerService | null = null;
let trayManager: TrayManager | null = null;
let currentConfig: AtojAppConfig | null = null;
let isQuitting = false;

function createMainWindow(): BrowserWindow {
  const appIcon = createAtojAppIcon(64);
  const win = new BrowserWindow({
    width: 1040,
    height: 680,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f1f5f9',
    icon: appIcon,
    title: 'AtoJ - 무인교통단속장비 규격 변환기',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  // 창 닫기(X) 클릭 시 설정에 따라 종료 대신 작업표시줄 트레이로 숨김
  win.on('close', (event) => {
    if (!isQuitting && currentConfig?.system?.minimizeToTrayOnClose) {
      event.preventDefault();
      win.hide();
    }
  });

  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}

const isDev = Boolean(process.env['ELECTRON_RENDERER_URL']);
if (isDev) {
  app.setPath('userData', join(app.getPath('appData'), 'atoj-dev'));
}

const gotTheLock = isDev ? true : app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  void app.whenReady().then(() => {
    const configManager = new ConfigManager();
    currentConfig = configManager.loadConfig();
    const db = createDatabaseConnection();
    const repo = new ConversionRepository(db);

    watcherService = new FolderWatcherService(currentConfig, repo);
    retentionCleaner = new RetentionCleanerService(currentConfig, repo);

    registerIpcHandlers(
      () => mainWindow,
      configManager,
      repo,
      watcherService,
      retentionCleaner,
      (updated) => {
        currentConfig = updated;
      },
    );

    mainWindow = createMainWindow();

    trayManager = new TrayManager(
      () => mainWindow,
      watcherService,
      () => {
        isQuitting = true;
      },
    );
    trayManager.init();

    watcherService.start();
    retentionCleaner.startPeriodicCleanup();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      } else {
        mainWindow?.show();
      }
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
    retentionCleaner?.stopPeriodicCleanup();
    watcherService?.stop();
    trayManager?.destroy();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin' && isQuitting) {
      app.quit();
    }
  });
}
