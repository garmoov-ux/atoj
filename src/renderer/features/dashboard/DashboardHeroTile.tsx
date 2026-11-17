import React from 'react';
import { FileUp } from 'lucide-react';
import { PillButton } from '../../components/ui/PillButton';
import type { DashboardSummary } from '@shared/types/domain';

interface DashboardHeroTileProps {
  summary: DashboardSummary;
  onManualConvert: () => void;
  onOpenViewer: () => void;
}

export const DashboardHeroTile: React.FC<DashboardHeroTileProps> = ({
  summary,
  onManualConvert,
  onOpenViewer,
}) => {
  const kpis = [
    { label: '금일 자규격(.DAT) 변환', value: summary.todayConverted.toLocaleString(), unit: '건' },
    { label: '누적 변환 완료', value: summary.totalConverted.toLocaleString(), unit: '건' },
    { label: '속도위반 (0x01)', value: summary.speedCount.toLocaleString(), unit: '건' },
    { label: '신호위반 (0x03)', value: summary.signalCount.toLocaleString(), unit: '건' },
    { label: '변환 오류', value: summary.failedCount.toLocaleString(), unit: '건' },
  ];

  return (
    <section className="bg-[#272729] text-white px-8 py-10 border-b border-[#3a3a3c]">
      <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <p className="text-[13px] text-[#2997ff] font-semibold tracking-[-0.01em]">
            경찰청 무인교통단속장비 표준 규격 변환 엔진
          </p>
          <h2 className="mt-1.5 text-[34px] font-semibold tracking-[-0.374px] leading-[1.15]">
            아규격(114B) → 자규격(.DAT) 실시간 무결성 변환
          </h2>
          <p className="mt-2 text-[15px] text-[#cccccc] max-w-[680px]">
            센터 수신 폴더의 아규격 단속 데이터를 실시간 감시하여 Big-Endian 자규격 바이너리로 즉시 변환하고
            SQLite(WAL)에 모든 처리 이력을 기록합니다.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <PillButton variant="primary" onClick={onManualConvert}>
              <FileUp className="w-4 h-4" />
              <span>단일 아규격 파일 수동 변환</span>
            </PillButton>
            <button
              type="button"
              onClick={onOpenViewer}
              className="text-[14px] text-[#2997ff] px-3 py-2 cursor-pointer transition-transform duration-150 active:scale-95"
            >
              생성된 .DAT 파일 정밀 검증하기
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
          {kpis.map((item) => (
            <div
              key={item.label}
              className="bg-[#2a2a2c] border border-[#3a3a3c] rounded-[18px] px-4 py-3.5 min-w-[130px]"
            >
              <div className="text-[12px] text-[#cccccc]">{item.label}</div>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-[24px] font-semibold tracking-[-0.02em] text-white">
                  {item.value}
                </span>
                <span className="text-[12px] text-[#cccccc]">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
