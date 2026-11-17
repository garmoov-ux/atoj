import React, { useEffect, useState, useCallback } from 'react';
import { Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import type { ConversionRecord, HistoryQueryFilter } from '@shared/types/domain';

interface HistoryViewProps {
  onInspectFile: (filePath: string) => void;
  onStatusMessage: (msg: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onInspectFile,
  onStatusMessage,
}) => {
  const [items, setItems] = useState<ConversionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [enfCode, setEnfCode] = useState<'ALL' | '1' | '3'>('ALL');
  const [status, setStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'SKIPPED'>('ALL');

  const fetchHistory = useCallback(async () => {
    const filter: HistoryQueryFilter = {
      search,
      enfCode,
      status,
      limit: 300,
      offset: 0,
    };
    const res = await window.atojApi.queryHistory(filter);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    }
  }, [search, enfCode, status]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const handleExportCsv = async () => {
    const res = await window.atojApi.exportHistoryCsv({ search, enfCode, status });
    if (res.success && res.data) {
      onStatusMessage(`파일 저장 완료 (${res.data.count}건)`);
    } else if (res.error) {
      onStatusMessage(res.error);
    }
  };

  const handleClear = async () => {
    const res = await window.atojApi.clearHistory();
    if (res.success && res.data) {
      onStatusMessage(`이력 ${res.data.deleted}건 삭제 완료`);
      void fetchHistory();
    }
  };

  return (
    <div className="h-full p-5 max-w-[1440px] w-full mx-auto min-h-0 flex flex-col">
      <UtilityCard
        title="단속 변환 이력"
        badge={
          <span className="text-[12px] text-[#7a7a7a] font-normal whitespace-nowrap">
            총 {total.toLocaleString()}건
          </span>
        }
        rightAction={
          <>
            <PillButton variant="pearl-capsule" size="sm" onClick={() => void fetchHistory()}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </PillButton>
            <PillButton variant="secondary-pill" size="sm" onClick={() => void handleExportCsv()}>
              <Download className="w-3.5 h-3.5" />
              <span>목록 파일 저장</span>
            </PillButton>
            <PillButton variant="dark-utility" size="sm" onClick={() => void handleClear()}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>이력 비우기</span>
            </PillButton>
          </>
        }
        className="h-full"
      >
        <div className="flex items-center justify-between gap-3 mb-3.5 shrink-0">
          <SearchInput
            wrapperClassName="w-[300px] shrink-0"
            placeholder="차량번호 · 장비번호 · 파일명 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <OptionChip selected={enfCode === 'ALL'} onClick={() => setEnfCode('ALL')}>
              전체 위반
            </OptionChip>
            <OptionChip selected={enfCode === '1'} onClick={() => setEnfCode('1')}>
              속도위반
            </OptionChip>
            <OptionChip selected={enfCode === '3'} onClick={() => setEnfCode('3')}>
              신호위반
            </OptionChip>
            <span className="mx-1 text-[#e0e0e0]">|</span>
            <OptionChip selected={status === 'ALL'} onClick={() => setStatus('ALL')}>
              전체 상태
            </OptionChip>
            <OptionChip selected={status === 'SUCCESS'} onClick={() => setStatus('SUCCESS')}>
              변환 완료
            </OptionChip>
            <OptionChip selected={status === 'FAILED'} onClick={() => setStatus('FAILED')}>
              변환 실패
            </OptionChip>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto border-t border-[#e0e0e0]">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="sticky top-0 bg-[#ffffff] z-10 border-b border-[#e0e0e0] text-[#7a7a7a]">
              <tr>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">순번</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">상태</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">위반구분</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">장비번호</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">차량번호</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">차로 · 속도</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">영상수</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">위반일시</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">변환 파일명</th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">영상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[#7a7a7a]">
                    조회된 변환 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f5f5f7]/60">
                    <td className="py-2 px-3 text-[#7a7a7a] whitespace-nowrap">{r.id}번</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === 'SUCCESS'
                            ? 'bg-[#f5f5f7] text-[#0066cc]'
                            : 'bg-[#f5f5f7] text-[#7a7a7a]'
                        }`}
                      >
                        {r.status === 'SUCCESS' ? '완료' : r.status === 'FAILED' ? '실패' : '제외'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-semibold whitespace-nowrap">
                      {r.enfCode === '1' ? '속도위반' : r.enfCode === '3' ? '신호위반' : '-'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{r.deviceCode}</td>
                    <td className="py-2 px-3 font-semibold whitespace-nowrap">{r.carNum}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {r.lane > 0 ? `${r.lane}차로 · ${r.enfSpeed}킬로` : '-'}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">{r.imageCount}장</td>
                    <td className="py-2 px-3 text-[12px] text-[#7a7a7a] whitespace-nowrap">
                      {r.violationTime}
                    </td>
                    <td
                      className="py-2 px-3 text-[12px] max-w-[260px] truncate"
                      title={r.targetFileName || r.errorMessage || r.sourceFileName}
                    >
                      {r.targetFileName || r.errorMessage || r.sourceFileName}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {r.targetPath && (
                        <button
                          type="button"
                          onClick={() => onInspectFile(r.targetPath!)}
                          className="inline-flex items-center gap-1 text-[12px] text-[#0066cc] font-semibold cursor-pointer transition-transform duration-150 active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>보기</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </UtilityCard>
    </div>
  );
};
