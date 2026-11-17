import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import iconv from 'iconv-lite';
import { describe, expect, it } from 'vitest';
import { validateAverFileName, parseAverBuffer } from '../src/main/converter/aver-parser';
import { packAverToJverBuffer } from '../src/main/converter/jver-packer';
import { inspectBinaryFile } from '../src/main/converter/dat-reader';

function buildSampleAverBuffer(params: {
  enfCode: '1' | '3';
  carNumKor: string;
  trackingCount?: number;
}): Buffer {
  const parts: Buffer[] = [];
  const fixedAscii = (str: string, len: number) =>
    Buffer.from(str.padEnd(len, ' ').slice(0, len), 'ascii');

  parts.push(fixedAscii('0000106', 7)); // [0] device_type (SIZE)
  parts.push(fixedAscii('F1234', 5)); // [1] device_code
  parts.push(fixedAscii('095', 3)); // [2] enf_speed
  parts.push(fixedAscii('1', 1)); // [3] car_type
  parts.push(fixedAscii('2', 1)); // [4] lane
  parts.push(fixedAscii('20261117', 8)); // [5] enf_date
  parts.push(fixedAscii('142035', 6)); // [6] enf_time

  const cp949Plate = iconv.encode(params.carNumKor, 'cp949');
  const plate12 = Buffer.alloc(12, 0x20);
  cp949Plate.copy(plate12, 0, 0, Math.min(cp949Plate.length, 12));
  parts.push(plate12); // [7] car_num (12B CP949)

  parts.push(fixedAscii('0120', 4)); // [8] car_num_x_start
  parts.push(fixedAscii('0340', 4)); // [9] car_num_y_start
  parts.push(fixedAscii('0220', 4)); // [10] car_num_width
  parts.push(fixedAscii('0090', 4)); // [11] car_num_height
  parts.push(fixedAscii('1', 1)); // [12] use_car_num
  parts.push(fixedAscii(params.enfCode, 1)); // [13] enf_code
  parts.push(fixedAscii('1', 1)); // [14] enf_type
  parts.push(fixedAscii('1.234', 23)); // [15] signal_start_pass_time
  parts.push(fixedAscii('3.567', 23)); // [16] signal_end_pass_time
  parts.push(fixedAscii(String(params.trackingCount ?? 2).padStart(2, '0'), 2)); // [17] tracking_frame
  parts.push(fixedAscii('5', 1)); // [18] signal_shape (적색)
  parts.push(fixedAscii('1', 1)); // [19] car_direction (직진)
  parts.push(fixedAscii('3', 1)); // [20] signal_type (4색등)
  parts.push(fixedAscii('0', 1)); // [21] trigger_type

  const header114 = Buffer.concat(parts);
  expect(header114.length).toBe(114);

  const makeFakeJpeg = (tag: number) =>
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, tag, tag + 1, tag + 2, 0xff, 0xd9]);

  const imgs: Buffer[] = [makeFakeJpeg(0x10), makeFakeJpeg(0x20)];
  if (params.enfCode === '3') {
    const cnt = params.trackingCount ?? 2;
    for (let i = 0; i < cnt; i++) {
      imgs.push(makeFakeJpeg(0x30 + i));
    }
  }

  return Buffer.concat([header114, ...imgs]);
}

describe('아규격 -> 자규격(.DAT) 바이너리 변환 엔진 및 Python muin.py 100% 동등성 검증', () => {
  it('아규격 파일명 정규식(\\d{16}\\.[A-Z]\\d{4}$)을 정확히 식별한다', () => {
    expect(validateAverFileName('C:/save_std2/2026111714203501.F1234')).toBe(true);
    expect(validateAverFileName('2026111714203599.M0041')).toBe(true);
    expect(validateAverFileName('config.json')).toBe(false);
    expect(validateAverFileName('20261117.F1234')).toBe(false);
  });

  it('속도위반(enf_code=1) 변환 결과가 기존 Python legacy_src/muin.py와 단 1바이트 오차 없이 100% 일치한다', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atoj-parity-speed-'));
    const averPath = path.join(tmpDir, '2026111714203501.F1234');
    const rawAver = buildSampleAverBuffer({ enfCode: '1', carNumKor: '12가3456' });
    fs.writeFileSync(averPath, rawAver);

    // 1. TypeScript 변환
    const tsPacked = packAverToJverBuffer(rawAver);

    // 2. 기존 Python legacy_src/muin.py 실행 결과
    const legacyDir = path.resolve(__dirname, '../legacy_src');
    const pyScript = `
import sys
sys.path.insert(0, r'${legacyDir}')
from muin import Convert
c = Convert()
out = c.aver_to_jver(r'${averPath}', r'${tmpDir}')
print(out)
`;
    const pyOutPath = execFileSync('python', ['-c', pyScript], { encoding: 'utf-8' }).trim();
    const pyBytes = fs.readFileSync(pyOutPath);

    expect(tsPacked.fileName).toBe(path.basename(pyOutPath));
    expect(tsPacked.buffer.equals(pyBytes)).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('신호위반(enf_code=3, 트래킹 프레임 포함) 변환 결과가 기존 Python legacy_src/muin.py와 100% 바이트 일치한다', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atoj-parity-signal-'));
    const averPath = path.join(tmpDir, '2026111714203502.F1234');
    const rawAver = buildSampleAverBuffer({
      enfCode: '3',
      carNumKor: '서울02라1234',
      trackingCount: 3,
    });
    fs.writeFileSync(averPath, rawAver);

    const tsPacked = packAverToJverBuffer(rawAver);

    const legacyDir = path.resolve(__dirname, '../legacy_src');
    const pyScript = `
import sys
sys.path.insert(0, r'${legacyDir}')
from muin import Convert
c = Convert()
out = c.aver_to_jver(r'${averPath}', r'${tmpDir}')
print(out)
`;
    const pyOutPath = execFileSync('python', ['-c', pyScript], { encoding: 'utf-8' }).trim();
    const pyBytes = fs.readFileSync(pyOutPath);

    expect(tsPacked.fileName).toBe(path.basename(pyOutPath));
    expect(tsPacked.buffer.equals(pyBytes)).toBe(true);

    // 생성된 .DAT 파일을 dat-reader로 역분석하여 모든 필드가 복원되는지 확인
    const inspected = inspectBinaryFile(pyOutPath);
    expect(inspected.fileFormat).toBe('JVER_DAT');
    expect(inspected.violationCode).toBe(3);
    expect(inspected.carNum).toBe('서울02라1234');
    expect(inspected.violationSpeed).toBe(95);
    expect(inspected.trackingImagesBase64.length).toBe(3);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('손상된 아규격 파일(114바이트 미만) 입력 시 명확한 예외를 발생시킨다', () => {
    expect(() => parseAverBuffer(Buffer.from('short'))).toThrow(/114바이트/);
  });
});
