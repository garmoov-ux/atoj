import { app, Menu, nativeImage, Tray, type BrowserWindow } from 'electron';
import type { FolderWatcherService } from './watcher/folder-watcher';

function createTrayIconImage(): Electron.NativeImage {
  // 16x16 RGBA 아이콘 비트맵 생성 (Action Blue #0066cc 원형 뱃지)
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  const center = (size - 1) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.hypot(x - center, y - center);

      if (dist <= 7.2) {
        // 내부 흰색 중심점
        if (dist <= 2.6) {
          buf[idx] = 255; // B
          buf[idx + 1] = 255; // G
          buf[idx + 2] = 255; // R
          buf[idx + 3] = 255; // A
        } else {
          // BGRA 포맷: #0066cc -> B=204, G=102, R=0
          buf[idx] = 204;
          buf[idx + 1] = 102;
          buf[idx + 2] = 0;
          buf[idx + 3] = 255;
        }
      } else {
        buf[idx + 3] = 0;
      }
    }
  }

  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

export class TrayManager {
  private tray: Tray | null = null;
  private readonly getWindow: () => BrowserWindow | null;
  private readonly watcher: FolderWatcherService;
  private readonly onQuitRequest: () => void;

  constructor(
    getWindow: () => BrowserWindow | null,
    watcher: FolderWatcherService,
    onQuitRequest: () => void,
  ) {
    this.getWindow = getWindow;
    this.watcher = watcher;
    this.onQuitRequest = onQuitRequest;
  }

  public init(): void {
    if (this.tray) return;

    const icon = createTrayIconImage();
    this.tray = new Tray(icon);
    this.tray.setToolTip('AtoJ - 무인교통단속장비 간이서버(아규격->자규격) 시스템');

    this.tray.on('click', () => {
      this.showMainWindow();
    });

    this.tray.on('double-click', () => {
      this.showMainWindow();
    });

    this.watcher.onSummaryChange(() => {
      this.refreshMenu();
    });

    this.refreshMenu();
  }

  public showMainWindow(): void {
    const win = this.getWindow();
    if (!win) return;
    if (!win.isVisible()) {
      win.show();
    }
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }

  public refreshMenu(): void {
    if (!this.tray) return;

    const summary = this.watcher.getSummary();
    const menu = Menu.buildFromTemplate([
      {
        label: 'AtoJ 간이서버 창 열기',
        click: () => this.showMainWindow(),
      },
      { type: 'separator' },
      {
        label: summary.isWatching ? '상태: 실시간 감시 작동 중 (일시정지)' : '상태: 감시 정지됨 (감시 시작)',
        click: () => {
          if (summary.isWatching) {
            this.watcher.stop();
          } else {
            this.watcher.start();
          }
          this.refreshMenu();
        },
      },
      {
        label: '수신 폴더 전체 점검 실행',
        click: () => {
          this.watcher.scanAllSourceFoldersNow();
        },
      },
      { type: 'separator' },
      {
        label: '프로그램 완전 종료',
        click: () => {
          this.onQuitRequest();
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(menu);
  }

  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
