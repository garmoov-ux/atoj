import React from 'react';
import type { DashboardSummary } from '@shared/types/domain';

interface DashboardHeroTileProps {
  summary: DashboardSummary;
}

export const DashboardHeroTile: React.FC<DashboardHeroTileProps> = ({ summary }) => {
  const kpis = [
    { label: '오늘 변환', value: summary.todayConverted.toLocaleString(), accent: true },
    { label: '누적 완료', value: summary.totalConverted.toLocaleString(), accent: false },
    { label: '속도위반', value: summary.speedCount.toLocaleString(), accent: false },
    { label: '신호위반', value: summary.signalCount.toLocaleString(), accent: false },
    { label: '변환 실패', value: summary.failedCount.toLocaleString(), accent: false },
  ];

  return (
    <div className="grid grid-cols-5 gap-3.5 shrink-0">
      {kpis.map((item) => (
        <div
          key={item.label}
          className={`rounded-[16px] px-5 py-4 flex items-center justify-between border ${
            item.accent
              ? 'bg-[#272729] text-white border-[#3a3a3c]'
              : 'bg-[#ffffff] text-[#1d1d1f] border-[#e0e0e0]'
          }`}
        >
          <span
            className={`text-[14px] font-medium whitespace-nowrap ${
              item.accent ? 'text-[#cccccc]' : 'text-[#7a7a7a]'
            }`}
          >
            {item.label}
          </span>
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <span
              className={`text-[26px] font-semibold tracking-[-0.02em] leading-none ${
                item.accent ? 'text-[#2997ff]' : 'text-[#1d1d1f]'
              }`}
            >
              {item.value}
            </span>
            <span
              className={`text-[13px] ${item.accent ? 'text-[#cccccc]' : 'text-[#7a7a7a]'}`}
            >
              건
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
