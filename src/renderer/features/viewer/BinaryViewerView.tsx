import React, { useState, useEffect } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileSearch,
  FileUp,
  Film,
  FolderUp,
} from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import { SpecKeyValuePanel } from './SpecKeyValuePanel';
import type { DatInspectionResult } from '@shared/types/domain';

interface BinaryViewerViewProps {
  inspected: DatInspectionResult | null;
  onSelectRecordById: (recordId: number) => void;
  onSelectFileToInspect: () => void;
  onManualConvert: () => void;
  onManualConvertFolder: () => void;
}

export const BinaryViewerView: React.FC<BinaryViewerViewProps> = ({
  inspected,
  onSelectRecordById,
  onSelectFileToInspect,
  onManualConvert,
  onManualConvertFolder,
}) => {
  const [selectedFrameIdx, setSelectedFrameIdx] = useState<number | null>(null);

  useEffect(() => {
    setSelectedFrameIdx(null);
  }, [inspected?.filePath, inspected?.recordId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!inspected) return;
      if (e.key === 'ArrowLeft' && inspected.prevRecordId) {
        onSelectRecordById(inspected.prevRecordId);
      } else if (e.key === 'ArrowRight' && inspected.nextRecordId) {
        onSelectRecordById(inspected.nextRecordId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspected, onSelectRecordById]);

  if (!inspected) {
    return (
      <div className="h-full flex flex-col p-3.5 w-full min-h-0">
        <UtilityCard className="flex-1 items-center justify-center text-center">
          <div className="max-w-[440px] mx-auto flex flex-col items-center gap-3.5 py-8">
            <div className="w-12 h-12 rounded-[10px] bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb]">
              <FileSearch className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#0f172a]">
                단속 데이터 및 영상 뷰어
              </h2>
              <p className="text-[13px] text-[#64748b] mt-1">
                외부 단속 파일을 열거나, 단일 파일 및 폴더를 선택하여 자규격(.DAT)으로 일괄 변환하고 이전/다음 단속 영상과 속성:값을 조회합니다.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <PillButton variant="primary" onClick={onSelectFileToInspect}>
                <FileSearch className="w-4 h-4" />
                <span>파일 열기</span>
              </PillButton>
              <PillButton variant="secondary-pill" onClick={onManualConvert}>
                <FileUp className="w-4 h-4" />
                <span>단일 변환</span>
              </PillButton>
              <PillButton variant="dark-utility" onClick={onManualConvertFolder}>
                <FolderUp className="w-4 h-4" />
                <span>폴더 변환</span>
              </PillButton>
            </div>
          </div>
        </UtilityCard>
      </div>
    );
  }

  const activeMainImage =
    selectedFrameIdx !== null && inspected.trackingImagesBase64[selectedFrameIdx]
      ? inspected.trackingImagesBase64[selectedFrameIdx]
      : inspected.carImageBase64;

  const isExportedSnapshot = inspected.fileStatus === 'EXPORTED_SNAPSHOT';

  return (
    <div className="h-full flex flex-col gap-3 p-3.5 w-full min-h-0">
      <div className="flex items-center justify-between gap-2 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-3.5 py-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="inline-flex items-center bg-[#f8fafc] border border-[#cbd5e1] rounded-[8px] p-0.5 shrink-0">
            <button
              type="button"
              disabled={!inspected.prevRecordId}
              onClick={() => inspected.prevRecordId && onSelectRecordById(inspected.prevRecordId)}
              title="이전 순번 단속 데이터 (← 방향키)"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a] disabled:opacity-35 disabled:pointer-events-none transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 h-7 flex items-center justify-center gap-1 text-[12.5px] whitespace-nowrap border-x border-[#e2e8f0] bg-[#ffffff] min-w-[78px]">
              <span className="font-extrabold text-[#2563eb]">
                {inspected.currentPosition ?? 1}
              </span>
              <span className="text-[#94a3b8] font-medium">/</span>
              <span className="font-semibold text-[#334155]">
                {inspected.totalSuccessCount ?? 1}건
              </span>
            </div>

            <button
              type="button"
              disabled={!inspected.nextRecordId}
              onClick={() => inspected.nextRecordId && onSelectRecordById(inspected.nextRecordId)}
              title="다음 순번 단속 데이터 (→ 방향키)"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#334155] hover:bg-[#e2e8f0] hover:text-[#0f172a] disabled:opacity-35 disabled:pointer-events-none transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span
            className={`px-2 py-0.5 rounded-[5px] text-[11.5px] font-semibold shrink-0 ${
              isExportedSnapshot
                ? 'bg-[#eff6ff] text-[#1d4ed8] border border-[#93c5fd]'
                : 'bg-[#ecfdf5] text-[#047857] border border-[#6ee7b7]'
            }`}
          >
            {isExportedSnapshot ? '외부반출 · 스냅샷 열람' : '결과파일 보관중'}
          </span>

          <div className="min-w-0">
            <div className="text-[13px] font-bold text-[#0f172a] truncate" title={inspected.fileName}>
              {inspected.fileName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <PillButton variant="pearl-capsule" size="sm" onClick={onSelectFileToInspect}>
            <FileSearch className="w-3.5 h-3.5" />
            <span>파일 열기</span>
          </PillButton>
          <PillButton variant="secondary-pill" size="sm" onClick={onManualConvert}>
            <FileUp className="w-3.5 h-3.5" />
            <span>단일 변환</span>
          </PillButton>
          <PillButton variant="dark-utility" size="sm" onClick={onManualConvertFolder}>
            <FolderUp className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>폴더 변환</span>
          </PillButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        <div className="col-span-7 min-h-0 flex flex-col gap-3">
          <UtilityCard
            dark
            title={
              selectedFrameIdx === null
                ? '차량 전체 단속 영상'
                : `연속 트래킹 프레임 #${selectedFrameIdx + 1}`
            }
            badge={
              <span className="text-[12px] text-[#38bdf8] font-medium">
                {inspected.violationLabel} · {inspected.violationSpeed} km/h
              </span>
            }
            rightAction={
              selectedFrameIdx !== null && (
                <PillButton variant="pearl-capsule" size="sm" onClick={() => setSelectedFrameIdx(null)}>
                  <Camera className="w-3.5 h-3.5" />
                  <span>차량 전체 영상</span>
                </PillButton>
              )
            }
            className="flex-1 min-h-0"
            bodyClassName="gap-2.5"
          >
            <div className="flex-1 min-h-0 bg-[#090d16] rounded-[8px] border border-[#1e293b] flex items-center justify-center p-2 overflow-hidden">
              {activeMainImage ? (
                <img
                  src={activeMainImage}
                  alt="단속 차량 영상"
                  className="max-h-full max-w-full object-contain rounded-[6px] apple-product-shadow"
                />
              ) : (
                <span className="text-[12.5px] text-slate-400">저장된 차량 영상이 없습니다.</span>
              )}
            </div>

            {inspected.trackingImagesBase64.length > 0 && (
              <div className="shrink-0">
                <div className="flex items-center gap-1.5 text-[11.5px] text-slate-300 mb-1.5">
                  <Film className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>신호위반 연속 트래킹 프레임 ({inspected.trackingImagesBase64.length}장)</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {inspected.trackingImagesBase64.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedFrameIdx(idx)}
                      className={`relative shrink-0 w-20 h-13 rounded-[6px] overflow-hidden border transition-all duration-150 active:scale-95 cursor-pointer ${
                        selectedFrameIdx === idx
                          ? 'border-[#38bdf8] ring-2 ring-[#38bdf8]'
                          : 'border-[#334155]'
                      }`}
                    >
                      <img src={src} alt={`트래킹 ${idx + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[10px] text-white">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </UtilityCard>

          <UtilityCard
            title="번호판 인식 영상 및 차량번호"
            badge={<CreditCard className="w-3.5 h-3.5 text-[#2563eb]" />}
            className="shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-44 h-16 bg-[#090d16] rounded-[7px] border border-[#cbd5e1] flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                {inspected.plateImageBase64 ? (
                  <img
                    src={inspected.plateImageBase64}
                    alt="번호판 영상"
                    className="max-h-full max-w-full object-contain rounded-[4px]"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400">번호판 이미지 없음</span>
                )}
              </div>
              <div className="flex-1 min-w-0 bg-[#f8fafc] border border-[#cbd5e1] rounded-[7px] px-3 py-2 flex items-center justify-between">
                <span className="text-[12px] text-[#64748b] font-medium">인식 차량번호</span>
                <span className="text-[18px] font-bold tracking-tight text-[#0f172a]">
                  {inspected.carNum}
                </span>
              </div>
            </div>
          </UtilityCard>
        </div>

        <div className="col-span-5 min-h-0 flex flex-col">
          <SpecKeyValuePanel inspected={inspected} />
        </div>
      </div>
    </div>
  );
};
