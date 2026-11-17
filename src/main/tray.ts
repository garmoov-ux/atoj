import { app, Menu, nativeImage, Tray, type BrowserWindow } from 'electron';
import type { FolderWatcherService } from './watcher/folder-watcher';

// 5x7 픽셀 비트맵 폰트 ('A', '>', 'J')
const GLYPH_A = [
  '01110',
  '10001',
  '10001',
  '11111',
  '10001',
  '10001',
  '10001',
];

const GLYPH_ARROW = [
  '00000',
  '00100',
  '00010',
  '11111',
  '00010',
  '00100',
  '00000',
];

const GLYPH_J = [
  '00111',
  '00010',
  '00010',
  '00010',
  '10010',
  '10010',
  '01100',
];

function drawGlyph(
  buf: Buffer,
  size: number,
  glyph: string[],
  startX: number,
  startY: number,
  scale: number,
): void {
  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[row].length; col++) {
      if (glyph[row][col] !== '1') continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const px = startX + col * scale + sx;
          const py = startY + row * scale + sy;
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const idx = (py * size + px) * 4;
            buf[idx] = 255; // B
            buf[idx + 1] = 255; // G
            buf[idx + 2] = 255; // R
            buf[idx + 3] = 255; // A
          }
        }
      }
    }
  }
}

function insideRoundedRect(x: number, y: number, size: number, pad: number, radius: number): boolean {
  const min = pad;
  const max = size - 1 - pad;
  if (x < min || x > max || y < min || y > max) return false;

  const cx = x < min + radius ? min + radius : x > max - radius ? max - radius : x;
  const cy = y < min + radius ? min + radius : y > max - radius ? max - radius : y;
  return Math.hypot(x - cx, y - cy) <= radius;
}

/**
 * AtoJ 전용 아이콘 생성 (Action Blue #0066cc 둥근 사각형 배지 + 흰색 'A>J' 심볼)
 * 작업표시줄(64x64) 및 트레이 아이콘(32x32) 겸용
 */
export function createAtojAppIcon(size = 64): Electron.NativeImage {
  const buf = Buffer.alloc(size * size * 4);
  const pad = Math.max(1, Math.round(size * 0.06));
  const radius = Math.round(size * 0.22);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (insideRoundedRect(x, y, size, pad, radius)) {
        // BGRA: Action Blue #0066cc (R=0, G=102, B=204)
        buf[idx] = 204;
        buf[idx + 1] = 102;
        buf[idx + 2] = 0;
        buf[idx + 3] = 255;
      } else {
        buf[idx + 3] = 0;
      }
    }
  }

  const scale = Math.max(1, Math.floor(size / 20));
  const totalWidth = (5 + 1 + 5 + 1 + 5) * scale;
  const totalHeight = 7 * scale;
  const startX = Math.floor((size - totalWidth) / 2);
  const startY = Math.floor((size - totalHeight) / 2);

  drawGlyph(buf, size, GLYPH_A, startX, startY, scale);
  drawGlyph(buf, size, GLYPH_ARROW, startX + 6 * scale, startY, scale);
  drawGlyph(buf, size, GLYPH_J, startX + 12 * scale, startY, scale);

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

    const icon = createAtojAppIcon(32);
    this.tray = new Tray(icon);
    this.tray.setToolTip('AtoJ - 무인교통단속장비 규격 변환기');

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
        label: 'AtoJ 변환기 창 열기',
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
