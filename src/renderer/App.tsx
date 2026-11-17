import React, { useState } from 'react';
import { GlobalNav, type NavTab } from './components/layout/GlobalNav';
import { StatusFooter } from './components/layout/StatusFooter';
import { DashboardView } from './features/dashboard/DashboardView';
import { HistoryView } from './features/history/HistoryView';
import { BinaryViewerView } from './features/viewer/BinaryViewerView';
import { MonthlyStatsView } from './features/stats/MonthlyStatsView';
import { RealtimeLogsView } from './features/logs/RealtimeLogsView';
import { SettingsView } from './features/settings/SettingsView';
import { ProgramInfoModal } from './features/about/ProgramInfoView';
import { useAtojState } from './hooks/useAtojState';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const {
    summary,
    config,
    recentRecords,
    inspected,
    toastMessage,
    showToast,
    toggleWatcher,
    scanNow,
    saveConfig,
    runRetentionCleanupNow,
    inspectRecordById,
    inspectFileByPath,
    selectAndInspectFile,
    manualConvertSingleFile,
  } = useAtojState();

  const handleOpenRecordInViewer = async (record: { id: number; targetPath: string | null; sourcePath: string }) => {
    const ok = await inspectRecordById(record.id);
    if (ok) {
      setActiveTab('viewer');
      return;
    }
    const fallbackPath = record.targetPath || record.sourcePath;
    if (fallbackPath && (await inspectFileByPath(fallbackPath))) {
      setActiveTab('viewer');
    }
  };

  const handleSelectTab = (tab: NavTab) => {
    setIsAboutOpen(false);
    setActiveTab(tab);
    if (tab === 'viewer' && !inspected) {
      void inspectRecordById();
    }
  };

  const handleManualConvert = async () => {
    const outputPath = await manualConvertSingleFile();
    if (outputPath) {
      setActiveTab('viewer');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-row bg-[#f1f5f9] text-[#0f172a] select-none">
      <GlobalNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isAboutOpen={isAboutOpen}
        onOpenAbout={() => setIsAboutOpen((prev) => !prev)}
        isWatching={summary.isWatching}
        onToggleWatcher={() => void toggleWatcher()}
        onScanNow={() => void scanNow()}
        onManualConvert={() => void handleManualConvert()}
      />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        <main className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              summary={summary}
              config={config}
              recentRecords={recentRecords}
              onInspectRecord={(r) => void handleOpenRecordInViewer(r)}
              onGoHistory={() => setActiveTab('history')}
              onGoSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'viewer' && (
            <BinaryViewerView
              inspected={inspected}
              onSelectRecordById={(id) => void inspectRecordById(id)}
              onSelectFileToInspect={() => void selectAndInspectFile()}
              onManualConvert={() => void handleManualConvert()}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              onInspectRecord={(r) => void handleOpenRecordInViewer(r)}
              onStatusMessage={showToast}
            />
          )}

          {activeTab === 'stats' && (
            <MonthlyStatsView onStatusMessage={showToast} />
          )}

          {activeTab === 'logs' && (
            <RealtimeLogsView
              logDir={config?.paths.logDir || './log'}
              onStatusMessage={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              config={config}
              onSaveConfig={saveConfig}
              onRunCleanupNow={runRetentionCleanupNow}
            />
          )}
        </main>

        <StatusFooter />
      </div>

      <ProgramInfoModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onScanNow={() => void scanNow()}
        onRunCleanupNow={() => void runRetentionCleanupNow()}
        onStatusMessage={showToast}
      />

      {toastMessage && (
        <div className="fixed bottom-9 right-4 z-50 px-3.5 py-2 rounded-[8px] bg-[#0f172a] text-white text-[12px] border border-[#334155] whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
