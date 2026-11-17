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
import { PillButton } from '../ui/PillButton';

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
    <header className="h-[52px] bg-[#000000] text-white px-5 flex items-center justify-between gap-4 shrink-0 select-none border-b border-[#272729]">
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

      <div className="flex items-center gap-2 shrink-0">
        <PillButton variant="dark-utility" size="sm" onClick={onManualConvert}>
          <FileUp className="w-3.5 h-3.5 text-[#2997ff]" />
          <span>파일 직접 변환</span>
        </PillButton>

        <PillButton variant="dark-utility" size="sm" onClick={onScanNow}>
          <FolderSearch className="w-3.5 h-3.5 text-[#cccccc]" />
          <span>폴더 전체 점검</span>
        </PillButton>

        <button
          type="button"
          onClick={onToggleWatcher}
          className={`h-[32px] px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-transform duration-150 active:scale-95 cursor-pointer ${
            isWatching
              ? 'bg-[#272729] text-[#2997ff] border border-[#3a3a3c]'
              : 'bg-[#0066cc] text-white'
          }`}
        >
          {isWatching ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#2997ff] animate-pulse" />
              <span>감시 작동 중</span>
              <Pause className="w-3 h-3 ml-0.5 text-[#cccccc]" />
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              <span>감시 시작</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
