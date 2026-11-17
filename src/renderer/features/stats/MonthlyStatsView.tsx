import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { PillButton } from '../../components/ui/PillButton';
import type {
  ConversionRecord,
  DailyStatItem,
  DeviceStatItem,
  MonthlyStatsReport,
} from '@shared/types/domain';

interface MonthlyStatsViewProps {
  onStatusMessage: (msg: string) => void;
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftYearMonth(ym: string, deltaMonths: number): string {
  const [yStr, mStr] = ym.split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function extractRecordDate(r: ConversionRecord): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(r.violationTime)) {
    return r.violationTime.slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(r.createdAt)) {
    return r.createdAt.slice(0, 10);
  }
  return getCurrentYearMonth() + '-01';
}

function buildFallbackReportFromHistory(
  items: ConversionRecord[],
  requestedYm?: string,
): MonthlyStatsReport {
  const monthsSet = new Set<string>();
  for (const r of items) {
    monthsSet.add(extractRecordDate(r).slice(0, 7));
  }
  const sortedDataMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
  const yearMonth = requestedYm || sortedDataMonths[0] || getCurrentYearMonth();

  const availableSet = new Set<string>([getCurrentYearMonth(), yearMonth, ...sortedDataMonths]);
  const availableMonths = Array.from(availableSet).sort((a, b) => b.localeCompare(a));

  const monthItems = items.filter((r) => extractRecordDate(r).slice(0, 7) === yearMonth);
  const successItems = monthItems.filter((r) => r.status === 'SUCCESS');
  const failedItems = monthItems.filter((r) => r.status === 'FAILED');
  const skippedItems = monthItems.filter((r) => r.status === 'SKIPPED');

  const speedCount = successItems.filter((r) => r.enfCode === '1').length;
  const signalCount = successItems.filter((r) => r.enfCode === '3').length;
  const speeds = successItems.filter((r) => r.enfSpeed > 0).map((r) => r.enfSpeed);
  const avgSpeed =
    speeds.length > 0 ? Number((speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1)) : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const activeDeviceCount = new Set(
    successItems.map((r) => r.deviceCode).filter((c) => c && c !== '-'),
  ).size;

  const dailyMap = new Map<string, DailyStatItem>();
  for (const r of monthItems) {
    const day = extractRecordDate(r);
    const cur = dailyMap.get(day) || {
      day,
      label: `${day.slice(8, 10)}일`,
      totalCount: 0,
      speedCount: 0,
      signalCount: 0,
      failedCount: 0,
    };
    if (r.status === 'SUCCESS') {
      cur.totalCount++;
      if (r.enfCode === '1') cur.speedCount++;
      if (r.enfCode === '3') cur.signalCount++;
    } else if (r.status === 'FAILED') {
      cur.failedCount++;
    }
    dailyMap.set(day, cur);
  }

  const deviceMap = new Map<string, { total: number; speed: number; signal: number; speeds: number[] }>();
  for (const r of successItems) {
    const cur = deviceMap.get(r.deviceCode) || { total: 0, speed: 0, signal: 0, speeds: [] };
    cur.total++;
    if (r.enfCode === '1') cur.speed++;
    if (r.enfCode === '3') cur.signal++;
    if (r.enfSpeed > 0) cur.speeds.push(r.enfSpeed);
    deviceMap.set(r.deviceCode, cur);
  }

  const deviceStats: DeviceStatItem[] = Array.from(deviceMap.entries())
    .map(([deviceCode, v]) => ({
      deviceCode,
      totalCount: v.total,
      speedCount: v.speed,
      signalCount: v.signal,
      avgSpeed:
        v.speeds.length > 0
          ? Number((v.speeds.reduce((a, b) => a + b, 0) / v.speeds.length).toFixed(1))
          : 0,
      maxSpeed: v.speeds.length > 0 ? Math.max(...v.speeds) : 0,
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  return {
    yearMonth,
    availableMonths,
    totalProcessed: monthItems.length,
    totalSuccess: successItems.length,
    totalFailed: failedItems.length,
    totalSkipped: skippedItems.length,
    speedCount,
    signalCount,
    avgSpeed,
    maxSpeed,
    activeDeviceCount,
    dailyStats: Array.from(dailyMap.values()).sort((a, b) => a.day.localeCompare(b.day)),
    deviceStats,
  };
}

export const MonthlyStatsView: React.FC<MonthlyStatsViewProps> = ({ onStatusMessage }) => {
  const [selectedYm, setSelectedYm] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<MonthlyStatsReport | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async (targetYm?: string) => {
    if (typeof window.atojApi.getMonthlyStats === 'function') {
      const res = await window.atojApi.getMonthlyStats(targetYm);
      if (res.success && res.data) {
        setReport(res.data);
        setSelectedYm(res.data.yearMonth);
        return;
      }
    }
    const histRes = await window.atojApi.queryHistory({ limit: 1000, offset: 0 });
    if (histRes.success && histRes.data) {
      const built = buildFallbackReportFromHistory(histRes.data.items, targetYm);
      setReport(built);
      setSelectedYm(built.yearMonth);
    }
  }, []);

  useEffect(() => {
    void fetchStats(selectedYm);
  }, [selectedYm, fetchStats]);

  useEffect(() => {
    const unsub = window.atojApi.onConversionEvent(() => {
      void fetchStats(selectedYm);
    });
    return () => unsub();
  }, [selectedYm, fetchStats]);

  const activeYm = selectedYm || report?.yearMonth || getCurrentYearMonth();
  const [yLabel, mLabel] = activeYm.split('-');

  const handleExportPdf = async () => {
    if (typeof window.atojApi.exportMonthlyPdf !== 'function') {
      onStatusMessage('PDF 보고서 출력을 위해 프로그램을 한 번 재시작해 주세요.');
      return;
    }
    setExporting(true);
    try {
      const res = await window.atojApi.exportMonthlyPdf(activeYm);
      if (res.success && res.data) {
        onStatusMessage(`PDF 보고서 출력 완료: ${res.data.filePath}`);
      } else if (res.error) {
        onStatusMessage(res.error);
      }
    } finally {
      setExporting(false);
    }
  };

  const totalSuccess = report?.totalSuccess ?? 0;
  const totalProcessed = report?.totalProcessed ?? 0;
  const successRate =
    totalProcessed > 0 ? ((totalSuccess / totalProcessed) * 100).toFixed(1) : '100.0';
  const speedPct =
    totalSuccess > 0 ? (((report?.speedCount ?? 0) / totalSuccess) * 100).toFixed(1) : '0.0';
  const signalPct =
    totalSuccess > 0 ? (((report?.signalCount ?? 0) / totalSuccess) * 100).toFixed(1) : '0.0';
  const maxDaily = Math.max(...(report?.dailyStats.map((d) => d.totalCount) ?? [1]), 1);

  return (
    <div className="h-full p-3.5 w-full min-h-0 flex flex-col gap-3">
      {/* 상단 연월 선택 (뷰어와 동일한 아이콘 스테퍼 스타일) 및 PDF 출력 바 */}
      <section className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-3.5 py-2 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedYm(shiftYearMonth(activeYm, -1))}
              title="이전 달"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3.5 h-7 flex items-center justify-center text-[13px] font-bold text-[#0f172a] whitespace-nowrap border-x border-[#e2e8f0] bg-[#ffffff] min-w-[104px]">
              {yLabel}년 {mLabel}월
            </div>

            <button
              type="button"
              onClick={() => setSelectedYm(shiftYearMonth(activeYm, 1))}
              title="다음 달"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a] transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-[12px] text-[#64748b] truncate">
            월간 단속 변환 실적 집계 및 발주처 제출용 A4 공식 보고서 출력
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PillButton variant="pearl-capsule" size="sm" onClick={() => void fetchStats(activeYm)}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>새로고침</span>
          </PillButton>
          <PillButton
            variant="primary"
            size="sm"
            disabled={exporting}
            onClick={() => void handleExportPdf()}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{exporting ? 'PDF 생성 중...' : 'PDF 보고서 출력 (발주처 제출용)'}</span>
          </PillButton>
        </div>
      </section>

      {/* 월간 요약 KPI 4단 */}
      <div className="grid grid-cols-4 gap-2.5 shrink-0">
        <div className="bg-[#0f172a] text-white border border-[#1e293b] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-slate-300">월간 정상 변환</div>
            <div className="text-[11px] text-slate-400 mt-0.5">성공률 {successRate}%</div>
          </div>
          <div className="text-[22px] font-bold text-[#38bdf8]">
            {totalSuccess.toLocaleString()}<span className="text-[12px] text-slate-300 ml-1">건</span>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-[#64748b]">속도위반</div>
            <div className="text-[11px] text-[#2563eb] font-medium mt-0.5">비중 {speedPct}%</div>
          </div>
          <div className="text-[22px] font-bold text-[#2563eb]">
            {(report?.speedCount ?? 0).toLocaleString()}<span className="text-[12px] text-[#64748b] ml-1">건</span>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-[#64748b]">신호위반</div>
            <div className="text-[11px] text-[#e11d48] font-medium mt-0.5">비중 {signalPct}%</div>
          </div>
          <div className="text-[22px] font-bold text-[#e11d48]">
            {(report?.signalCount ?? 0).toLocaleString()}<span className="text-[12px] text-[#64748b] ml-1">건</span>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex items-center justify-between">
          <div>
            <div className="text-[11.5px] text-[#64748b]">가동 장비 · 평균속도</div>
            <div className="text-[11px] text-[#475569] mt-0.5">
              평균 {report?.avgSpeed ?? 0} / 최고 {report?.maxSpeed ?? 0} km/h
            </div>
          </div>
          <div className="text-[22px] font-bold text-[#0f172a]">
            {report?.activeDeviceCount ?? 0}<span className="text-[12px] text-[#64748b] ml-1">대</span>
          </div>
        </div>
      </div>

      {/* 하단 2단: 일자별 추이 차트 + 장비별 집계 시트 */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        <section className="col-span-7 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] p-3.5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2563eb]" />
              <h3 className="text-[14px] font-bold text-[#0f172a]">일자별 단속 변환 추이 차트</h3>
            </div>
            <div className="flex items-center gap-3 text-[11.5px]">
              <span className="inline-flex items-center gap-1 text-[#334155]">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2563eb]" /> 속도위반
              </span>
              <span className="inline-flex items-center gap-1 text-[#334155]">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[#e11d48]" /> 신호위반
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 flex flex-col justify-end overflow-x-auto">
            {!report || report.dailyStats.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[13px] text-[#64748b]">
                {yLabel}년 {mLabel}월에 집계된 변환 이력이 없습니다.
              </div>
            ) : (
              <div className="flex items-end gap-2 h-full pt-6 pb-1 px-1 min-w-full">
                {report.dailyStats.map((d) => {
                  const totalH = Math.max(Math.round((d.totalCount / maxDaily) * 180), 6);
                  const sigH = d.totalCount > 0 ? Math.round((d.signalCount / d.totalCount) * totalH) : 0;
                  const spdH = Math.max(totalH - sigH, 0);
                  return (
                    <div
                      key={d.day}
                      className="flex-1 min-w-[24px] flex flex-col items-center justify-end h-full"
                      title={`${d.day}: 총 ${d.totalCount}건 (속도 ${d.speedCount}건, 신호 ${d.signalCount}건)`}
                    >
                      <span className="text-[10.5px] font-bold text-[#0f172a] mb-1">
                        {d.totalCount}
                      </span>
                      <div className="w-full max-w-[26px] rounded-t-[4px] overflow-hidden flex flex-col">
                        <div style={{ height: `${sigH}px` }} className="bg-[#e11d48] w-full" />
                        <div style={{ height: `${spdH}px` }} className="bg-[#2563eb] w-full" />
                      </div>
                      <span className="text-[10.5px] text-[#64748b] mt-1.5 whitespace-nowrap">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 우측: 장비번호별 집계 단일 테두리 테이블 시트 */}
        <section className="col-span-5 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] overflow-hidden flex flex-col min-h-0">
          <div className="px-3.5 py-2.5 border-b border-[#cbd5e1] flex items-center justify-between shrink-0">
            <h3 className="text-[14px] font-bold text-[#0f172a]">장비번호별 단속 실적</h3>
            <span className="text-[11.5px] text-[#64748b]">
              총 {report?.deviceStats.length ?? 0}개 장비
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 bg-[#f1f5f9] border-b border-[#cbd5e1] text-[#334155]">
                <tr>
                  <th className="py-2 px-2.5 font-semibold">장비번호</th>
                  <th className="py-2 px-2.5 font-semibold text-right">합계</th>
                  <th className="py-2 px-2.5 font-semibold text-right">속도/신호</th>
                  <th className="py-2 px-2.5 font-semibold text-right">평균/최고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {!report || report.deviceStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-[#64748b]">
                      집계된 장비 실적이 없습니다.
                    </td>
                  </tr>
                ) : (
                  report.deviceStats.map((dev) => (
                    <tr key={dev.deviceCode} className="hover:bg-[#f8fafc]">
                      <td className="py-2 px-2.5 font-bold text-[#0f172a]">{dev.deviceCode}</td>
                      <td className="py-2 px-2.5 text-right font-bold text-[#0f172a]">
                        {dev.totalCount.toLocaleString()}건
                      </td>
                      <td className="py-2 px-2.5 text-right whitespace-nowrap">
                        <span className="text-[#2563eb] font-semibold">{dev.speedCount}</span>
                        <span className="text-[#94a3b8] mx-1">/</span>
                        <span className="text-[#e11d48] font-semibold">{dev.signalCount}</span>
                      </td>
                      <td className="py-2 px-2.5 text-right text-[#475569] whitespace-nowrap">
                        {dev.avgSpeed} / {dev.maxSpeed}km/h
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
