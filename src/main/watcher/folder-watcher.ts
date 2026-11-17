import fs from 'node:fs';
import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { resolveAppPath } from '../config/app-paths';
import { validateAverFileName } from '../converter/aver-parser';
import { convertAverFileToJver } from '../converter/jver-packer';
import { saveConversionSnapshot } from '../converter/snapshot-archive';
import type { ConversionRepository } from '../db/conversion-repo';
import { FileLogger } from './file-logger';
import {
  CAR_TYPE_LABELS,
  formatViolationTimestamp,
  VIOLATION_LABELS,
} from '@shared/spec-labels';
import type { AtojAppConfig, ConversionRecord, DashboardSummary } from '@shared/types/domain';

function getPolicyKoreanLabel(policy: AtojAppConfig['watcher']['invalidFilePolicy']): string {
  if (policy === 'delete') return '즉시 삭제';
  if (policy === 'quarantine') return '격리 폴더 이동';
  return '원본 보존';
}

export class FolderWatcherService {
  private config: AtojAppConfig;
  private readonly repo: ConversionRepository;
  private readonly logger: FileLogger;
  private watcher: FSWatcher | null = null;
  private isWatching = false;
  private readonly processingSet = new Set<string>();
  private readonly onRecordCallbacks = new Set<(record: ConversionRecord) => void>();
  private readonly onSummaryCallbacks = new Set<(summary: DashboardSummary) => void>();

  constructor(config: AtojAppConfig, repo: ConversionRepository) {
    this.config = config;
    this.repo = repo;
    this.logger = new FileLogger(config.paths.logDir);
  }

  public getLogger(): FileLogger {
    return this.logger;
  }

  public onConversion(cb: (record: ConversionRecord) => void): () => void {
    this.onRecordCallbacks.add(cb);
    return () => this.onRecordCallbacks.delete(cb);
  }

  public onSummaryChange(cb: (summary: DashboardSummary) => void): () => void {
    this.onSummaryCallbacks.add(cb);
    return () => this.onSummaryCallbacks.delete(cb);
  }

  public updateConfig(newConfig: AtojAppConfig): void {
    const wasWatching = this.isWatching;
    this.stop();
    this.config = newConfig;
    this.logger.setLogDir(newConfig.paths.logDir);
    this.logger.write(
      '감시엔진',
      '정보',
      `환경설정이 변경되어 적용되었습니다. | 자규격 저장 경로: ${resolveAppPath(newConfig.paths.targetDir)} (설정값: ${newConfig.paths.targetDir}) | 로그 저장 경로: ${resolveAppPath(newConfig.paths.logDir)} (설정값: ${newConfig.paths.logDir}) | 파일 쓰기 대기: ${newConfig.watcher.writeStabilitySec}초 | 비규격 파일 처리: ${getPolicyKoreanLabel(newConfig.watcher.invalidFilePolicy)}`,
    );
    if (wasWatching) {
      this.start();
    } else {
      this.emitSummary();
    }
  }

  public start(): void {
    if (this.isWatching) return;

    const existingSources: string[] = [];
    for (const rawSource of this.config.paths.sources) {
      const resolvedSource = resolveAppPath(rawSource);
      const ok = fs.existsSync(resolvedSource) && fs.statSync(resolvedSource).isDirectory();
      if (ok) {
        existingSources.push(resolvedSource);
      } else {
        this.logger.write(
          '감시엔진',
          '주의',
          `감시 대상 수신 폴더가 존재하지 않아 건너뜁니다. | 입력 경로: ${rawSource} | 실제 확인 경로: ${resolvedSource}`,
        );
      }
    }

    this.isWatching = true;

    if (existingSources.length === 0) {
      this.logger.write(
        '감시엔진',
        '주의',
        '실시간 감시 대기 상태입니다. 현재 접근 가능한 수신 감시 폴더가 없습니다. [환경 설정]에서 감시 폴더 경로를 확인해 주세요.',
      );
      this.emitSummary();
      return;
    }

    this.watcher = chokidar.watch(existingSources, {
      persistent: true,
      ignoreInitial: !this.config.watcher.scanExistingOnStart,
      awaitWriteFinish: {
        stabilityThreshold: Math.max((this.config.watcher.writeStabilitySec || 1) * 1000, 500),
        pollInterval: 200,
      },
    });

    this.watcher.on('add', (filePath) => {
      void this.processFile(filePath);
    });

    this.watcher.on('unlink', (filePath) => {
      this.logger.write(
        '변환처리',
        '정보',
        `수신 폴더 내 원본 파일 삭제 확인 완료 | 파일 경로: ${filePath}`,
      );
    });

    this.logger.write(
      '감시엔진',
      '정보',
      `무인교통단속장비 실시간 폴더 감시가 시작되었습니다. | 활성 감시 폴더(${existingSources.length}개): ${existingSources.join(', ')} | 변환 결과 저장 폴더: ${resolveAppPath(this.config.paths.targetDir)} (설정값: ${this.config.paths.targetDir}) | 쓰기 완료 대기시간: ${this.config.watcher.writeStabilitySec}초`,
    );
    this.emitSummary();
  }

