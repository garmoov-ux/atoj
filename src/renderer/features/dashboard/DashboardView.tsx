import React from 'react';
import { DashboardHeroTile } from './DashboardHeroTile';
import { WatchedFoldersCard } from './WatchedFoldersCard';
import { RecentStreamCard } from './RecentStreamCard';
import type { AtojAppConfig, ConversionRecord, DashboardSummary } from '@shared/types/domain';

interface DashboardViewProps {
  summary: DashboardSummary;
  config: AtojAppConfig | null;
  recentRecords: ConversionRecord[];
  onInspectRecord: (record: ConversionRecord) => void;
  onGoHistory: () => void;
  onGoSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  config,
  recentRecords,
  onInspectRecord,
  onGoHistory,
  onGoSettings,
}) => {
  return (
    <div className="h-full flex flex-col gap-3 p-3.5 w-full min-h-0">
      <DashboardHeroTile summary={summary} />

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        <div className="col-span-4 min-h-0">
          <WatchedFoldersCard
            summary={summary}
            config={config}
            onGoSettings={onGoSettings}
          />
        </div>

        <div className="col-span-8 min-h-0">
          <RecentStreamCard
            records={recentRecords}
            onInspectRecord={onInspectRecord}
            onGoHistory={onGoHistory}
          />
        </div>
      </div>
    </div>
  );
};
