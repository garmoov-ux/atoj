import React from 'react';
import { DashboardHeroTile } from './DashboardHeroTile';
import { WatchedFoldersCard } from './WatchedFoldersCard';
import { RecentStreamCard } from './RecentStreamCard';
import type { AtojAppConfig, ConversionRecord, DashboardSummary } from '@shared/types/domain';

interface DashboardViewProps {
  summary: DashboardSummary;
  config: AtojAppConfig | null;
  recentRecords: ConversionRecord[];
  onManualConvert: () => void;
  onInspectFile: (filePath: string) => void;
  onGoHistory: () => void;
  onGoViewer: () => void;
  onGoSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  config,
  recentRecords,
  onManualConvert,
  onInspectFile,
  onGoHistory,
  onGoViewer,
  onGoSettings,
}) => {
  return (
    <div>
      <DashboardHeroTile
        summary={summary}
        onManualConvert={onManualConvert}
        onOpenViewer={onGoViewer}
      />

      <div className="max-w-[1360px] mx-auto px-6 py-6 space-y-6">
        <WatchedFoldersCard
          summary={summary}
          config={config}
          onGoSettings={onGoSettings}
        />

        <RecentStreamCard
          records={recentRecords}
          onInspectFile={onInspectFile}
          onGoHistory={onGoHistory}
        />
      </div>
    </div>
  );
};
