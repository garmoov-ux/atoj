import React from 'react';
import type { DashboardSummary } from '@shared/types/domain';

interface DashboardHeroTileProps {
  summary: DashboardSummary;
}

export const DashboardHeroTile: React.FC<DashboardHeroTileProps> = ({ summary }) => {
  const kpis = [
    {
      label: '오늘 변환 완료',
      value: summary.todayConverted.toLocaleString(),
      tone: 'primary' as const,
    },
    {
      label: '누적 변환 완료',
      value: summary.totalConverted.toLocaleString(),
      tone: 'default' as const,
    },
    {
      label: '속도위반',
      value: summary.speedCount.toLocaleString(),
      tone: 'amber' as const,
    },
    {
      label: '신호위반',
      value: summary.signalCount.toLocaleString(),
      tone: 'rose' as const,
    },
    {
      label: '변환 오류',
      value: summary.failedCount.toLocaleString(),
      tone: 'muted' as const,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-2.5 shrink-0">
      {kpis.map((item) => {
        const isPrimary = item.tone === 'primary';
        const valColor =
          item.tone === 'primary'
            ? 'text-[#38bdf8]'
            : item.tone === 'amber'
              ? 'text-[#d97706]'
              : item.tone === 'rose'
                ? 'text-[#e11d48]'
                : 'text-[#0f172a]';

        return (
          <div
            key={item.label}
            className={`rounded-[10px] px-3.5 py-2.5 flex items-center justify-between border ${
              isPrimary
                ? 'bg-[#0f172a] text-white border-[#1e293b]'
                : 'bg-[#ffffff] text-[#0f172a] border-[#cbd5e1]'
            }`}
          >
            <span
              className={`text-[12.5px] font-medium whitespace-nowrap ${
                isPrimary ? 'text-slate-300' : 'text-[#64748b]'
              }`}
            >
              {item.label}
            </span>
            <div className="flex items-baseline gap-1 whitespace-nowrap">
              <span className={`text-[21px] font-bold tracking-[-0.02em] leading-none ${valColor}`}>
                {item.value}
              </span>
              <span className={`text-[11.5px] ${isPrimary ? 'text-slate-400' : 'text-[#64748b]'}`}>
                건
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
