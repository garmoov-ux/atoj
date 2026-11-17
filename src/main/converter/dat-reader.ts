import fs from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';
import { parseAverBuffer } from './aver-parser';
import {
  CAR_DIRECTION_LABELS,
  CAR_TYPE_LABELS,
  SIGNAL_SHAPE_LABELS,
  VIOLATION_LABELS,
  formatViolationTimestamp,
} from '@shared/spec-labels';
import type { DatInspectionResult } from '@shared/types/domain';

function stripNullBytes(buf: Buffer, encoding: 'ascii' | 'cp949' = 'ascii'): string {
  const zeroIdx = buf.indexOf(0x00);
  const slice = zeroIdx === -1 ? buf : buf.subarray(0, zeroIdx);
  return encoding === 'cp949' ? iconv.decode(slice, 'cp949').trim() : slice.toString('ascii').trim();
}

/**
 * 자규격(.DAT) 또는 아규격 원본 바이너리 파일을 자동 판별하여 헤더 메타데이터와 Base64 이미지를 반환
 */
export function inspectBinaryFile(filePath: string): DatInspectionResult {
  const resolved = path.resolve(filePath);
  const buf = fs.readFileSync(resolved);
  const fileName = path.basename(resolved);

  // 자규격(.DAT) 판별: 첫 바이트가 0x01 또는 0x03이고 1~2바이트 파일버전이 0x00 0x00인 경우
  const isJverDat =
    buf.length >= 60 && (buf[0] === 1 || buf[0] === 3) && buf[1] === 0x00 && buf[2] === 0x00;

  if (!isJverDat) {
    const parsed = parseAverBuffer(buf);
    const { header, carImage, plateImage, trackingImages } = parsed;
    const vCode = header.enfCode === '3' ? 3 : 1;
    const rawTime17 = `${header.enfDate}${header.enfTime}000`;

    return {
      rawHeader: header,
      deviceCode: header.deviceCode,
      fileStatus: 'AVAILABLE',
      fileName,
      filePath: resolved,
      fileSize: buf.length,
      fileFormat: 'AVER_RAW',
      violationCode: vCode,
      violationLabel: VIOLATION_LABELS[vCode] || '기타위반',
      fileVersion: 'AVER-114B',
      carType: header.carType,
      carTypeLabel: CAR_TYPE_LABELS[header.carType] || `${header.carType}`,
      carNum: header.carNum,
      lane: header.lane,
      violationTime: formatViolationTimestamp(rawTime17),
      hasPlate: header.useCarNum,
      plateBox: {
        x: header.carNumX,
        y: header.carNumY,
        width: header.carNumWidth,
        height: header.carNumHeight,
      },
      speedLimit: vCode === 1 ? header.enfSpeed : undefined,
      violationSpeed: header.enfSpeed,
      signalStartPassTime:
        vCode === 3 ? Number.parseFloat(header.signalStartPassTime) || 0 : undefined,
      signalEndPassTime: vCode === 3 ? Number.parseFloat(header.signalEndPassTime) || 0 : undefined,
      signalShape: vCode === 3 ? header.signalShape : undefined,
      signalShapeLabel: vCode === 3 ? SIGNAL_SHAPE_LABELS[header.signalShape] : undefined,
      carDirection: vCode === 3 ? header.carDirection : undefined,
      carDirectionLabel: vCode === 3 ? CAR_DIRECTION_LABELS[header.carDirection] : undefined,
      signalType: vCode === 3 ? header.signalType : undefined,
      trackingCount: trackingImages.length,
      carImageBase64: `data:image/jpeg;base64,${carImage.toString('base64')}`,
      plateImageBase64: `data:image/jpeg;base64,${plateImage.toString('base64')}`,
      trackingImagesBase64: trackingImages.map(
        (img) => `data:image/jpeg;base64,${img.toString('base64')}`,
      ),
    };
  }

  let offset = 0;
  const violationCode = buf.readInt8(offset);
  offset += 1;

  const verMajor = buf[offset];
  const verMinor = buf[offset + 1];
  offset += 2;

  const carType = buf.readInt8(offset);
  offset += 1;

  const carNum = stripNullBytes(buf.subarray(offset, offset + 20), 'cp949');
  offset += 20;

  const lane = buf.readInt8(offset);
  offset += 1;

  const rawViolationTime = buf.subarray(offset, offset + 17).toString('ascii');
  offset += 17;

  const hasPlate = buf.readInt8(offset);
  offset += 1;

  const plateX = buf.readInt16BE(offset);
  const plateY = buf.readInt16BE(offset + 2);
  const plateWidth = buf.readInt16BE(offset + 4);
  const plateHeight = buf.readInt16BE(offset + 6);
  offset += 8;

  let speedLimit: number | undefined;
  let violationSpeed = 0;
  let signalStartPassTime: number | undefined;
  let signalEndPassTime: number | undefined;
  let signalShape: number | undefined;
  let carDirection: number | undefined;
  let signalType: number | undefined;

  // 일부 기타코드(enf_code='0' 등) 파일에서 속도/신호 분기 바이트 없이 곧바로 'J' + 'F21_...' 영상 블록이 시작되는 경우 자동 감지
  const startsImageBlockDirectly =
    offset + 2 <= buf.length && buf[offset] === 0x4a && buf[offset + 1] === 0x46;

  if (!startsImageBlockDirectly) {
    if (violationCode === 1 && offset + 4 <= buf.length) {
      speedLimit = buf.readInt16BE(offset);
      violationSpeed = buf.readInt16BE(offset + 2);
      offset += 4;
    } else if (violationCode === 3 && offset + 21 <= buf.length) {
      violationSpeed = buf.readInt16BE(offset);
      offset += 2;
      signalStartPassTime = buf.readDoubleBE(offset);
      offset += 8;
      signalEndPassTime = buf.readDoubleBE(offset);
      offset += 8;
      signalShape = buf.readInt8(offset);
      carDirection = buf.readInt8(offset + 1);
      signalType = buf.readInt8(offset + 2);
      offset += 3;
    }
  }

  let carImgBuf: Buffer = Buffer.alloc(0);
  if (offset + 55 <= buf.length) {
    offset += 1 + 50; // 종류(1B) + 파일명(50B)
    const carImgSize = buf.readUInt32BE(offset);
    offset += 4;
    if (carImgSize > 0 && offset + carImgSize <= buf.length) {
      carImgBuf = buf.subarray(offset, offset + carImgSize);
      offset += carImgSize;
    }
  }

  let plateImgBuf: Buffer = Buffer.alloc(0);
  if (offset + 55 <= buf.length) {
    offset += 1 + 50; // 종류(1B) + 파일명(50B)
    const plateImgSize = buf.readUInt32BE(offset);
    offset += 4;
    if (plateImgSize > 0 && offset + plateImgSize <= buf.length) {
      plateImgBuf = buf.subarray(offset, offset + plateImgSize);
      offset += plateImgSize;
    }
  }

  const trackingImagesBase64: string[] = [];
  let trackingCount = 0;

  if (violationCode === 3 && offset < buf.length) {
    trackingCount = buf.readInt8(offset);
    offset += 1;

    while (offset + 55 <= buf.length) {
      offset += 1 + 50;
      const tSize = buf.readUInt32BE(offset);
      offset += 4;
      if (tSize <= 0 || offset + tSize > buf.length) break;
      const tBuf = buf.subarray(offset, offset + tSize);
      trackingImagesBase64.push(`data:image/jpeg;base64,${tBuf.toString('base64')}`);
      offset += tSize;
    }
  }

  return {
    fileStatus: 'AVAILABLE',
    fileName,
    filePath: resolved,
    fileSize: buf.length,
    fileFormat: 'JVER_DAT',
    violationCode,
    violationLabel: VIOLATION_LABELS[violationCode] || '기타위반',
    fileVersion: `0x${verMajor.toString(16).padStart(2, '0')}${verMinor.toString(16).padStart(2, '0')}`,
    carType,
    carTypeLabel: CAR_TYPE_LABELS[carType] || `${carType}`,
    carNum,
    lane,
    violationTime: formatViolationTimestamp(rawViolationTime),
    hasPlate,
    plateBox: { x: plateX, y: plateY, width: plateWidth, height: plateHeight },
    speedLimit,
    violationSpeed,
    signalStartPassTime,
    signalEndPassTime,
    signalShape,
    signalShapeLabel: signalShape ? SIGNAL_SHAPE_LABELS[signalShape] : undefined,
    carDirection,
    carDirectionLabel: carDirection ? CAR_DIRECTION_LABELS[carDirection] : undefined,
    signalType,
    trackingCount,
    carImageBase64:
      carImgBuf.length > 0 ? `data:image/jpeg;base64,${carImgBuf.toString('base64')}` : null,
    plateImageBase64:
      plateImgBuf.length > 0 ? `data:image/jpeg;base64,${plateImgBuf.toString('base64')}` : null,
    trackingImagesBase64,
  };
}
