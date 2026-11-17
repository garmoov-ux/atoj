import React, { useState } from 'react';
import { GlobalNav, type NavTab } from './components/layout/GlobalNav';
import { FrostedSubNav } from './components/layout/FrostedSubNav';
import { StatusFooter } from './components/layout/StatusFooter';
import { DashboardView } from './features/dashboard/DashboardView';
import { HistoryView } from './features/history/HistoryView';
import { BinaryViewerView } from './features/viewer/BinaryViewerView';
import { SettingsView } from './features/settings/SettingsView';
import { useAtojState } from './hooks/useAtojState';

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'AtoJ 실시간 변환 관제',
  history: 'SQLite 단속 변환 이력',
  viewer: '자규격(.DAT) & 아규격 정밀 뷰어',
  settings: '감시 경로 및 안전 정책 설정',
};

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
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f]">
      <GlobalNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isWatching={summary.isWatching}
      />

      <FrostedSubNav
        title={TAB_TITLES[activeTab]}
        summary={summary}
        onToggleWatcher={() => void toggleWatcher()}
        onScanNow={() => void scanNow()}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            config={config}
            recentRecords={recentRecords}
            onManualConvert={() => void handleManualConvert()}
            onInspectFile={(fp) => void handleOpenInViewer(fp)}
            onGoHistory={() => setActiveTab('history')}
            onGoViewer={() => setActiveTab('viewer')}
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
        <div className="fixed bottom-5 right-6 z-50 px-5 py-3 rounded-full bg-[#1d1d1f] text-white text-[13px] border border-[#3a3a3c]">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
