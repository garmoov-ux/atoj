import React, { useState, useEffect } from 'react';
import { FolderPlus, Save, Trash2 } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import { OptionChip } from '../../components/ui/OptionChip';
import type { AtojAppConfig, InvalidFilePolicy } from '@shared/types/domain';

interface SettingsViewProps {
  config: AtojAppConfig | null;
  onSaveConfig: (nextConfig: AtojAppConfig) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onSaveConfig,
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
      <div className="col-span-6 min-h-0">
        <UtilityCard
          title="아규격 수신 폴더 목록"
          rightAction={
            <PillButton variant="secondary-pill" size="sm" onClick={() => void handleAddSourceFolder()}>
              <FolderPlus className="w-3.5 h-3.5" />
              <span>폴더 찾아보기</span>
            </PillButton>
          }
          className="h-full"
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
      </div>

      <div className="col-span-6 min-h-0">
        <UtilityCard
          title="저장 경로 및 감시 동작 설정"
          rightAction={
            <PillButton variant="primary" size="sm" onClick={() => void onSaveConfig(draft)}>
              <Save className="w-3.5 h-3.5" />
              <span>설정 저장</span>
            </PillButton>
          }
          className="h-full"
          bodyClassName="justify-between"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                자규격 변환 파일 저장 폴더
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft.paths.targetDir}
                  onChange={(e) =>
                    setDraft({ ...draft, paths: { ...draft.paths, targetDir: e.target.value } })
                  }
                  className="flex-1 h-[34px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px]"
                />
                <PillButton variant="pearl-capsule" size="sm" onClick={() => void handlePickTargetDir()}>
                  변경
                </PillButton>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-1.5 whitespace-nowrap">
                로그 기록 저장 폴더
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft.paths.logDir}
                  onChange={(e) =>
                    setDraft({ ...draft, paths: { ...draft.paths, logDir: e.target.value } })
                  }
                  className="flex-1 h-[34px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px]"
                />
                <PillButton variant="pearl-capsule" size="sm" onClick={() => void handlePickLogDir()}>
                  변경
                </PillButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
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
                  className="w-full h-[34px] px-3.5 rounded-[10px] bg-[#f5f5f7] border border-[#e0e0e0] text-[13px]"
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

            <div className="pt-2 border-t border-[#e0e0e0]">
              <label className="block text-[12px] font-semibold text-[#7a7a7a] mb-2 whitespace-nowrap">
                비규격 파일 처리 방식
              </label>
              <div className="flex items-center gap-2">
                <OptionChip
                  selected={draft.watcher.invalidFilePolicy === 'ignore'}
                  onClick={() => setPolicy('ignore')}
                >
                  원본 보존 (권장)
                </OptionChip>
                <OptionChip
                  selected={draft.watcher.invalidFilePolicy === 'quarantine'}
                  onClick={() => setPolicy('quarantine')}
                >
                  격리 폴더로 이동
                </OptionChip>
                <OptionChip
                  selected={draft.watcher.invalidFilePolicy === 'delete'}
                  onClick={() => setPolicy('delete')}
                >
                  즉시 삭제
                </OptionChip>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#e0e0e0] text-[12px] text-[#7a7a7a] flex items-center justify-between">
            <span>설정 저장 시 실시간 감시에 즉시 반영됩니다.</span>
          </div>
        </UtilityCard>
      </div>
    </div>
  );
};
