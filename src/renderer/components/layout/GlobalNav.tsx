import React from 'react';
import {
  Activity,
  Database,
  Eye,
  FileUp,
  FolderSearch,
  Pause,
  Play,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'history' | 'viewer' | 'settings';

interface GlobalNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isWatching: boolean;
  onToggleWatcher: () => void;
  onScanNow: () => void;
  onManualConvert: () => void;
}

const TABS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '실시간 현황', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'history', label: '변환 이력', icon: <Database className="w-3.5 h-3.5" /> },
  { id: 'viewer', label: '단속영상 확인', icon: <Eye className="w-3.5 h-3.5" /> },
  { id: 'settings', label: '환경 설정', icon: <Settings className="w-3.5 h-3.5" /> },
];

export const GlobalNav: React.FC<GlobalNavProps> = ({
  activeTab,
  onSelectTab,
  isWatching,
  onToggleWatcher,
  onScanNow,
  onManualConvert,
}) => {
  return (
    <header className="h-[48px] bg-[#000000] text-white px-5 flex items-center justify-between gap-4 shrink-0 select-none border-b border-[#272729]">
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex items-center gap-2 font-semibold text-[14px] tracking-[-0.01em] whitespace-nowrap shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#2997ff]" />
          <span>아·자 규격 변환기</span>
        </div>

        <nav className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTab(t.id)}
                className={`h-[32px] px-3.5 rounded-full text-[13px] whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-transform duration-150 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-[#0066cc] text-white font-semibold'
                    : 'text-[#cccccc] hover:text-white font-normal'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 우측 아이콘 컨트롤 클러스터 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onManualConvert}
          title="파일 직접 변환"
          aria-label="파일 직접 변환"
          className="w-[34px] h-[34px] rounded-full bg-[#1d1d1f] hover:bg-[#2a2a2c] text-[#cccccc] hover:text-white flex items-center justify-center transition-transform duration-150 active:scale-95 cursor-pointer border border-[#3a3a3c]"
        >
          <FileUp className="w-4 h-4 text-[#2997ff]" />
        </button>

        <button
          type="button"
          onClick={onScanNow}
          title="수신 폴더 전체 점검"
          aria-label="수신 폴더 전체 점검"
          className="w-[34px] h-[34px] rounded-full bg-[#1d1d1f] hover:bg-[#2a2a2c] text-[#cccccc] hover:text-white flex items-center justify-center transition-transform duration-150 active:scale-95 cursor-pointer border border-[#3a3a3c]"
        >
          <FolderSearch className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleWatcher}
          title={isWatching ? '실시간 감시 작동 중 (클릭 시 일시정지)' : '실시간 감시 시작'}
          aria-label={isWatching ? '실시간 감시 일시정지' : '실시간 감시 시작'}
          className={`relative w-[34px] h-[34px] rounded-full flex items-center justify-center transition-transform duration-150 active:scale-95 cursor-pointer ${
            isWatching
              ? 'bg-[#272729] text-[#2997ff] border border-[#2997ff]/50'
              : 'bg-[#0066cc] text-white'
          }`}
        >
          {isWatching ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2997ff] border-2 border-[#000000] animate-pulse" />
            </>
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>
    </header>
  );
};
