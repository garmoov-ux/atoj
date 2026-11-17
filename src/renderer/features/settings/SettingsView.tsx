import React, { useState, useEffect } from 'react';
import { FolderPlus, Save, Sparkles, Trash2 } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import { OptionChip } from '../../components/ui/OptionChip';
import type { AtojAppConfig, InvalidFilePolicy } from '@shared/types/domain';

interface SettingsViewProps {
  config: AtojAppConfig | null;
  onSaveConfig: (nextConfig: AtojAppConfig) => Promise<void>;
  onRunCleanupNow: () => Promise<void>;
}

const LOG_RETENTION_OPTIONS = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '영구 보관', value: 0 },
];

const DB_RETENTION_OPTIONS = [
  { label: '30일', value: 30 },
  { label: '90일', value: 90 },
  { label: '180일', value: 180 },
  { label: '365일', value: 365 },
  { label: '영구 보관', value: 0 },
];

const RESULT_RETENTION_OPTIONS = [
  { label: '영구 보관', value: 0 },
  { label: '7일', value: 7 },
  { label: '14일', value: 14 },
  { label: '30일', value: 30 },
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

  const setPolicy = (policy: InvalidFilePolicy) => {
    setDraft({
      ...draft,
      watcher: { ...draft.watcher, invalidFilePolicy: policy },
    });
  };

  return (
    <div className="h-full p-5 max-w-[1440px] w-full mx-auto min-h-0 grid grid-cols-12 gap-4">
      {/* 좌측: 수신 폴더 및 출력 경로 설정 */}
      <div className="col-span-6 min-h-0 flex flex-col gap-4">
        <UtilityCard
          title="아규격 수신 폴더 목록"
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
              placeholder="폴더 경로 직접 입력"
              className="flex-1 h-[34px] px-3.5 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-[13px] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3]"
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
                <span className="text-[13px] text-[#1d1d1f] truncate">{src}</span>
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

        <UtilityCard title="저장 폴더 경로" className="shrink-0">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1 whitespace-nowrap">
                자규격 변환 파일 저장 폴더
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={draft.paths.targetDir}
                  onChange={(e) =>
                    setDraft({ ...draft, paths: { ...draft.paths, targetDir: e.target.value } })
                  }
                  className="flex-1 min-w-0 h-[32px] px-3 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[12px]"
                />
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() => void handlePickTargetDir()}
                >
                  변경
                </PillButton>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1 whitespace-nowrap">
                로그 기록 저장 폴더
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={draft.paths.logDir}
                  onChange={(e) =>
                    setDraft({ ...draft, paths: { ...draft.paths, logDir: e.target.value } })
                  }
                  className="flex-1 min-w-0 h-[32px] px-3 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[12px]"
                />
                <PillButton
                  variant="pearl-capsule"
                  size="sm"
                  onClick={() => void handlePickLogDir()}
                >
                  변경
                </PillButton>
              </div>
            </div>
          </div>
        </UtilityCard>
      </div>

      {/* 우측: 감시 동작, 자동 보관 기간(자동 삭제) 및 트레이 상주 설정 */}
      <div className="col-span-6 min-h-0">
        <UtilityCard
          title="감시 동작 및 자동 보관(삭제) 설정"
          rightAction={
            <>
              <PillButton variant="pearl-capsule" size="sm" onClick={() => void onRunCleanupNow()}>
                <Sparkles className="w-3.5 h-3.5 text-[#0066cc]" />
                <span>지금 정리</span>
              </PillButton>
              <PillButton variant="primary" size="sm" onClick={() => void onSaveConfig(draft)}>
                <Save className="w-3.5 h-3.5" />
                <span>설정 저장</span>
              </PillButton>
            </>
          }
          className="h-full"
          bodyClassName="justify-between"
        >
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* 1. 감시 대기시간 및 시작 점검 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                  파일 쓰기 완료 대기 시간 (초)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={draft.watcher.writeStabilitySec}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      watcher: {
                        ...draft.watcher,
                        writeStabilitySec: Math.max(1, Number(e.target.value) || 1),
                      },
                    })
                  }
                  className="w-full h-[32px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                  시작 시 미처리 파일 자동 점검
                </label>
                <div className="flex items-center gap-1.5">
                  <OptionChip
                    selected={draft.watcher.scanExistingOnStart}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        watcher: { ...draft.watcher, scanExistingOnStart: true },
                      })
                    }
                  >
                    사용함
                  </OptionChip>
                  <OptionChip
                    selected={!draft.watcher.scanExistingOnStart}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        watcher: { ...draft.watcher, scanExistingOnStart: false },
                      })
                    }
                  >
                    사용 안 함
                  </OptionChip>
                </div>
              </div>
            </div>

            {/* 2. 비규격 파일 처리 및 창 닫기 트레이 상주 */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#e0e0e0]">
              <div>
                <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                  비규격 파일 처리 방식
                </label>
                <div className="flex items-center gap-1.5">
                  <OptionChip
                    selected={draft.watcher.invalidFilePolicy === 'ignore'}
                    onClick={() => setPolicy('ignore')}
                  >
                    보존
                  </OptionChip>
                  <OptionChip
                    selected={draft.watcher.invalidFilePolicy === 'quarantine'}
                    onClick={() => setPolicy('quarantine')}
                  >
                    격리 이동
                  </OptionChip>
                  <OptionChip
                    selected={draft.watcher.invalidFilePolicy === 'delete'}
                    onClick={() => setPolicy('delete')}
                  >
                    즉시 삭제
                  </OptionChip>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                  창 닫기 버튼 클릭 시 동작
                </label>
                <div className="flex items-center gap-1.5">
                  <OptionChip
                    selected={draft.system.minimizeToTrayOnClose}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        system: { ...draft.system, minimizeToTrayOnClose: true },
                      })
                    }
                  >
                    트레이로 숨김
                  </OptionChip>
                  <OptionChip
                    selected={!draft.system.minimizeToTrayOnClose}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        system: { ...draft.system, minimizeToTrayOnClose: false },
                      })
                    }
                  >
                    프로그램 종료
                  </OptionChip>
                </div>
              </div>
            </div>

            {/* 3. 보관 기간 및 자동 삭제 설정 */}
            <div className="pt-3 border-t border-[#e0e0e0] space-y-3">
              <div>
                <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                  로그 파일 자동 삭제 보관 기간
                </label>
                <div className="flex items-center gap-1.5">
                  {LOG_RETENTION_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      selected={draft.retention.logDays === opt.value}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          retention: { ...draft.retention, logDays: opt.value },
                        })
                      }
                    >
                      {opt.label}
                    </OptionChip>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                  단속 변환 이력 자동 삭제 보관 기간
                </label>
                <div className="flex items-center gap-1.5">
                  {DB_RETENTION_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      selected={draft.retention.dbHistoryDays === opt.value}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          retention: { ...draft.retention, dbHistoryDays: opt.value },
                        })
                      }
                    >
                      {opt.label}
                    </OptionChip>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                  변환 결과 폴더 미수거 파일 보관 기간 (격리 폴더는 {draft.retention.quarantineDays}일 보관)
                </label>
                <div className="flex items-center gap-1.5">
                  {RESULT_RETENTION_OPTIONS.map((opt) => (
                    <OptionChip
                      key={opt.value}
                      selected={draft.retention.resultDays === opt.value}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          retention: { ...draft.retention, resultDays: opt.value },
                        })
                      }
                    >
                      {opt.label}
                    </OptionChip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e0e0e0] text-[12px] text-[#7a7a7a] flex items-center justify-between shrink-0">
            <span>작업표시줄 트레이 아이콘 우클릭 시 [프로그램 완전 종료]를 실행할 수 있습니다.</span>
          </div>
        </UtilityCard>
      </div>
    </div>
  );
};
