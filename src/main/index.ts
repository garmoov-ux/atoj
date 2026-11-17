import { join } from 'node:path';
import { app, BrowserWindow, shell } from 'electron';
import { ConfigManager } from './config/config-manager';
import { createDatabaseConnection } from './db/connection';
import { ConversionRepository } from './db/conversion-repo';
import { FolderWatcherService } from './watcher/folder-watcher';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;
let watcherService: FolderWatcherService | null = null;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f5f5f7',
    title: 'AtoJ — 무인교통단속장비 아규격·자규격(.DAT) 실시간 변환 관제',
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

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  void app.whenReady().then(() => {
    const configManager = new ConfigManager();
    const initialConfig = configManager.loadConfig();
    const db = createDatabaseConnection();
    const repo = new ConversionRepository(db);

    watcherService = new FolderWatcherService(initialConfig, repo);
    registerIpcHandlers(() => mainWindow, configManager, repo, watcherService);

    mainWindow = createMainWindow();

    // 앱 시작 시 자동 감시 개시
    watcherService.start();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      }
    });
  });

  app.on('before-quit', () => {
    watcherService?.stop();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
