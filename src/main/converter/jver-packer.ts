import fs from 'node:fs';
import path from 'node:path';
import iconv from 'iconv-lite';
import { parseAverBuffer } from './aver-parser';
import type { ParsedAverFile } from '@shared/types/domain';

function packInt8(val: number): Buffer {
  const buf = Buffer.alloc(1);
  buf.writeInt8(val, 0);
  return buf;
}

function packInt16BE(val: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeInt16BE(val, 0);
  return buf;
}

function packUInt32BE(val: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(val, 0);
  return buf;
}

function packDoubleBE(val: number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeDoubleBE(val, 0);
  return buf;
}

function padRightNull(buf: Buffer, length: number): Buffer {
  const out = Buffer.alloc(length, 0x00);
  buf.copy(out, 0, 0, Math.min(buf.length, length));
  return out;
}

export interface PackedJverResult {
  fileName: string;
  buffer: Buffer;
  parsed: ParsedAverFile;
}

/**
 * 파싱된 아규격 데이터를 경찰청 자규격(.DAT) 바이트 버퍼로 1:1 패킹 (legacy_src/muin.py 100% 바이트 호환)
 */
export function packAverToJverBuffer(rawAverBuffer: Buffer): PackedJverResult {
  const parsed = parseAverBuffer(rawAverBuffer);
  const { header, carImage, plateImage, trackingImages } = parsed;

  let deviceTypeCode = 1;
  if (header.enfCode === '1') {
    deviceTypeCode = 1;
  } else if (header.enfCode === '3') {
    deviceTypeCode = 3;
  }

  const chunks: Buffer[] = [];

  // 1. 공통 헤더
  chunks.push(packInt8(deviceTypeCode)); // 위반코드 (1B)
  chunks.push(Buffer.from([0x00, 0x00])); // 파일버전 (2B)
  chunks.push(packInt8(header.carType)); // 차량종류 (1B)

  const carNumCp949 = iconv.encode(header.carNum.trim(), 'cp949');
  chunks.push(padRightNull(carNumCp949, 20)); // 차량번호 (20B CP949 + 0x00 패딩)

  chunks.push(packInt8(header.lane)); // 위반차로 (1B)

  const dateTimeEnf = `${header.enfDate}${header.enfTime}000`;
  chunks.push(Buffer.from(dateTimeEnf, 'ascii').subarray(0, 17)); // 위반시각 (17B)

  chunks.push(packInt8(header.useCarNum)); // 번호판유무 (1B)
  chunks.push(packInt16BE(header.carNumX)); // 번호판X위치 (>h)
  chunks.push(packInt16BE(header.carNumY)); // 번호판Y위치 (>h)
  chunks.push(packInt16BE(header.carNumWidth)); // 번호판WIDTH (>h)
  chunks.push(packInt16BE(header.carNumHeight)); // 번호판HEIGHT (>h)

  // 2. 위반코드별 분기 (1: 속도위반, 3: 신호위반)
  if (header.enfCode === '1') {
    chunks.push(packInt16BE(header.enfSpeed)); // 단속속도 (>h)
    chunks.push(packInt16BE(header.enfSpeed)); // 위반속도 (>h)
  } else if (header.enfCode === '3') {
    chunks.push(packInt16BE(header.enfSpeed)); // 위반속도 (>h)
    chunks.push(packDoubleBE(Number.parseFloat(header.signalStartPassTime))); // 정지선통과시간 (>d)
    chunks.push(packDoubleBE(Number.parseFloat(header.signalEndPassTime))); // 교차로통과시간 (>d)
    chunks.push(packInt8(header.signalShape)); // 신호등형태 (b)
    chunks.push(packInt8(header.carDirection)); // 차량진행형태 (b)
    chunks.push(packInt8(header.signalType)); // 신호등종류 (b)
  }

  // 3. 차량 전체 영상 블록
  chunks.push(Buffer.from('J', 'ascii'));
  const carCFileName = `F21_${header.deviceCode}_${dateTimeEnf}_0${header.lane}_J_C_XX_JPG`;
  chunks.push(padRightNull(Buffer.from(carCFileName, 'utf-8'), 50));
  chunks.push(packUInt32BE(carImage.length));
  chunks.push(carImage);

  // 4. 번호판 영상 블록
  chunks.push(Buffer.from('J', 'ascii'));
  const carLFileName = `F21_${header.deviceCode}_${dateTimeEnf}_0${header.lane}_J_L_XX_JPG`;
  chunks.push(padRightNull(Buffer.from(carLFileName, 'utf-8'), 50));
  chunks.push(packUInt32BE(plateImage.length));
  chunks.push(plateImage);

  // 5. 신호위반(enf_code == '3') 트래킹 영상 블록
  if (header.enfCode === '3') {
    chunks.push(packInt8(header.trackingFrameCount));
    for (let i = 0; i < trackingImages.length; i++) {
      const img = trackingImages[i];
      chunks.push(Buffer.from('J', 'ascii'));
      const carTFileName = `F21_${header.deviceCode}_${dateTimeEnf}_0${header.lane}_J_T_0${i}_JPG`;
      chunks.push(padRightNull(Buffer.from(carTFileName, 'utf-8'), 50));
      chunks.push(packUInt32BE(img.length));
      chunks.push(img);
    }
  }

  const jverFileName = `21_${header.deviceCode}_${dateTimeEnf}_0${header.lane}_0${deviceTypeCode}.DAT`;

  return {
    fileName: jverFileName,
    buffer: Buffer.concat(chunks),
    parsed,
  };
}

/**
 * 아규격 파일을 읽어 targetDir 아래에 자규격 .DAT 파일로 저장
 */
export function convertAverFileToJver(
  sourceFilePath: string,
  targetDir: string,
): { outputFilePath: string; packed: PackedJverResult } {
  const rawAverBuffer = fs.readFileSync(sourceFilePath);
  const packed = packAverToJverBuffer(rawAverBuffer);

  const resolvedTargetDir = path.resolve(targetDir);
  if (!fs.existsSync(resolvedTargetDir)) {
    fs.mkdirSync(resolvedTargetDir, { recursive: true });
  }

  const outputFilePath = path.join(resolvedTargetDir, packed.fileName);
  fs.writeFileSync(outputFilePath, packed.buffer);

  return { outputFilePath, packed };
}
