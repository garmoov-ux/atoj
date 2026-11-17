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
    if (res.success && res.data) {
      if (!draft.path.source.includes(res.data)) {
        setDraft({
          ...draft,
          path: { ...draft.path, source: [...draft.path.source, res.data] },
        });
      }
    }
  };

  const handleAddSourceManual = () => {
    const trimmed = newSourceInput.trim().replace(/\\/g, '/');
    if (trimmed && !draft.path.source.includes(trimmed)) {
      setDraft({
        ...draft,
        path: { ...draft.path, source: [...draft.path.source, trimmed] },
      });
      setNewSourceInput('');
    }
  };

  const handleRemoveSource = (target: string) => {
    setDraft({
      ...draft,
      path: {
        ...draft.path,
        source: draft.path.source.filter((s) => s !== target),
      },
    });
  };

  const handlePickTargetDir = async () => {
    const res = await window.atojApi.selectDirectory();
    if (res.success && res.data) {
      setDraft({ ...draft, path: { ...draft.path, target: res.data } });
    }
  };

  const handlePickLogDir = async () => {
    const res = await window.atojApi.selectDirectory();
    if (res.success && res.data) {
      setDraft({ ...draft, path: { ...draft.path, log: res.data } });
    }
  };

  const setPolicy = (policy: InvalidFilePolicy) => {
    setDraft({ ...draft, invalidFilePolicy: policy });
  };

  return (
    <div className="max-w-[1060px] mx-auto px-6 py-6 space-y-6">
      <UtilityCard
        title="아규격(경찰-6310-98-0001-아) 수신 감시 폴더 목록"
        subtitle="운영 서버에서 아규격 파일이 떨어지는 폴더들을 등록합니다. 하위 폴더까지 재귀 감시합니다."
        rightAction={
          <PillButton variant="secondary-pill" size="sm" onClick={() => void handleAddSourceFolder()}>
            <FolderPlus className="w-3.5 h-3.5" />
            <span>폴더 찾아보기 추가</span>
          </PillButton>
        }
      >
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newSourceInput}
            onChange={(e) => setNewSourceInput(e.target.value)}
            placeholder="직접 경로 입력 (예: D:/MuinServer/2_Metafile/Speed)"
            className="flex-1 h-[40px] px-4 rounded-full bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] font-mono focus:outline-2 focus:outline-[#0071e3]"
          />
          <PillButton variant="pearl-capsule" size="sm" onClick={handleAddSourceManual}>
            경로 추가
          </PillButton>
        </div>

        <div className="space-y-2">
          {draft.path.source.map((src) => (
            <div
              key={src}
              className="flex items-center justify-between px-4 py-2.5 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0]"
            >
              <span className="font-mono text-[14px] text-[#1d1d1f]">{src}</span>
              <button
                type="button"
                onClick={() => handleRemoveSource(src)}
                className="text-[#7a7a7a] hover:text-[#1d1d1f] p-1 cursor-pointer"
                title="제거"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </UtilityCard>

      <UtilityCard
        title="자규격(.DAT) 저장 폴더 및 감시 동작 설정"
        subtitle="기존 config.json 포맷과 100% 호환되며 저장 즉시 실시간 감시기에 반영됩니다."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[13px] font-semibold text-[#1d1d1f] mb-1.5">
              자규격(.DAT) 출력 폴더 (path.target)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.path.target}
                onChange={(e) =>
                  setDraft({ ...draft, path: { ...draft.path, target: e.target.value } })
                }
                className="flex-1 h-[40px] px-4 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] font-mono"
              />
              <PillButton variant="pearl-capsule" size="sm" onClick={() => void handlePickTargetDir()}>
                변경
              </PillButton>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1d1d1f] mb-1.5">
              로그 저장 폴더 (path.log)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft.path.log}
                onChange={(e) =>
                  setDraft({ ...draft, path: { ...draft.path, log: e.target.value } })
                }
                className="flex-1 h-[40px] px-4 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px] font-mono"
              />
              <PillButton variant="pearl-capsule" size="sm" onClick={() => void handlePickLogDir()}>
                변경
              </PillButton>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1d1d1f] mb-1.5">
              파일 쓰기 안정화 대기 시간 (path.sleep, 초)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={draft.path.sleep}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  path: { ...draft.path, sleep: Math.max(1, Number(e.target.value) || 1) },
                })
              }
              className="w-full h-[40px] px-4 rounded-[11px] bg-[#f5f5f7] border border-[#e0e0e0] text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#1d1d1f] mb-1.5">
              시작 시 폴더 내 미처리 파일 자동 스캔
            </label>
            <div className="flex items-center gap-2 pt-1">
              <OptionChip
                selected={draft.scanExistingOnStart}
                onClick={() => setDraft({ ...draft, scanExistingOnStart: true })}
              >
                자동 스캔 활성화 (권장)
              </OptionChip>
              <OptionChip
                selected={!draft.scanExistingOnStart}
                onClick={() => setDraft({ ...draft, scanExistingOnStart: false })}
              >
                신규 생성분만 처리
              </OptionChip>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#e0e0e0]">
          <label className="block text-[13px] font-semibold text-[#1d1d1f] mb-2">
            비규격 파일 유입 시 처리 정책 (기존 무조건 삭제 문제 개선)
          </label>
          <div className="flex flex-wrap gap-2.5">
            <OptionChip
              selected={draft.invalidFilePolicy === 'ignore'}
              onClick={() => setPolicy('ignore')}
            >
              원본 보존 및 무시 (안전 기본값)
            </OptionChip>
            <OptionChip
              selected={draft.invalidFilePolicy === 'quarantine'}
              onClick={() => setPolicy('quarantine')}
            >
              격리 폴더(./quarantine)로 이동
            </OptionChip>
            <OptionChip
              selected={draft.invalidFilePolicy === 'delete'}
              onClick={() => setPolicy('delete')}
            >
              즉시 삭제 (기존 AtoJ.exe 방식)
            </OptionChip>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#e0e0e0] flex justify-end">
          <PillButton variant="primary" onClick={() => void onSaveConfig(draft)}>
            <Save className="w-4 h-4" />
            <span>설정 저장 및 즉시 적용</span>
          </PillButton>
        </div>
      </UtilityCard>
    </div>
  );
};
