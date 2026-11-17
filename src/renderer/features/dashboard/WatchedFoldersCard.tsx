import React from 'react';
import { Folder } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import type { AtojAppConfig, DashboardSummary } from '@shared/types/domain';

interface WatchedFoldersCardProps {
  summary: DashboardSummary;
  config: AtojAppConfig | null;
  onGoSettings: () => void;
}

export const WatchedFoldersCard: React.FC<WatchedFoldersCardProps> = ({
  summary,
  config,
  onGoSettings,
}) => {
  return (
    <UtilityCard
      title="수신 감시 폴더"
      badge={
        <span className="text-[12px] text-[#64748b] font-normal whitespace-nowrap">
          {summary.watchedFolders.filter((f) => f.exists).length}/{summary.watchedFolders.length} 연결
        </span>
      }
      rightAction={
        <PillButton variant="pearl-capsule" size="sm" onClick={onGoSettings}>
          경로 설정
        </PillButton>
      }
      className="h-full"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
        {summary.watchedFolders.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[13px] text-[#64748b]">
            등록된 감시 폴더 없음
          </div>
        ) : (
          summary.watchedFolders.map((folder) => (
            <div
              key={folder.path}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-[8px] bg-[#f8fafc] border border-[#cbd5e1]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                <span className="text-[12.5px] text-[#0f172a] font-medium truncate" title={folder.path}>
                  {folder.path}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-[5px] whitespace-nowrap shrink-0 ${
                  folder.exists
                    ? 'bg-[#ecfdf5] text-[#047857] border border-[#6ee7b7]'
                    : 'bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    folder.exists ? 'bg-[#10b981]' : 'bg-[#94a3b8]'
                  }`}
                />
                <span>{folder.exists ? '정상' : '미연결'}</span>
              </span>
            </div>
          ))
        )}
      </div>

      {config && (
        <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] space-y-1.5 text-[12px] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#64748b] whitespace-nowrap">자규격 저장 경로</span>
            <strong className="text-[#0f172a] truncate">{config.paths.targetDir}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#64748b] whitespace-nowrap">로그 기록 경로</span>
            <strong className="text-[#0f172a] truncate">{config.paths.logDir}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#64748b] whitespace-nowrap">대기시간 · 비규격 정책</span>
            <strong className="text-[#0f172a] whitespace-nowrap">
              {config.watcher.writeStabilitySec}초 ·{' '}
              {config.watcher.invalidFilePolicy === 'ignore'
                ? '원본 보존'
                : config.watcher.invalidFilePolicy === 'quarantine'
                  ? '격리 이동'
                  : '즉시 삭제'}
            </strong>
          </div>
        </div>
      )}
    </UtilityCard>
  );
};
