import React, { useState, useEffect } from 'react';
import { FolderPlus, RotateCcw, Save, Sparkles, Trash2 } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import type { AtojAppConfig, InvalidFilePolicy } from '@shared/types/domain';

interface SettingsViewProps {
  config: AtojAppConfig | null;
  onSaveConfig: (nextConfig: AtojAppConfig) => Promise<void>;
  onRunCleanupNow: () => Promise<void>;
}

interface SegmentOption<T> {
  label: string;
  value: T;
}

function SegmentedControl<T extends string | number | boolean>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="inline-flex items-center p-1 rounded-[10px] bg-[#e8e8ed] gap-0.5 shrink-0">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`h-[30px] px-3 rounded-[8px] text-[13px] whitespace-nowrap transition-all duration-150 active:scale-95 cursor-pointer select-none ${
              active
                ? 'bg-[#0066cc] text-white font-semibold'
                : 'text-[#333333] hover:text-[#1d1d1f] font-normal'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const SLEEP_OPTIONS: SegmentOption<number>[] = [
  { label: '1초', value: 1 },
  { label: '2초', value: 2 },
  { label: '3초', value: 3 },
  { label: '5초', value: 5 },
  { label: '10초', value: 10 },
];

const BOOL_SCAN_OPTIONS: SegmentOption<boolean>[] = [
  { label: '사용함', value: true },
  { label: '사용 안 함', value: false },
];

const POLICY_OPTIONS: SegmentOption<InvalidFilePolicy>[] = [
  { label: '원본 보존', value: 'ignore' },
  { label: '격리 이동', value: 'quarantine' },
  { label: '즉시 삭제', value: 'delete' },
];

const CLOSE_OPTIONS: SegmentOption<boolean>[] = [
  { label: '트레이로 숨김', value: true },
  { label: '완전 종료', value: false },
];

const LOG_RETENTION_OPTIONS: SegmentOption<number>[] = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '영구', value: 0 },
];

const DB_RETENTION_OPTIONS: SegmentOption<number>[] = [
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '180일', value: 180 },
  { label: '365일', value: 365 },
  { label: '영구', value: 0 },
];

const RESULT_RETENTION_OPTIONS: SegmentOption<number>[] = [
  { label: '영구', value: 0 },
  { label: '7일', value: 7 },
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
];

const QUARANTINE_RETENTION_OPTIONS: SegmentOption<number>[] = [
  { label: '7일', value: 7 },
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
  { label: '영구', value: 0 },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
  onRunCleanupNow,
}) => {
  const [draft, setDraft] = useState<AtojAppConfig | null>(config);
  const [newSourceInput, setNewSourceInput] = useState('');

  useEffect(() => {
    setDraft(config);
  }, [config]);

  if (!draft) {
    return <div className="p-8 text-center text-[#7a7a7a]">설정을 불러오는 중입니다...</div>;
  }

  const handleAddSourceFolder = async () => {
    const res = await window.atojApi.selectDirectory();
    if (res.success && res.data && !draft.paths.sources.includes(res.data)) {
      setDraft({
        ...draft,
        paths: { ...draft.paths, sources: [...draft.paths.sources, res.data] },
      });
    }
  };

  const handleAddSourceManual = () => {
    const trimmed = newSourceInput.trim().replace(/\\/g, '/');
    if (trimmed && !draft.paths.sources.includes(trimmed)) {
      setDraft({
        ...draft,
        paths: { ...draft.paths, sources: [...draft.paths.sources, trimmed] },
      });
      setNewSourceInput('');
    }
  };

  const handleRemoveSource = (target: string) => {
    setDraft({
      ...draft,
      paths: {
        ...draft.paths,
        sources: draft.paths.sources.filter((s) => s !== target),
      },
    });
  };

  const handlePickTargetDir = async () => {
    const res = await window.atojApi.selectDirectory();
    if (res.success && res.data) {
      setDraft({ ...draft, paths: { ...draft.paths, targetDir: res.data } });
    }
  };

  const handlePickLogDir = async () => {
    const res = await window.atojApi.selectDirectory();
    if (res.success && res.data) {
      setDraft({ ...draft, paths: { ...draft.paths, logDir: res.data } });
    }
  };

  return (
    <div className="h-full p-5 max-w-[1440px] w-full mx-auto min-h-0 flex flex-col gap-4">
      {/* 상단 환경설정 공통 액션 바 (우측 상단에 전체 환경설정 저장 버튼 배치) */}
      <div className="bg-[#ffffff] border border-[#e0e0e0] rounded-[16px] px-5 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f] whitespace-nowrap">
            전체 환경 설정 관리
          </h2>
          <span className="text-[13px] text-[#7a7a7a] truncate">
            수신 폴더, 상대경로(./result, ./log), 감시 동작 및 자동 정리 기준을 설정합니다.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PillButton variant="pearl-capsule" size="sm" onClick={() => void onRunCleanupNow()}>
            <Sparkles className="w-4 h-4 text-[#0066cc]" />
            <span>오래된 파일 지금 정리</span>
          </PillButton>
          <PillButton variant="primary" size="md" onClick={() => void onSaveConfig(draft)}>
            <Save className="w-4 h-4" />
            <span>설정 저장</span>
          </PillButton>
        </div>
      </div>

      {/* 본문 2단 그리드 */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
        {/* 좌측: 수신 폴더 및 저장 경로 */}
        <div className="col-span-6 min-h-0 flex flex-col gap-4">
          <UtilityCard
            title="아규격 수신 감시 폴더"
            badge={
              <span className="text-[13px] text-[#7a7a7a] font-normal">
                {draft.paths.sources.length}개 등록
              </span>
            }
            rightAction={
              <PillButton
                variant="secondary-pill"
                size="sm"
                onClick={() => void handleAddSourceFolder()}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>폴더 찾아보기</span>
              </PillButton>
            }
            className="flex-1 min-h-0"
          >
            <div className="flex gap-2 mb-3 shrink-0">
              <input
                type="text"
                value={newSourceInput}
                onChange={(e) => setNewSourceInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSourceManual()}
                placeholder="폴더 경로 직접 입력 (예: C:/save_std2 또는 ./incoming)"
                className="flex-1 h-[36px] px-3.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
              />
              <PillButton variant="pearl-capsule" size="sm" onClick={handleAddSourceManual}>
                추가
              </PillButton>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {draft.paths.sources.map((src) => (
                <div
                  key={src}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-[12px] bg-[#f5f5f7] border border-[#e0e0e0]"
                >
                  <span className="text-[14px] text-[#1d1d1f] truncate">{src}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSource(src)}
                    className="text-[#7a7a7a] hover:text-[#1d1d1f] p-1 cursor-pointer shrink-0"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </UtilityCard>

          <UtilityCard title="출력 및 로그 저장 경로 (상대경로 지원)" className="shrink-0">
            <div className="rounded-[14px] bg-[#f5f5f7] border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
              <div className="flex items-center justify-between gap-2.5 px-4 py-3">
                <span className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap w-[130px] shrink-0">
                  자규격 저장 폴더
                </span>
                <input
                  type="text"
                  value={draft.paths.targetDir}
                  onChange={(e) =>
                    setDraft({ ...draft, paths: { ...draft.paths, targetDir: e.target.value } })
                  }
                  placeholder="./result"
                  className="flex-1 min-w-0 h-[32px] px-3 rounded-[8px] bg-[#ffffff] border border-[#e0e0e0] text-[13px]"
                />
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() =>
                    setDraft({ ...draft, paths: { ...draft.paths, targetDir: './result' } })
                  }
                  title="실행 파일 기준 ./result 상대경로로 초기화"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>./result</span>
                </PillButton>
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() => void handlePickTargetDir()}
                >
                  변경
                </PillButton>
              </div>

              <div className="flex items-center justify-between gap-2.5 px-4 py-3">
                <span className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap w-[130px] shrink-0">
                  로그 기록 폴더
                </span>
                <input
                  type="text"
                  value={draft.paths.logDir}
                  onChange={(e) =>
                    setDraft({ ...draft, paths: { ...draft.paths, logDir: e.target.value } })
                  }
                  placeholder="./log"
                  className="flex-1 min-w-0 h-[32px] px-3 rounded-[8px] bg-[#ffffff] border border-[#e0e0e0] text-[13px]"
                />
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() =>
                    setDraft({ ...draft, paths: { ...draft.paths, logDir: './log' } })
                  }
                  title="실행 파일 기준 ./log 상대경로로 초기화"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>./log</span>
                </PillButton>
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() => void handlePickLogDir()}
                >
                  변경
                </PillButton>
              </div>
            </div>
            <div className="text-[12px] text-[#7a7a7a] px-1 pt-2">
              프로그램 폴더 내부 경로는 <strong>./result</strong>, <strong>./log</strong> 상대경로로 자동 인식되어 폴더 이동 시에도 그대로 동작합니다.
            </div>
          </UtilityCard>
        </div>

        {/* 우측: 감시·시스템 동작 카드 + 자동 보관(삭제) 카드 */}
        <div className="col-span-6 min-h-0 flex flex-col gap-4">
          <UtilityCard title="감시 및 시스템 동작" className="shrink-0">
            <div className="rounded-[14px] bg-[#f5f5f7] border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <div className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                    파일 쓰기 완료 대기 시간
                  </div>
                  <div className="text-[12px] text-[#7a7a7a] whitespace-nowrap">
                    수신 파일이 완전히 기록될 때까지 대기
                  </div>
                </div>
                <SegmentedControl
                  options={SLEEP_OPTIONS}
                  value={draft.watcher.writeStabilitySec}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      watcher: { ...draft.watcher, writeStabilitySec: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <div className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                    시작 시 미처리 파일 자동 점검
                  </div>
                  <div className="text-[12px] text-[#7a7a7a] whitespace-nowrap">
                    프로그램 실행 시 폴더 내 잔여 파일 변환
                  </div>
                </div>
                <SegmentedControl
                  options={BOOL_SCAN_OPTIONS}
                  value={draft.watcher.scanExistingOnStart}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      watcher: { ...draft.watcher, scanExistingOnStart: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <div className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                    비규격 파일 처리 방식
                  </div>
                  <div className="text-[12px] text-[#7a7a7a] whitespace-nowrap">
                    아규격 형식이 아닌 파일 유입 시 동작
                  </div>
                </div>
                <SegmentedControl
                  options={POLICY_OPTIONS}
                  value={draft.watcher.invalidFilePolicy}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      watcher: { ...draft.watcher, invalidFilePolicy: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div>
                  <div className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                    창 닫기 버튼 클릭 시 동작
                  </div>
                  <div className="text-[12px] text-[#7a7a7a] whitespace-nowrap">
                    트레이 아이콘 우클릭으로 완전 종료 가능
                  </div>
                </div>
                <SegmentedControl
                  options={CLOSE_OPTIONS}
                  value={draft.system.minimizeToTrayOnClose}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      system: { ...draft.system, minimizeToTrayOnClose: val },
                    })
                  }
                />
              </div>
            </div>
          </UtilityCard>

          <UtilityCard
            title="보관 기간 및 자동 삭제"
            className="flex-1 min-h-0"
            bodyClassName="justify-between"
          >
            <div className="rounded-[14px] bg-[#f5f5f7] border border-[#e0e0e0] divide-y divide-[#e0e0e0]">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  로그 파일 보관 기간
                </span>
                <SegmentedControl
                  options={LOG_RETENTION_OPTIONS}
                  value={draft.retention.logDays}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      retention: { ...draft.retention, logDays: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  단속 변환 이력 보관 기간
                </span>
                <SegmentedControl
                  options={DB_RETENTION_OPTIONS}
                  value={draft.retention.dbHistoryDays}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      retention: { ...draft.retention, dbHistoryDays: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  결과 폴더 미수거 파일 보관
                </span>
                <SegmentedControl
                  options={RESULT_RETENTION_OPTIONS}
                  value={draft.retention.resultDays}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      retention: { ...draft.retention, resultDays: val },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[14px] font-semibold text-[#1d1d1f] whitespace-nowrap">
                  격리 폴더 파일 보관 기간
                </span>
                <SegmentedControl
                  options={QUARANTINE_RETENTION_OPTIONS}
                  value={draft.retention.quarantineDays}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      retention: { ...draft.retention, quarantineDays: val },
                    })
                  }
                />
              </div>
            </div>

            <div className="text-[13px] text-[#7a7a7a] flex items-center justify-between px-1 pt-2">
              <span>보관 기간이 지난 파일과 이력은 매시간 자동으로 정리됩니다.</span>
              <span className="font-semibold text-[#333333]">우측 상단 [설정 저장] 클릭 시 전체 반영</span>
            </div>
          </UtilityCard>
        </div>
      </div>
    </div>
  );
};
