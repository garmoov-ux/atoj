import { describe, expect, it } from 'vitest';
import { createDatabaseConnection } from '../src/main/db/connection';
import { ConversionRepository } from '../src/main/db/conversion-repo';

describe('SQLite(:memory:) 변환 이력 리포지토리 검증', () => {
  it('단속 변환 기록 적재, 필터 검색, KPI 통계 집계가 정상 동작한다', () => {
    const db = createDatabaseConnection(':memory:');
    const repo = new ConversionRepository(db);

    repo.insert({
      sourcePath: 'C:/save_std2/2026111714203501.F1234',
      sourceFileName: '2026111714203501.F1234',
      targetPath: 'F:/result/21_F1234_20261117142035000_02_01.DAT',
      targetFileName: '21_F1234_20261117142035000_02_01.DAT',
      deviceCode: 'F1234',
      carNum: '12가3456',
      enfCode: '1',
      enfSpeed: 95,
      lane: 2,
      carType: 1,
      violationTime: '2026-11-17 14:20:35.000',
      imageCount: 2,
      fileSize: 4096,
      status: 'SUCCESS',
      errorMessage: null,
    });

    repo.insert({
      sourcePath: 'D:/MuinServer/2_Metafile/Signal/2026111714210001.F5678',
      sourceFileName: '2026111714210001.F5678',
      targetPath: 'F:/result/21_F5678_20261117142100000_01_03.DAT',
      targetFileName: '21_F5678_20261117142100000_01_03.DAT',
      deviceCode: 'F5678',
      carNum: '서울02라1234',
      enfCode: '3',
      enfSpeed: 72,
      lane: 1,
      carType: 1,
      violationTime: '2026-11-17 14:21:00.000',
      imageCount: 5,
      fileSize: 8192,
      status: 'SUCCESS',
      errorMessage: null,
    });

    const stats = repo.getStats();
    expect(stats.totalConverted).toBe(2);
    expect(stats.speedCount).toBe(1);
    expect(stats.signalCount).toBe(1);
    expect(stats.failedCount).toBe(0);

    const searchRes = repo.query({ search: '서울02라1234' });
    expect(searchRes.total).toBe(1);
    expect(searchRes.items[0].deviceCode).toBe('F5678');

    const latest = repo.getLatestSuccess();
    expect(latest).not.toBeNull();
    expect(latest?.carNum).toBe('서울02라1234');

    const navLatest = repo.getNavigationMeta(latest!.id);
    expect(navLatest.currentPosition).toBe(1);
    expect(navLatest.totalSuccessCount).toBe(2);
    expect(navLatest.prevRecordId).toBeNull();
    expect(navLatest.nextRecordId).toBe(1);

    const cleared = repo.clearAll();
    expect(cleared).toBe(2);
    db.close();
  });
});
