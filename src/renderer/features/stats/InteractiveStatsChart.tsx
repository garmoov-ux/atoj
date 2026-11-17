import React, { useState } from 'react';
import { BarChart3, PieChart, Server } from 'lucide-react';
import type { DailyStatItem, DeviceStatItem, MonthlyStatsReport } from '@shared/types/domain';

type ChartTab = 'daily' | 'device' | 'distribution';

interface InteractiveStatsChartProps {
  report: MonthlyStatsReport | null;
  yearLabel: string;
  monthLabel: string;
}

export const InteractiveStatsChart: React.FC<InteractiveStatsChartProps> = ({
  report,
  yearLabel,
  monthLabel,
}) => {
  const [activeTab, setActiveTab] = useState<ChartTab>('daily');
  const [hoveredDay, setHoveredDay] = useState<DailyStatItem | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<DeviceStatItem | null>(null);
  const [hoveredDonut, setHoveredDonut] = useState<{
    label: string;
    count: number;
    pct: string;
    color: string;
  } | null>(null);

  const dailyStats = report?.dailyStats ?? [];
  const deviceStats = report?.deviceStats ?? [];
  const totalSuccess = report?.totalSuccess ?? 0;
  const speedCount = report?.speedCount ?? 0;
  const signalCount = report?.signalCount ?? 0;
  const otherCount = Math.max(0, totalSuccess - speedCount - signalCount);

  const maxDaily = Math.max(...dailyStats.map((d) => d.totalCount), 4);
  const yTicks = [
    maxDaily,
    Math.round(maxDaily * 0.75),
    Math.round(maxDaily * 0.5),
    Math.round(maxDaily * 0.25),
    0,
  ];

  const maxDeviceTotal = Math.max(...deviceStats.map((d) => d.totalCount), 1);
  const maxDeviceSpeed = Math.max(...deviceStats.map((d) => d.maxSpeed), 100);

  // 도넛 차트 계산 (r = 54, 둘레 = 2 * PI * 54 ≈ 339.29)
  const radius = 54;
  const circum = 2 * Math.PI * radius;
  const speedRatio = totalSuccess > 0 ? speedCount / totalSuccess : 0;
  const signalRatio = totalSuccess > 0 ? signalCount / totalSuccess : 0;
  const otherRatio = totalSuccess > 0 ? otherCount / totalSuccess : 0;

  const speedLen = speedRatio * circum;
  const signalLen = signalRatio * circum;
  const otherLen = otherRatio * circum;

  return (
    <section className="col-span-7 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] p-3.5 flex flex-col min-h-0 relative">
      {/* 상단 차트 헤더 + 탭 스위치 */}
      <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
        <div className="inline-flex items-center p-0.5 rounded-[8px] bg-[#f1f5f9] border border-[#cbd5e1] gap-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`h-[26px] px-2.5 rounded-[6px] text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-[#0f172a] text-white font-semibold'
                : 'text-[#475569] hover:text-[#0f172a] font-medium'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>일자별 추이</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`h-[26px] px-2.5 rounded-[6px] text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'device'
                ? 'bg-[#0f172a] text-white font-semibold'
                : 'text-[#475569] hover:text-[#0f172a] font-medium'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>장비별 비교</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('distribution')}
            className={`h-[26px] px-2.5 rounded-[6px] text-[12px] inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'distribution'
                ? 'bg-[#0f172a] text-white font-semibold'
                : 'text-[#475569] hover:text-[#0f172a] font-medium'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>위반유형 · 속도분포</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2563eb]" /> 속도위반
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#e11d48]" /> 신호위반
          </span>
          {otherCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-[#64748b]" /> 기타
            </span>
          )}
        </div>
      </div>

      {/* 탭 1: 일자별 추이 차트 (Y축 눈금 + 그리드 + 호버 툴팁 카드) */}
      {activeTab === 'daily' && (
        <div className="flex-1 min-h-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3 flex flex-col relative overflow-hidden">
          {hoveredDay && (
            <div className="absolute top-2.5 right-3 z-20 bg-[#0f172a] text-white border border-[#334155] rounded-[8px] px-3 py-2 text-[11.5px] apple-product-shadow pointer-events-none min-w-[175px]">
              <div className="font-bold text-[#38bdf8] border-b border-[#334155] pb-1 mb-1 flex items-center justify-between">
                <span>{hoveredDay.day}</span>
                <span>총 {hoveredDay.totalCount.toLocaleString()}건</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">속도위반</span>
                  <span className="font-bold text-[#60a5fa]">{hoveredDay.speedCount.toLocaleString()}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">신호위반</span>
                  <span className="font-bold text-[#fb7185]">{hoveredDay.signalCount.toLocaleString()}건</span>
                </div>
                {hoveredDay.failedCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">변환실패</span>
                    <span className="font-semibold text-amber-400">{hoveredDay.failedCount}건</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {dailyStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[13px] text-[#64748b]">
              {yearLabel}년 {monthLabel}월에 집계된 단속 변환 데이터가 없습니다.
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex gap-2">
              {/* 좌측 Y축 눈금 */}
              <div className="w-8 flex flex-col justify-between pb-6 pt-2 text-[10.5px] text-[#64748b] text-right font-mono shrink-0">
                {yTicks.map((t, i) => (
                  <span key={i}>{t}</span>
                ))}
              </div>

              {/* 우측 그래프 캔버스 */}
              <div className="flex-1 min-w-0 relative flex flex-col">
                {/* 배경 수평 점선 그리드 */}
                <div className="absolute inset-0 bottom-6 top-2 flex flex-col justify-between pointer-events-none">
                  {yTicks.map((_, i) => (
                    <div
                      key={i}
                      className="w-full border-b border-dashed border-[#cbd5e1]/80 last:border-solid last:border-[#94a3b8]"
                    />
                  ))}
                </div>

                {/* 막대 영역 */}
                <div className="flex-1 min-h-0 flex items-end gap-2 pt-2 pb-6 px-2 overflow-x-auto relative z-10">
                  {dailyStats.map((d) => {
                    const isHovered = hoveredDay?.day === d.day;
                    const ratio = Math.min(d.totalCount / maxDaily, 1);
                    const totalPct = Math.max(Math.round(ratio * 100), 3);
                    const sigPct =
                      d.totalCount > 0 ? Math.round((d.signalCount / d.totalCount) * 100) : 0;
                    const spdPct =
                      d.totalCount > 0 ? Math.round((d.speedCount / d.totalCount) * 100) : 0;
                    const etcPct = Math.max(0, 100 - sigPct - spdPct);

                    return (
                      <div
                        key={d.day}
                        onMouseEnter={() => setHoveredDay(d)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`flex-1 min-w-[28px] h-full flex flex-col items-center justify-end group cursor-pointer relative px-1 rounded-[6px] transition-colors ${
                          isHovered ? 'bg-[#e2e8f0]/60' : ''
                        }`}
                      >
                        <span
                          className={`text-[10.5px] font-bold mb-1 transition-transform ${
                            isHovered ? 'text-[#2563eb] scale-110' : 'text-[#0f172a]'
                          }`}
                        >
                          {d.totalCount}
                        </span>

                        <div
                          style={{ height: `${totalPct}%` }}
                          className={`w-full max-w-[26px] rounded-t-[5px] overflow-hidden flex flex-col transition-all ${
                            isHovered ? 'ring-2 ring-[#0f172a]' : ''
                          }`}
                        >
                          {sigPct > 0 && (
                            <div style={{ height: `${sigPct}%` }} className="bg-[#e11d48] w-full" />
                          )}
                          {spdPct > 0 && (
                            <div style={{ height: `${spdPct}%` }} className="bg-[#2563eb] w-full" />
                          )}
                          {etcPct > 0 && (
                            <div style={{ height: `${etcPct}%` }} className="bg-[#64748b] w-full" />
                          )}
                        </div>

                        <span
                          className={`absolute -bottom-5 text-[10.5px] whitespace-nowrap ${
                            isHovered ? 'font-bold text-[#0f172a]' : 'text-[#64748b]'
                          }`}
                        >
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 탭 2: 장비별 비교 차트 (마우스 호버 툴팁 포함) */}
      {activeTab === 'device' && (
        <div className="flex-1 min-h-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3.5 flex flex-col relative overflow-y-auto space-y-2.5">
          {hoveredDevice && (
            <div className="fixed bottom-12 left-[320px] z-30 bg-[#0f172a] text-white border border-[#334155] rounded-[8px] px-3.5 py-2 text-[11.5px] apple-product-shadow pointer-events-none min-w-[210px]">
              <div className="font-bold text-[#38bdf8] border-b border-[#334155] pb-1 mb-1 flex items-center justify-between">
                <span>장비 {hoveredDevice.deviceCode}</span>
                <span>합계 {hoveredDevice.totalCount.toLocaleString()}건</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <span className="text-slate-300">속도위반</span>
                <span className="text-right font-bold text-[#60a5fa]">
                  {hoveredDevice.speedCount.toLocaleString()}건
                </span>
                <span className="text-slate-300">신호위반</span>
                <span className="text-right font-bold text-[#fb7185]">
                  {hoveredDevice.signalCount.toLocaleString()}건
                </span>
                <span className="text-slate-300">평균 / 최고속도</span>
                <span className="text-right font-semibold text-white">
                  {hoveredDevice.avgSpeed} / {hoveredDevice.maxSpeed} km/h
                </span>
              </div>
            </div>
          )}

          {deviceStats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[13px] text-[#64748b]">
              집계된 장비별 단속 데이터가 없습니다.
            </div>
          ) : (
            deviceStats.map((dev) => {
              const widthPct = Math.max(Math.round((dev.totalCount / maxDeviceTotal) * 100), 4);
              const spdShare =
                dev.totalCount > 0 ? Math.round((dev.speedCount / dev.totalCount) * 100) : 0;
              const sigShare =
                dev.totalCount > 0 ? Math.round((dev.signalCount / dev.totalCount) * 100) : 0;
              const etcShare = Math.max(0, 100 - spdShare - sigShare);
              const totalShare =
                totalSuccess > 0 ? ((dev.totalCount / totalSuccess) * 100).toFixed(1) : '0.0';

              return (
                <div
                  key={dev.deviceCode}
                  onMouseEnter={() => setHoveredDevice(dev)}
                  onMouseLeave={() => setHoveredDevice(null)}
                  className="bg-[#ffffff] border border-[#cbd5e1] hover:border-[#2563eb] rounded-[8px] px-3 py-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0f172a] text-[13px]">{dev.deviceCode}</span>
                      <span className="text-[11px] text-[#64748b]">
                        점유율 {totalShare}% · 평균 {dev.avgSpeed}km/h (최고 {dev.maxSpeed}km/h)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[12px]">
                      <span className="text-[#2563eb] font-semibold">속도 {dev.speedCount}</span>
                      <span className="text-[#cbd5e1]">|</span>
                      <span className="text-[#e11d48] font-semibold">신호 {dev.signalCount}</span>
                      <span className="text-[#cbd5e1]">|</span>
                      <span className="font-bold text-[#0f172a]">{dev.totalCount}건</span>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full flex rounded-full overflow-hidden"
                    >
                      {spdShare > 0 && (
                        <div style={{ width: `${spdShare}%` }} className="bg-[#2563eb] h-full" />
                      )}
                      {sigShare > 0 && (
                        <div style={{ width: `${sigShare}%` }} className="bg-[#e11d48] h-full" />
                      )}
                      {etcShare > 0 && (
                        <div style={{ width: `${etcShare}%` }} className="bg-[#64748b] h-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 탭 3: 위반유형 도넛 차트 & 장비별 평균/최고 속도 분포 */}
      {activeTab === 'distribution' && (
        <div className="flex-1 min-h-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-[8px] p-3.5 grid grid-cols-12 gap-3 relative overflow-hidden">
          {hoveredDonut && (
            <div className="absolute top-2.5 right-3 z-20 bg-[#0f172a] text-white border border-[#334155] rounded-[8px] px-3 py-1.5 text-[11.5px] apple-product-shadow pointer-events-none">
              <span className="font-bold" style={{ color: hoveredDonut.color }}>
                {hoveredDonut.label}
              </span>
              <span className="mx-1.5 text-slate-400">:</span>
              <span className="font-bold">{hoveredDonut.count.toLocaleString()}건</span>
              <span className="ml-1 text-slate-300">({hoveredDonut.pct}%)</span>
            </div>
          )}

          {/* 좌측: SVG 도넛 차트 */}
          <div className="col-span-5 bg-[#ffffff] border border-[#cbd5e1] rounded-[8px] p-3 flex flex-col items-center justify-center">
            <div className="text-[12px] font-bold text-[#334155] mb-2">위반유형 구성비</div>
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="16"
                />
                {speedLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#2563eb"
                    strokeWidth="16"
                    strokeDasharray={`${speedLen} ${circum}`}
                    strokeDashoffset={0}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() =>
                      setHoveredDonut({
                        label: '속도위반',
                        count: speedCount,
                        pct: (speedRatio * 100).toFixed(1),
                        color: '#60a5fa',
                      })
                    }
                    onMouseLeave={() => setHoveredDonut(null)}
                  />
                )}
                {signalLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#e11d48"
                    strokeWidth="16"
                    strokeDasharray={`${signalLen} ${circum}`}
                    strokeDashoffset={-speedLen}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() =>
                      setHoveredDonut({
                        label: '신호위반',
                        count: signalCount,
                        pct: (signalRatio * 100).toFixed(1),
                        color: '#fb7185',
                      })
                    }
                    onMouseLeave={() => setHoveredDonut(null)}
                  />
                )}
                {otherLen > 0 && (
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#64748b"
                    strokeWidth="16"
                    strokeDasharray={`${otherLen} ${circum}`}
                    strokeDashoffset={-(speedLen + signalLen)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() =>
                      setHoveredDonut({
                        label: '기타 단속',
                        count: otherCount,
                        pct: (otherRatio * 100).toFixed(1),
                        color: '#cbd5e1',
                      })
                    }
                    onMouseLeave={() => setHoveredDonut(null)}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10.5px] text-[#64748b]">총 변환</span>
                <span className="text-[18px] font-extrabold text-[#0f172a]">
                  {totalSuccess.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* 우측: 장비별 평균/최고 위반속도 비교 */}
          <div className="col-span-7 bg-[#ffffff] border border-[#cbd5e1] rounded-[8px] p-3 flex flex-col min-h-0">
            <div className="text-[12px] font-bold text-[#334155] mb-2 shrink-0">
              장비별 평균 · 최고 위반속도 (km/h)
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1">
              {deviceStats.map((dev) => {
                const avgPct = Math.min(Math.round((dev.avgSpeed / maxDeviceSpeed) * 100), 100);
                const maxPct = Math.min(Math.round((dev.maxSpeed / maxDeviceSpeed) * 100), 100);
                return (
                  <div
                    key={dev.deviceCode}
                    onMouseEnter={() =>
                      setHoveredDonut({
                        label: `${dev.deviceCode} 최고속도`,
                        count: dev.maxSpeed,
                        pct: `평균 ${dev.avgSpeed}km/h`,
                        color: '#38bdf8',
                      })
                    }
                    onMouseLeave={() => setHoveredDonut(null)}
                    className="space-y-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-bold text-[#0f172a]">{dev.deviceCode}</span>
                      <span className="text-[#475569]">
                        평균 <strong className="text-[#2563eb]">{dev.avgSpeed}</strong> · 최고{' '}
                        <strong className="text-[#e11d48]">{dev.maxSpeed}</strong> km/h
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden relative">
                      <div
                        style={{ width: `${maxPct}%` }}
                        className="h-full bg-[#fda4af] rounded-full"
                      />
                      <div
                        style={{ width: `${avgPct}%` }}
                        className="h-full bg-[#2563eb] rounded-full absolute left-0 top-0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
