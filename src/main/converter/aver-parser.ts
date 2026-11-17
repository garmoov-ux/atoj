import iconv from 'iconv-lite';
import type { AverHeader, ParsedAverFile } from '@shared/types/domain';

const AVER_FILE_REGEX = /\d{16}\.[A-Z]\d{4}$/;

/**
 * 아규격 파일명 정규식(\d{16}\.[A-Z]\d{4}$) 검사
 */
export function validateAverFileName(filePath: string): boolean {
  return AVER_FILE_REGEX.test(filePath);
}

/**
 * 버퍼 내 모든 JPEG 이미지(SOI 0xFF 0xD8 ~ EOI 0xFF 0xD9)를 legacy_src/muin.py와 동일한 방식으로 추출
 */
export function extractJpegFrames(bodyBuffer: Buffer): Buffer[] {
  const images: Buffer[] = [];
  let cursor = bodyBuffer;
  const soi = Buffer.from([0xff, 0xd8]);
  const eoi = Buffer.from([0xff, 0xd9]);

  while (cursor.length > 0) {
    const startIdx = cursor.indexOf(soi);
    const endIdx = cursor.indexOf(eoi);

    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      break;
    }

    images.push(Buffer.from(cursor.subarray(startIdx, endIdx + 2)));
    cursor = cursor.subarray(endIdx + 2);
  }

  return images;
}

/**
 * 아규격 선두 114바이트 헤더('7s5s3s1s1s8s6s12s4s4s4s4s1s1s1s23s23s2s1s1s1s1s') 파싱
 */
export function parseAverBuffer(rawBuffer: Buffer): ParsedAverFile {
  if (rawBuffer.length < 114) {
    throw new Error(`아규격 헤더 크기 미달 (최소 114바이트 필요, 현재 ${rawBuffer.length}바이트)`);
  }

  const slices = [7, 5, 3, 1, 1, 8, 6, 12, 4, 4, 4, 4, 1, 1, 1, 23, 23, 2, 1, 1, 1, 1];
  const fields: Buffer[] = [];
  let offset = 0;

  for (const len of slices) {
    fields.push(rawBuffer.subarray(offset, offset + len));
    offset += len;
  }

  const carNumDecoded = iconv.decode(fields[7], 'cp949').trim();

  const header: AverHeader = {
    rawSizeField: fields[0].toString('ascii'),
    deviceCode: fields[1].toString('ascii'),
    enfSpeed: Number.parseInt(fields[2].toString('ascii'), 10),
    carType: Number.parseInt(fields[3].toString('ascii'), 10),
    lane: Number.parseInt(fields[4].toString('ascii'), 10),
    enfDate: fields[5].toString('ascii'),
    enfTime: fields[6].toString('ascii'),
    carNum: carNumDecoded,
    carNumX: Number.parseInt(fields[8].toString('ascii'), 10),
    carNumY: Number.parseInt(fields[9].toString('ascii'), 10),
    carNumWidth: Number.parseInt(fields[10].toString('ascii'), 10),
    carNumHeight: Number.parseInt(fields[11].toString('ascii'), 10),
    useCarNum: Number.parseInt(fields[12].toString('ascii'), 10),
    enfCode: fields[13].toString('ascii'),
    enfType: fields[14].toString('ascii'),
    signalStartPassTime: fields[15].toString('ascii'),
    signalEndPassTime: fields[16].toString('ascii'),
    trackingFrameCount: Number.parseInt(fields[17].toString('ascii'), 10) || 0,
    signalShape: Number.parseInt(fields[18].toString('ascii'), 10) || 0,
    carDirection: Number.parseInt(fields[19].toString('ascii'), 10) || 0,
    signalType: Number.parseInt(fields[20].toString('ascii'), 10) || 0,
    triggerType: fields[21].toString('ascii'),
  };

  const images = extractJpegFrames(rawBuffer.subarray(114));
  if (images.length < 2) {
    throw new Error(`아규격 내장 JPEG 이미지 부족 (최소 2장 필요: 차량·번호판, 추출된 수: ${images.length})`);
  }

  return {
    header,
    carImage: images[0],
    plateImage: images[1],
    trackingImages: images.slice(2),
  };
}
