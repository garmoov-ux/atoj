import React from 'react';
import {
  Activity,
  BarChart3,
  Database,
  Eye,
  FileUp,
  FolderSearch,
  Info,
  Pause,
  Play,
  ScrollText,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'viewer'
  | 'history'
  | 'stats'
  | 'logs'
  | 'settings';

interface GlobalNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isAboutOpen: boolean;
  onOpenAbout: () => void;
  isWatching: boolean;
  onToggleWatcher: () => void;
  onScanNow: () => void;
  onManualConvert: () => void;
}

const TABS: { id: NavTab; label: string; title: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: '현황',
    title: '실시간 감시 및 변환 현황',
    icon: <Activity className="w-[17px] h-[17px]" />,
  },
  {
    id: 'viewer',
    label: '뷰어',
    title: '단속 영상 및 속성:값 상세 뷰어',
    icon: <Eye className="w-[17px] h-[17px]" />,
  },
  {
    id: 'history',
    label: '이력',
    title: '전체 변환 이력 조회 및 CSV 내보내기',
    icon: <Database className="w-[17px] h-[17px]" />,
  },
  {
    id: 'stats',
    label: '통계',
    title: '월별 단속 통계 차트 및 발주처 제출용 PDF 보고서 출력',
    icon: <BarChart3 className="w-[17px] h-[17px]" />,
  },
  {
    id: 'logs',
    label: '로그',
    title: '실시간 운용 로그 조회 및 검색',
    icon: <ScrollText className="w-[17px] h-[17px]" />,
  },
  {
    id: 'settings',
    label: '설정',
    title: '감시 폴더 및 보관 기간 설정',
    icon: <Settings className="w-[17px] h-[17px]" />,
  },
];

export const GlobalNav: React.FC<GlobalNavProps> = ({
  activeTab,
  onSelectTab,
  isAboutOpen,
  onOpenAbout,
  isWatching,
  onToggleWatcher,
  onScanNow,
  onManualConvert,
}) => {
  return (
    <aside className="w-[66px] h-full bg-[#0f172a] text-slate-300 border-r border-[#1e293b] flex flex-col items-center justify-between py-2.5 shrink-0 select-none">
      <div className="flex flex-col items-center gap-2 w-full">
        <button
          type="button"
          onClick={onOpenAbout}
          title="AtoJ 프로그램 정보 보기"
          className="relative w-[46px] h-[34px] rounded-[8px] bg-[#1e293b] hover:bg-[#334155] border border-[#334155] flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <span className="text-[12.5px] font-extrabold tracking-tight text-white leading-none">
            A<span className="text-[#38bdf8]">to</span>J
          </span>
          <span
            className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0f172a] ${
              isWatching ? 'bg-[#10b981] animate-pulse' : 'bg-[#f59e0b]'
            }`}
          />
        </button>

        <div className="w-8 h-[1px] bg-[#1e293b]" />

        <nav className="flex flex-col items-center gap-1 w-full px-1.5">
          {TABS.map((t) => {
            const active = activeTab === t.id && !isAboutOpen;
            return (
              <button
                key={t.id}
                type="button"
                title={t.title}
                onClick={() => onSelectTab(t.id)}
                className={`w-full py-1.5 rounded-[7px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-[#2563eb] text-white font-semibold'
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-100 font-normal'
                }`}
              >
                {t.icon}
                <span className="text-[10.5px] leading-none">{t.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            title="프로그램 정보 · 버전 기록 · 유지보수 도구 (모달)"
            onClick={onOpenAbout}
            className={`w-full py-1.5 rounded-[7px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer ${
              isAboutOpen
                ? 'bg-[#2563eb] text-white font-semibold'
                : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-100 font-normal'
            }`}
          >
            <Info className="w-[17px] h-[17px]" />
            <span className="text-[10.5px] leading-none">정보</span>
          </button>
        </nav>
      </div>

      <div className="flex flex-col items-center gap-1 w-full px-1.5">
        <div className="w-8 h-[1px] bg-[#1e293b] mb-0.5" />

        <button
          type="button"
          onClick={onToggleWatcher}
          title={isWatching ? '실시간 감시 작동 중 (클릭 시 일시정지)' : '실시간 감시 시작'}
          className={`w-full py-1.5 rounded-[7px] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer border ${
            isWatching
              ? 'bg-[#064e3b]/60 text-[#34d399] border-[#059669]/60 hover:bg-[#064e3b]'
              : 'bg-[#1e293b] text-[#fbbf24] border-[#475569] hover:bg-[#334155]'
          }`}
        >
          {isWatching ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          <span className="text-[10px] font-medium leading-none">
            {isWatching ? '감시중' : '정지됨'}
          </span>
        </button>

        <button
          type="button"
          onClick={onScanNow}
          title="수신 폴더 즉시 점검(스캔)"
          className="w-full py-1.5 rounded-[7px] bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#334155] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <FolderSearch className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="text-[10px] leading-none">폴더점검</span>
        </button>

        <button
          type="button"
          onClick={onManualConvert}
          title="단일 아규격 파일 직접 선택 변환"
          className="w-full py-1.5 rounded-[7px] bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#334155] flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer"
        >
          <FileUp className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="text-[10px] leading-none">수동변환</span>
        </button>
      </div>
    </aside>
  );
};
