import React from 'react';
import { FolderSearch, Pause, Play } from 'lucide-react';
import { PillButton } from '../ui/PillButton';
import type { DashboardSummary } from '@shared/types/domain';

interface FrostedSubNavProps {
  title: string;
  summary: DashboardSummary;
  onToggleWatcher: () => void;
  onScanNow: () => void;
}

export const FrostedSubNav: React.FC<FrostedSubNavProps> = ({
  title,
  summary,
  onToggleWatcher,
  onScanNow,
}) => {
  return (
    <header className="sticky top-0 z-20 h-[52px] apple-frosted-subnav border-b border-[#e0e0e0] px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-[21px] font-semibold tracking-[-0.015em] text-[#1d1d1f]">
          {title}
        </h1>
        <span className="text-[13px] text-[#7a7a7a]">
          금일 변환 <strong className="font-semibold text-[#1d1d1f]">{summary.todayConverted}</strong>건 · 누적{' '}
          <strong className="font-semibold text-[#1d1d1f]">{summary.totalConverted}</strong>건
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <PillButton variant="secondary-pill" size="sm" onClick={onScanNow}>
          <FolderSearch className="w-3.5 h-3.5" />
          <span>수신 폴더 즉시 스캔</span>
        </PillButton>

        <PillButton
          variant={summary.isWatching ? 'dark-utility' : 'primary'}
          size="sm"
          onClick={onToggleWatcher}
        >
          {summary.isWatching ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>감시 일시중지</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>실시간 감시 시작</span>
            </>
          )}
        </PillButton>
      </div>
    </header>
  );
};
