import React from 'react';
import { Activity, Database, Eye, Settings, ShieldCheck } from 'lucide-react';

export type NavTab = 'dashboard' | 'history' | 'viewer' | 'settings';

interface GlobalNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isWatching: boolean;
}

const TABS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '실시간 관제 대시보드', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'history', label: 'SQLite 변환 이력', icon: <Database className="w-3.5 h-3.5" /> },
  { id: 'viewer', label: '단속파일(.DAT) 정밀 뷰어', icon: <Eye className="w-3.5 h-3.5" /> },
  { id: 'settings', label: '감시 경로 및 정책 설정', icon: <Settings className="w-3.5 h-3.5" /> },
];

export const GlobalNav: React.FC<GlobalNavProps> = ({
  activeTab,
  onSelectTab,
  isWatching,
}) => {
  return (
    <nav className="h-[44px] bg-[#000000] text-white px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 font-semibold text-[13px] tracking-[-0.01em]">
          <ShieldCheck className="w-4 h-4 text-[#2997ff]" />
          <span>AtoJ Engine</span>
          <span className="text-[11px] font-normal text-[#cccccc] ml-1">
            경찰-6310-98-0001 (아 → 자)
          </span>
        </div>

        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTab(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] tracking-[-0.12px] inline-flex items-center gap-1.5 transition-transform duration-150 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-[#272729] text-white font-semibold'
                    : 'text-[#cccccc] font-normal'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[12px]">
        <span
          className={`w-2 h-2 rounded-full ${
            isWatching ? 'bg-[#2997ff]' : 'bg-[#7a7a7a]'
          }`}
        />
        <span className="text-[#cccccc]">
          {isWatching ? 'Watchdog 실시간 감시 가동 중' : '감시 일시 중지됨'}
        </span>
      </div>
    </nav>
  );
};