  public stop(): void {
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }
    if (this.isWatching) {
      this.isWatching = false;
      this.logger.write('감시엔진', '정보', '실시간 폴더 감시가 일시정지(종료)되었습니다.');
      this.emitSummary();
    }
  }

  public scanAllSourceFoldersNow(): number {
    let count = 0;
    for (const rawSource of this.config.paths.sources) {
      const srcDir = resolveAppPath(rawSource);
      if (!fs.existsSync(srcDir)) continue;
      const files = this.walkFilesRecursive(srcDir);
      for (const f of files) {
        count++;
        void this.processFile(f);
      }
    }
    this.logger.write(
      '감시엔진',
      '정보',
      `수신 폴더 전체 수동 점검을 실행했습니다. | 검색된 대상 파일 수: ${count}건`,
    );
    return count;
  }

  public async convertFolderBatch(folderPath: string): Promise<{
    folderPath: string;
    totalFound: number;
    convertedCount: number;
    failedCount: number;
    latestRecordId: number | null;
  }> {
    const resolvedDir = path.resolve(folderPath);
    const allFiles = this.walkFilesRecursive(resolvedDir).filter(
      (f) => path.extname(f).toLowerCase() !== '.dat',
    );

    let convertedCount = 0;
    let failedCount = 0;
    let latestRecordId: number | null = null;

    for (const file of allFiles) {
      const rec = await this.processFile(file, true);
      if (rec) {
        if (rec.status === 'SUCCESS') {
          convertedCount++;
          latestRecordId = rec.id;
        } else if (rec.status === 'FAILED') {
          failedCount++;
        }
      }
    }

    this.logger.write(
      '변환처리',
      '정보',
      `폴더 선택 일괄 변환 완료 | 대상 폴더: ${resolvedDir} | 전체 파일: ${allFiles.length}건 | 성공: ${convertedCount}건 | 실패: ${failedCount}건`,
    );

    return {
      folderPath: resolvedDir,
      totalFound: allFiles.length,
      convertedCount,
      failedCount,
      latestRecordId,
    };
  }

  private walkFilesRecursive(dir: string): string[] {
    const results: string[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results.push(...this.walkFilesRecursive(full));
        } else if (entry.isFile()) {
          results.push(full);
        }
      }
    } catch {
      // 권한 오류 등 무시
    }
    return results;
  }

  public async processFile(filePath: string, forceManual = false): Promise<ConversionRecord | null> {
    const resolved = path.resolve(filePath);
    if (this.processingSet.has(resolved)) return null;
    if (!fs.existsSync(resolved)) return null;

    this.processingSet.add(resolved);
    this.emitSummary();

    try {
      const fileName = path.basename(resolved);
      const sourceFileSize = fs.existsSync(resolved) ? fs.statSync(resolved).size : 0;

      this.logger.write(
        '변환처리',
        '정보',
        `신규 단속 파일 감지 (${forceManual ? '수동 선택 변환' : '자동 폴더 감시'}) | 원본 파일명: ${fileName} | 크기: ${sourceFileSize.toLocaleString()}바이트 | 전체 경로: ${resolved}`,
      );

      if (!forceManual && !validateAverFileName(resolved)) {
        const policyLabel = getPolicyKoreanLabel(this.config.watcher.invalidFilePolicy);
        this.logger.write(
          '변환처리',
          '주의',
          `아규격 파일명 규칙(16자리숫자.영문1자리+숫자4자리)과 일치하지 않는 비규격 파일입니다. | 파일명: ${fileName} | 적용된 처리 방식: ${policyLabel}`,
        );
        this.handleInvalidFile(resolved);

        const skipped = this.repo.insert({
          sourcePath: resolved,
          sourceFileName: fileName,
          targetPath: null,
          targetFileName: null,
          deviceCode: '-',
          carNum: '-',
          enfCode: '-',
          enfSpeed: 0,
          lane: 0,
          carType: 0,
          violationTime: '-',
          imageCount: 0,
          fileSize: sourceFileSize,
          status: 'SKIPPED',
          errorMessage: `아규격 파일명 규칙 불일치 (처리방식: ${policyLabel})`,
        });

        this.emitRecord(skipped);
        return skipped;
      }

      const targetDirResolved = resolveAppPath(this.config.paths.targetDir);
      const { outputFilePath, packed } = convertAverFileToJver(resolved, targetDirResolved);
      const { header, trackingImages } = packed.parsed;
      const rawTime17 = `${header.enfDate}${header.enfTime}000`;
      const formattedViolationTime = formatViolationTimestamp(rawTime17);
      const violationName = VIOLATION_LABELS[Number(header.enfCode)] || '기타위반';
      const carTypeName = CAR_TYPE_LABELS[Number(header.carType)] || '미분류';
      const totalImages = 2 + trackingImages.length;

      this.logger.write(
        '변환처리',
        '정보',
        `아규격 -> 자규격(.DAT) 변환 성공 | 장비번호: ${header.deviceCode} | 위반일시: ${formattedViolationTime} | 차량번호: ${header.carNum} | 위반구분: ${violationName}(코드:${header.enfCode}) | 위반속도: 시속 ${header.enfSpeed}km/h | 위반차로: ${header.lane}차로 | 차종: ${carTypeName} | 수록영상: 총 ${totalImages}장(차량·번호판 각 1장, 연속영상 ${trackingImages.length}장) | 원본파일: ${fileName}(${sourceFileSize.toLocaleString()}바이트) -> 생성파일: ${packed.fileName}(${packed.buffer.length.toLocaleString()}바이트) | 저장경로: ${outputFilePath}`,
      );

      if (!forceManual && fs.existsSync(resolved)) {
        fs.unlinkSync(resolved);
      }

      const snapshotPath = saveConversionSnapshot(packed.fileName, packed.buffer);

      const record = this.repo.insert({
        sourcePath: resolved,
        sourceFileName: fileName,
        targetPath: outputFilePath,
        targetFileName: packed.fileName,
        snapshotPath,
        headerJson: JSON.stringify(header),
        deviceCode: header.deviceCode,
        carNum: header.carNum,
        enfCode: header.enfCode,
        enfSpeed: header.enfSpeed,
        lane: header.lane,
        carType: header.carType,
        violationTime: formattedViolationTime,
        imageCount: totalImages,
        fileSize: packed.buffer.length,
        status: 'SUCCESS',
        errorMessage: null,
      });

      this.emitRecord(record);
      return record;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.write(
        '변환처리',
        '오류',
        `자규격(.DAT) 파일 변환 실패 | 대상 파일: ${resolved} | 상세 오류 원인: ${message}`,
      );

      const failed = this.repo.insert({
        sourcePath: resolved,
        sourceFileName: path.basename(resolved),
        targetPath: null,
        targetFileName: null,
        deviceCode: '-',
        carNum: '-',
        enfCode: '-',
        enfSpeed: 0,
        lane: 0,
        carType: 0,
        violationTime: '-',
        imageCount: 0,
        fileSize: fs.existsSync(resolved) ? fs.statSync(resolved).size : 0,
        status: 'FAILED',
        errorMessage: message,
      });

      this.emitRecord(failed);
      return failed;
    } finally {
      this.processingSet.delete(resolved);
      this.emitSummary();
    }
  }

  private handleInvalidFile(filePath: string): void {
    try {
      const policy = this.config.watcher.invalidFilePolicy;
      if (policy === 'delete') {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          this.logger.write(
            '변환처리',
            '주의',
            `비규격 파일 즉시 삭제 완료 | 삭제된 파일: ${filePath}`,
          );
        }
      } else if (policy === 'quarantine') {
        const qDir = resolveAppPath(this.config.paths.quarantineDir || './quarantine');
        if (!fs.existsSync(qDir)) fs.mkdirSync(qDir, { recursive: true });
        const dest = path.join(qDir, path.basename(filePath));
        fs.renameSync(filePath, dest);
        this.logger.write(
          '변환처리',
          '주의',
          `비규격 파일 격리 폴더 이동 완료 | 원본: ${filePath} -> 격리 위치: ${dest}`,
        );
      }
    } catch {
      // 파일 이동/삭제 예외 무시
    }
  }

  public getSummary(): DashboardSummary {
    const stats = this.repo.getStats();
    const watchedFolders = this.config.paths.sources.map((p) => {
      const resolved = resolveAppPath(p);
      return {
        path: p,
        exists: fs.existsSync(resolved) && fs.statSync(resolved).isDirectory(),
      };
    });

    return {
      isWatching: this.isWatching,
      watchedFolders,
      ...stats,
      queueSize: this.processingSet.size,
    };
  }

  private emitRecord(record: ConversionRecord): void {
    for (const cb of this.onRecordCallbacks) cb(record);
  }

  private emitSummary(): void {
    const summary = this.getSummary();
    for (const cb of this.onSummaryCallbacks) cb(summary);
  }
}
