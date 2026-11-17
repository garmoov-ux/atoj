import { useState, useEffect, useCallback } from 'react';
import type {
  AtojAppConfig,
  ConversionRecord,
  DashboardSummary,
  DatInspectionResult,
} from '@shared/types/domain';

const INITIAL_SUMMARY: DashboardSummary = {
  isWatching: false,
  watchedFolders: [],
  totalConverted: 0,
  todayConverted: 0,
  speedCount: 0,
  signalCount: 0,
  failedCount: 0,
  queueSize: 0,
};

export function useAtojState() {
  const [summary, setSummary] = useState<DashboardSummary>(INITIAL_SUMMARY);
  const [config, setConfig] = useState<AtojAppConfig | null>(null);
  const [recentRecords, setRecentRecords] = useState<ConversionRecord[]>([]);
  const [inspected, setInspected] = useState<DatInspectionResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const refreshInitial = useCallback(async () => {
    try {
      const [sumRes, cfgRes, histRes] = await Promise.all([
        window.atojApi.getSummary(),
        window.atojApi.getConfig(),
        window.atojApi.queryHistory({ limit: 30, offset: 0 }),
      ]);

      if (sumRes.success && sumRes.data) setSummary(sumRes.data);
      if (cfgRes.success && cfgRes.data) setConfig(cfgRes.data);
      if (histRes.success && histRes.data) {
        setRecentRecords(histRes.data.items);
        const latestSuccess = histRes.data.items.find((r) => r.status === 'SUCCESS');
        if (typeof window.atojApi.inspectRecord === 'function') {
          const latestRes = await window.atojApi.inspectRecord();
          if (latestRes.success && latestRes.data) {
            setInspected((prev) => prev ?? latestRes.data ?? null);
          }
        } else if (latestSuccess?.targetPath) {
          const fallbackRes = await window.atojApi.inspectBinaryFile(latestSuccess.targetPath);
          if (fallbackRes.success && fallbackRes.data) {
            setInspected((prev) => prev ?? fallbackRes.data ?? null);
          }
        }
      }
    } catch {
      // 초기 로드 중 일부 채널 미준비 시 무시
    }
  }, []);

  useEffect(() => {
    void refreshInitial();

    const unsubConversion = window.atojApi.onConversionEvent((record) => {
      setRecentRecords((prev) => [record, ...prev.slice(0, 49)]);
      if (record.status === 'SUCCESS' && typeof window.atojApi.inspectRecord === 'function') {
        void window.atojApi.inspectRecord(record.id).then((res) => {
          if (res.success && res.data) {
            setInspected((prev) => prev ?? res.data ?? null);
          }
        });
      }
    });

    const unsubSummary = window.atojApi.onSummaryUpdated((nextSummary) => {
      setSummary(nextSummary);
    });

    return () => {
      unsubConversion();
      unsubSummary();
    };
  }, [refreshInitial]);

  const toggleWatcher = useCallback(async () => {
    const res = await window.atojApi.toggleWatcher(!summary.isWatching);
    if (res.success && res.data) {
      setSummary(res.data);
      showToast(res.data.isWatching ? '실시간 감시를 시작했습니다.' : '실시간 감시를 일시 중지했습니다.');
    }
  }, [summary.isWatching, showToast]);

  const scanNow = useCallback(async () => {
    const res = await window.atojApi.scanSourceFolders();
    if (res.success && res.data) {
      showToast(`수신 폴더 점검 실행 완료 (대상 파일 ${res.data.scannedCount}개 확인)`);
    }
  }, [showToast]);

  const saveConfig = useCallback(
    async (nextConfig: AtojAppConfig) => {
      const res = await window.atojApi.saveConfig(nextConfig);
      if (res.success && res.data) {
        setConfig(res.data);
        showToast('설정을 저장하고 실시간 감시 및 보관 정책에 반영했습니다.');
      } else if (res.error) {
        showToast(`설정 저장 실패: ${res.error}`);
      }
    },
    [showToast],
  );

  const runRetentionCleanupNow = useCallback(async () => {
    const res = await window.atojApi.runRetentionCleanup();
    if (res.success && res.data) {
      const { deletedLogs, deletedDbRows, deletedResults, deletedQuarantines } = res.data;
      const total = deletedLogs + deletedDbRows + deletedResults + deletedQuarantines;
      showToast(
        total > 0
          ? `자동 정리 완료 (로그 ${deletedLogs}개 · 이력 ${deletedDbRows}건 · 결과 ${deletedResults}개 · 격리 ${deletedQuarantines}개 삭제)`
          : '정리할 보관 기간 경과 파일이나 이력이 없습니다.',
      );
      void refreshInitial();
    }
  }, [showToast, refreshInitial]);

  const inspectFileByPath = useCallback(
    async (filePath: string): Promise<boolean> => {
      const res = await window.atojApi.inspectBinaryFile(filePath);
      if (res.success && res.data) {
        setInspected(res.data);
        return true;
      }
      showToast(`파일 분석 실패: ${res.error || '알 수 없는 오류'}`);
      return false;
    },
    [showToast],
  );

  const inspectRecordById = useCallback(
    async (recordId?: number): Promise<boolean> => {
      if (typeof window.atojApi.inspectRecord === 'function') {
        const res = await window.atojApi.inspectRecord(recordId);
        if (res.success && res.data) {
          setInspected(res.data);
          return true;
        }
        if (res.error) {
          showToast(`단속 데이터 열람 실패: ${res.error}`);
        }
        return false;
      }
      const target = recordId
        ? recentRecords.find((r) => r.id === recordId)
        : recentRecords.find((r) => r.status === 'SUCCESS');
      if (target?.targetPath) {
        return inspectFileByPath(target.targetPath);
      }
      return false;
    },
    [recentRecords, inspectFileByPath, showToast],
  );

  const selectAndInspectFile = useCallback(async (): Promise<boolean> => {
    const pick = await window.atojApi.selectInspectFile();
    if (!pick.success || !pick.data) return false;
    return inspectFileByPath(pick.data);
  }, [inspectFileByPath]);

  const manualConvertSingleFile = useCallback(async (): Promise<string | null> => {
    const pick = await window.atojApi.selectInspectFile();
    if (!pick.success || !pick.data) return null;

    const conv = await window.atojApi.convertSingleFile(pick.data);
    if (conv.success && conv.data) {
      showToast(`자규격 변환 완료: ${conv.data.targetFileName}`);
      const ok = await inspectRecordById(conv.data.id);
      if (!ok && conv.data.targetPath) {
        await inspectFileByPath(conv.data.targetPath);
      }
      return conv.data.targetPath || conv.data.sourcePath;
    } else {
      showToast(`변환 실패: ${conv.error || '오류 발생'}`);
    }
    return null;
  }, [inspectRecordById, inspectFileByPath, showToast]);

  return {
    summary,
    config,
    recentRecords,
    inspected,
    toastMessage,
    showToast,
    toggleWatcher,
    scanNow,
    saveConfig,
    runRetentionCleanupNow,
    inspectRecordById,
    inspectFileByPath,
    selectAndInspectFile,
    manualConvertSingleFile,
  };
}
