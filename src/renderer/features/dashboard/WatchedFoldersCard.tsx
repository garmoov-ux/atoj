import React from 'react';
import { CheckCircle2, Folder, XCircle } from 'lucide-react';
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
      title="수신 감시 폴더 및 출력 경로 상태"
      subtitle="config.json에 등록된 아규격 수신 폴더(paths.sources)의 연결 상태입니다."
      rightAction={
        <PillButton variant="pearl-capsule" size="sm" onClick={onGoSettings}>
          경로 설정 변경
        </PillButton>
      }
    >
      <div className="space-y-2.5">
        {summary.watchedFolders.length === 0 ? (
          <div className="text-[14px] text-[#7a7a7a] py-4">
            등록된 감시 폴더가 없습니다. 설정 탭에서 수신 폴더를 추가하세요.
          </div>
        ) : (
          summary.watchedFolders.map((folder) => (
            <div
              key={folder.path}
              className="flex items-center justify-between px-4 py-3 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Folder className="w-4 h-4 text-[#0066cc] shrink-0" />
                <span className="text-[14px] font-mono text-[#1d1d1f] truncate">
                  {folder.path}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full ${
                  folder.exists
                    ? 'bg-[#ffffff] text-[#0066cc] border border-[#e0e0e0]'
                    : 'bg-[#ffffff] text-[#7a7a7a] border border-[#e0e0e0]'
                }`}
              >
                {folder.exists ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0066cc]" />
                    <span>감시 가능</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-[#7a7a7a]" />
                    <span>경로 미존재</span>
                  </>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {config && (
        <div className="mt-5 pt-4 border-t border-[#e0e0e0] grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
          <div>
            <span className="text-[#7a7a7a]">자규격(.DAT) 저장 폴더: </span>
            <strong className="font-mono text-[#1d1d1f]">{config.paths.targetDir}</strong>
          </div>
          <div>
            <span className="text-[#7a7a7a]">로그 저장 폴더: </span>
            <strong className="font-mono text-[#1d1d1f]">{config.paths.logDir}</strong>
          </div>
          <div>
            <span className="text-[#7a7a7a]">쓰기 안정 대기(writeStabilitySec): </span>
            <strong className="text-[#1d1d1f]">{config.watcher.writeStabilitySec}초</strong>
          </div>
        </div>
      )}
    </UtilityCard>
  );
};
