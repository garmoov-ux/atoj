import React, { useEffect, useState, useCallback } from 'react';
import { FolderOpen, FolderSearch, History, Info, Sparkles, Wrench } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import type { StorageFolderItem } from '@shared/types/domain';

interface ProgramInfoViewProps {
  onScanNow: () => void;
  onRunCleanupNow: () => void;
  onStatusMessage: (msg: string) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const RELEASE_HISTORY = [
  {
    version: 'v2.1.0',
    date: '2026-11-17',
    badge: '현재 버전',
    items: [
      '좌측 아이콘 사이드바 및 컴팩트 창(1040×680) UI/UX 개편',
      '외부 시스템 반출 후에도 영상·속성 열람을 보장하는 내부 스냅샷(./data/snapshots) 보존',
      '단속 뷰어 [ < / > ] 연속 탐색, 폴더 일괄 변환 및 속성 : 값 상세 명세표 적용',
      '탭형 인터랙티브 통계 차트(마우스 호버 상세 수치) 및 A4 PDF 보고서 출력 기능 추가',
      '실시간 운용 로그 조회 메뉴 및 유지보수 폴더 바로 열기 기능 추가',
    ],
  },
  {
    version: 'v2.0.0',
    date: '2026-11-17',
    badge: '메이저 업그레이드',
    items: [
      'Electron + SQLite(WAL) 기반 실시간 다중 폴더 감시 및 자동 변환 데스크톱 앱 구축',
      '상대경로(./result, ./log) 포터블 지원 및 보관 기간 경과 데이터 자동 정리 엔진 적용',
    ],
  },
  {
    version: 'v1.0.0',
    date: '기존 운영 버전',
    badge: 'Legacy',
    items: ['Python(muin.py) 기반 아규격 → 자규격(.DAT) 단일 변환 스크립트'],
  },
];

export const ProgramInfoView: React.FC<ProgramInfoViewProps> = ({
  onScanNow,
  onRunCleanupNow,
  onStatusMessage,
}) => {
  const [folders, setFolders] = useState<StorageFolderItem[]>([]);

  const fetchStorageInfo = useCallback(async () => {
    if (typeof window.atojApi.getStorageInfo !== 'function') return;
    const res = await window.atojApi.getStorageInfo();
    if (res.success && res.data) {
      setFolders(res.data);
    }
  }, []);

  useEffect(() => {
    void fetchStorageInfo();
  }, [fetchStorageInfo]);

  const handleOpenFolder = async (targetPath: string, label: string) => {
    if (typeof window.atojApi.openFolderPath !== 'function') return;
    const res = await window.atojApi.openFolderPath(targetPath);
    if (res.success && res.data) {
      onStatusMessage(`${label} 경로를 탐색기로 열었습니다.`);
    }
  };

  return (
    <div className="h-full p-3.5 w-full min-h-0 grid grid-cols-12 gap-3">
      {/* 좌측: 프로그램 기본 명세 (속성 : 값) + 버전별 업데이트 기록 */}
      <div className="col-span-6 min-h-0 flex flex-col gap-3">
        <UtilityCard
          title="프로그램 기본 정보"
          badge={<Info className="w-3.5 h-3.5 text-[#2563eb]" />}
          className="shrink-0"
        >
          <div className="border border-[#cbd5e1] rounded-[8px] overflow-hidden bg-[#ffffff] divide-y divide-[#e2e8f0] text-[13px]">
            <div className="grid grid-cols-12 items-center px-3.5 py-2">
              <span className="col-span-4 text-[#64748b] font-medium">프로그램명</span>
              <span className="col-span-1 text-center text-[#94a3b8]">:</span>
              <span className="col-span-7 text-right font-extrabold text-[#0f172a] text-[14px]">
                AtoJ
              </span>
            </div>
            <div className="grid grid-cols-12 items-center px-3.5 py-2">
              <span className="col-span-4 text-[#64748b] font-medium">시스템 구분</span>
              <span className="col-span-1 text-center text-[#94a3b8]">:</span>
              <span className="col-span-7 text-right font-semibold text-[#0f172a]">
                무인교통단속장비 규격 변환기
              </span>
            </div>
            <div className="grid grid-cols-12 items-center px-3.5 py-2">
              <span className="col-span-4 text-[#64748b] font-medium">버전</span>
              <span className="col-span-1 text-center text-[#94a3b8]">:</span>
              <span className="col-span-7 text-right font-bold text-[#2563eb]">
                v2.1.0 (2026.11.17)
              </span>
            </div>
            <div className="grid grid-cols-12 items-center px-3.5 py-2">
              <span className="col-span-4 text-[#64748b] font-medium">적용 규격</span>
              <span className="col-span-1 text-center text-[#94a3b8]">:</span>
              <span className="col-span-7 text-right font-semibold text-[#0f172a]">
                경찰-6310-98-0001 (아규격 → 자규격 .DAT)
              </span>
            </div>

            <div className="bg-[#f1f5f9] px-3.5 py-1 text-[11px] font-bold text-[#475569]">
              개발 및 기술지원
            </div>

            <div className="grid grid-cols-12 items-center px-3.5 py-2">
              <span className="col-span-4 text-[#64748b] font-medium">회사</span>
              <span className="col-span-1 text-center text-[#94a3b8]">:</span>
              <span className="col-span-7 text-right font-bold text-[#0f172a]">
                ㈜ 이노네트웍스
              </span>
            </div>
            <div className="grid grid-cols-12 items-center px-3.5 py-2">
              <span className="col-span-4 text-[#64748b] font-medium">제작자</span>
              <span className="col-span-1 text-center text-[#94a3b8]">:</span>
              <span className="col-span-7 text-right font-semibold text-[#0f172a]">강홍선</span>
            </div>
            <div className="grid grid-cols-12 items-center px-3.5 py-2">
              <span className="col-span-4 text-[#64748b] font-medium">이메일</span>
              <span className="col-span-1 text-center text-[#94a3b8]">:</span>
              <span className="col-span-7 text-right font-mono font-semibold text-[#2563eb]">
                s_gain@naver.com
              </span>
            </div>
          </div>
        </UtilityCard>

        <UtilityCard
          title="버전별 업데이트 기록"
          badge={<History className="w-3.5 h-3.5 text-[#2563eb]" />}
          className="flex-1 min-h-0"
          bodyClassName="overflow-y-auto space-y-2 pr-1"
        >
          {RELEASE_HISTORY.map((rel) => (
            <div
              key={rel.version}
              className="rounded-[8px] border border-[#cbd5e1] bg-[#f8fafc] p-3 shrink-0"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-bold text-[#0f172a]">{rel.version}</span>
                  <span className="px-2 py-0.5 rounded-[5px] bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] text-[10.5px] font-semibold">
                    {rel.badge}
                  </span>
                </div>
                <span className="text-[11.5px] text-[#64748b]">{rel.date}</span>
              </div>
              <ul className="space-y-1 text-[12px] text-[#334155] list-disc list-inside">
                {rel.items.map((item, i) => (
                  <li key={i} className="leading-snug">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </UtilityCard>
      </div>

      {/* 우측: 현장 유지보수 편의 기능 (폴더 현황 및 원클릭 탐색기 열기) */}
      <div className="col-span-6 min-h-0 flex flex-col">
        <UtilityCard
          title="현장 유지보수 편의 도구 (경로 및 저장소 관리)"
          badge={<Wrench className="w-3.5 h-3.5 text-[#2563eb]" />}
          className="flex-1 min-h-0"
          bodyClassName="justify-between gap-3"
        >
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {folders.map((f) => (
              <div
                key={f.key}
                className="rounded-[8px] border border-[#cbd5e1] bg-[#f8fafc] p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#0f172a]">{f.label}</span>
                    <span className="px-2 py-0.5 rounded-[5px] bg-[#ffffff] border border-[#cbd5e1] text-[11px] font-semibold text-[#334155]">
                      파일 {f.fileCount.toLocaleString()}개 · {formatBytes(f.totalBytes)}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[#64748b] mt-0.5">{f.description}</div>
                  <div
                    className="text-[11.5px] font-mono text-[#334155] mt-1 truncate"
                    title={f.resolvedPath}
                  >
                    {f.resolvedPath}
                  </div>
                </div>

                <PillButton
                  variant="secondary-pill"
                  size="sm"
                  onClick={() => void handleOpenFolder(f.relativePath, f.label)}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>폴더 열기</span>
                </PillButton>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between gap-2 shrink-0">
            <span className="text-[12px] text-[#64748b]">
              빠른 유지보수 점검 실행
            </span>
            <div className="flex items-center gap-2">
              <PillButton variant="pearl-capsule" size="sm" onClick={onScanNow}>
                <FolderSearch className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>수신 폴더 즉시 점검</span>
              </PillButton>
              <PillButton variant="dark-utility" size="sm" onClick={onRunCleanupNow}>
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>경과 파일 즉시 정리</span>
              </PillButton>
            </div>
          </div>
        </UtilityCard>
      </div>
    </div>
  );
};
