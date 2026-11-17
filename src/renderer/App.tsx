import React, { useState } from 'react';
import { GlobalNav, type NavTab } from './components/layout/GlobalNav';
import { StatusFooter } from './components/layout/StatusFooter';
import { DashboardView } from './features/dashboard/DashboardView';
import { HistoryView } from './features/history/HistoryView';
import { BinaryViewerView } from './features/viewer/BinaryViewerView';
import { SettingsView } from './features/settings/SettingsView';
import { useAtojState } from './hooks/useAtojState';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
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
    inspectFileByPath,
    selectAndInspectFile,
    manualConvertSingleFile,
  } = useAtojState();

  const handleOpenInViewer = async (filePath: string) => {
    const ok = await inspectFileByPath(filePath);
    if (ok) {
      setActiveTab('viewer');
    }
  };

  const handleManualConvert = async () => {
    const outputPath = await manualConvertSingleFile();
    if (outputPath) {
      setActiveTab('viewer');
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#f5f5f7] text-[#1d1d1f] select-none">
      <GlobalNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isWatching={summary.isWatching}
        onToggleWatcher={() => void toggleWatcher()}
        onScanNow={() => void scanNow()}
        onManualConvert={() => void handleManualConvert()}
      />

      <main className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            config={config}
            recentRecords={recentRecords}
            onInspectFile={(fp) => void handleOpenInViewer(fp)}
            onGoHistory={() => setActiveTab('history')}
            onGoSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            onInspectFile={(fp) => void handleOpenInViewer(fp)}
            onStatusMessage={showToast}
          />
        )}

        {activeTab === 'viewer' && (
          <BinaryViewerView
            inspected={inspected}
            onSelectFileToInspect={() => void selectAndInspectFile()}
            onManualConvert={() => void handleManualConvert()}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView config={config} onSaveConfig={saveConfig} />
        )}
      </main>

      <StatusFooter />

      {toastMessage && (
        <div className="fixed bottom-10 right-5 z-50 px-4 py-2 rounded-full bg-[#1d1d1f] text-white text-[12px] border border-[#3a3a3c] whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
