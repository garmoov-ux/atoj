import fs from 'node:fs';
import path from 'node:path';
import { resolveAppPath } from '../config/app-paths';
import { inspectBinaryFile } from './dat-reader';
import type { RecordNavigationMeta } from '../db/conversion-repo';
import {
  CAR_DIRECTION_LABELS,
  CAR_TYPE_LABELS,
  SIGNAL_SHAPE_LABELS,
  VIOLATION_LABELS,
} from '@shared/spec-labels';
import type {
  AverHeader,
  ConversionRecord,
  DatInspectionResult,
  InspectedFileStatus,
} from '@shared/types/domain';

export const SNAPSHOT_DIR_RELATIVE = './data/snapshots';

export function saveConversionSnapshot(targetFileName: string, datBuffer: Buffer): string | null {
  try {
    const dir = resolveAppPath(SNAPSHOT_DIR_RELATIVE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const snapshotPath = path.join(dir, path.basename(targetFileName));
    fs.writeFileSync(snapshotPath, datBuffer);
    return snapshotPath;
  } catch {
    return null;
  }
}

function parseRawHeaderJson(headerJson?: string | null): AverHeader | null {
  if (!headerJson) return null;
  try {
    return JSON.parse(headerJson) as AverHeader;
  } catch {
    return null;
  }
}

export function inspectConversionRecord(
  record: ConversionRecord,
  navMeta?: RecordNavigationMeta,
): DatInspectionResult {
  const rawHeader = parseRawHeaderJson(record.headerJson);
  const targetExists = Boolean(record.targetPath && fs.existsSync(record.targetPath));

  const fallbackSnapshotPath =
    record.snapshotPath ||
    (record.targetFileName
      ? path.join(resolveAppPath(SNAPSHOT_DIR_RELATIVE), path.basename(record.targetFileName))
      : null);
  const snapshotExists = Boolean(fallbackSnapshotPath && fs.existsSync(fallbackSnapshotPath));
  const sourceExists = Boolean(record.sourcePath && fs.existsSync(record.sourcePath));

  let candidateFilePath: string | null = null;
  let fileStatus: InspectedFileStatus = 'DB_METADATA_ONLY';

  if (targetExists && record.targetPath) {
    candidateFilePath = record.targetPath;
    fileStatus = 'AVAILABLE';
  } else if (snapshotExists && fallbackSnapshotPath) {
    candidateFilePath = fallbackSnapshotPath;
    fileStatus = 'EXPORTED_SNAPSHOT';
  } else if (sourceExists && record.sourcePath) {
    candidateFilePath = record.sourcePath;
    fileStatus = 'EXPORTED_SNAPSHOT';
  }

  if (candidateFilePath) {
    try {
      const baseResult = inspectBinaryFile(candidateFilePath);
      return {
        ...baseResult,
        violationSpeed: baseResult.violationSpeed || record.enfSpeed || rawHeader?.enfSpeed || 0,
        fileName: record.targetFileName || baseResult.fileName,
        filePath: record.targetPath || baseResult.filePath,
        recordId: record.id,
        sourceFileName: record.sourceFileName,
        targetFileName: record.targetFileName,
        deviceCode: record.deviceCode !== '-' ? record.deviceCode : rawHeader?.deviceCode,
        createdAt: record.createdAt,
        fileStatus,
        rawHeader,
        ...navMeta,
      };
    } catch {
      // 바이너리 파일 파싱 예외 발생 시에도 이전/다음 탐색이 멈추지 않도록 DB/헤더 메타데이터 폴백으로 진행
    }
  }

  const vCode = Number(record.enfCode) === 3 ? 3 : 1;
  return {
    recordId: record.id,
    sourceFileName: record.sourceFileName,
    targetFileName: record.targetFileName,
    deviceCode: record.deviceCode,
    createdAt: record.createdAt,
    fileStatus: 'DB_METADATA_ONLY',
    rawHeader,
    ...navMeta,
    fileName: record.targetFileName || record.sourceFileName,
    filePath: record.targetPath || record.sourcePath,
    fileSize: record.fileSize,
    fileFormat: 'JVER_DAT',
    violationCode: vCode,
    violationLabel: VIOLATION_LABELS[vCode] || `코드 ${vCode}`,
    fileVersion: '0x0000',
    carType: record.carType,
    carTypeLabel: CAR_TYPE_LABELS[record.carType] || `${record.carType}`,
    carNum: record.carNum,
    lane: record.lane,
    violationTime: record.violationTime,
    hasPlate: rawHeader ? rawHeader.useCarNum : record.carNum !== 'XXXXXXXXXXXX' ? 1 : 0,
    plateBox: rawHeader
      ? {
          x: rawHeader.carNumX,
          y: rawHeader.carNumY,
          width: rawHeader.carNumWidth,
          height: rawHeader.carNumHeight,
        }
      : { x: 0, y: 0, width: 0, height: 0 },
    speedLimit: vCode === 1 ? record.enfSpeed : undefined,
    violationSpeed: record.enfSpeed,
    signalStartPassTime:
      rawHeader && vCode === 3 ? Number.parseFloat(rawHeader.signalStartPassTime) || 0 : undefined,
    signalEndPassTime:
      rawHeader && vCode === 3 ? Number.parseFloat(rawHeader.signalEndPassTime) || 0 : undefined,
    signalShape: rawHeader?.signalShape,
    signalShapeLabel: rawHeader?.signalShape
      ? SIGNAL_SHAPE_LABELS[rawHeader.signalShape]
      : undefined,
    carDirection: rawHeader?.carDirection,
    carDirectionLabel: rawHeader?.carDirection
      ? CAR_DIRECTION_LABELS[rawHeader.carDirection]
      : undefined,
    signalType: rawHeader?.signalType,
    trackingCount: Math.max(0, record.imageCount - 2),
    carImageBase64: null,
    plateImageBase64: null,
    trackingImagesBase64: [],
  };
}
