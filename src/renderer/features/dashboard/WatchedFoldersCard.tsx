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
        <span className="text-[13px] text-[#7a7a7a] font-normal whitespace-nowrap">
          {summary.watchedFolders.filter((f) => f.exists).length}/{summary.watchedFolders.length} 연결됨
        </span>
      }
      rightAction={
        <PillButton variant="pearl-capsule" size="sm" onClick={onGoSettings}>
          경로 설정
        </PillButton>
      }
      className="h-full"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {summary.watchedFolders.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[14px] text-[#7a7a7a]">
            등록된 감시 폴더 없음
          </div>
        ) : (
          summary.watchedFolders.map((folder) => (
            <div
              key={folder.path}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[12px] bg-[#f5f5f7] border border-[#e0e0e0]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Folder className="w-4 h-4 text-[#0066cc] shrink-0" />
                <span
                  className="text-[14px] text-[#1d1d1f] truncate"
                  title={folder.path}
                >
                  {folder.path}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                  folder.exists
                    ? 'bg-[#ffffff] text-[#0066cc] border border-[#e0e0e0]'
                    : 'bg-[#ffffff] text-[#7a7a7a] border border-[#e0e0e0]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    folder.exists ? 'bg-[#0066cc]' : 'bg-[#7a7a7a]'
                  }`}
                />
                <span>{folder.exists ? '정상' : '경로 없음'}</span>
              </span>
            </div>
          ))
        )}
      </div>

      {config && (
        <div className="mt-4 pt-3.5 border-t border-[#e0e0e0] space-y-2 text-[13px] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#7a7a7a] whitespace-nowrap">변환 파일 저장 경로</span>
            <strong className="text-[#1d1d1f] truncate">{config.paths.targetDir}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#7a7a7a] whitespace-nowrap">로그 기록 저장 경로</span>
            <strong className="text-[#1d1d1f] truncate">{config.paths.logDir}</strong>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[#7a7a7a] whitespace-nowrap">대기 시간 · 비규격 처리</span>
            <strong className="text-[#1d1d1f] whitespace-nowrap">
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
