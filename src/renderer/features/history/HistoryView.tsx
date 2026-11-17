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
      limit: 200,
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
      onStatusMessage(`CSV 내보내기 완료 (${res.data.count}건): ${res.data.filePath}`);
    } else if (res.error) {
      onStatusMessage(res.error);
    }
  };

  const handleClear = async () => {
    const res = await window.atojApi.clearHistory();
    if (res.success && res.data) {
      onStatusMessage(`변환 이력 ${res.data.deleted}건을 정리했습니다.`);
      void fetchHistory();
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-6 space-y-6">
      <UtilityCard
        title="SQLite 단속 변환 이력 조회"
        subtitle={`검색 조건에 일치하는 이력 총 ${total.toLocaleString()}건 (WAL 모드 로컬 DB)`}
        rightAction={
          <div className="flex items-center gap-2">
            <PillButton variant="pearl-capsule" size="sm" onClick={() => void fetchHistory()}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로고침</span>
            </PillButton>
            <PillButton variant="secondary-pill" size="sm" onClick={() => void handleExportCsv()}>
              <Download className="w-3.5 h-3.5" />
              <span>CSV 내보내기</span>
            </PillButton>
            <PillButton variant="dark-utility" size="sm" onClick={() => void handleClear()}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>이력 비우기</span>
            </PillButton>
          </div>
        }
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <SearchInput
            wrapperClassName="w-full md:w-[360px]"
            placeholder="차량번호, 장비코드(F9999), 파일명 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <OptionChip selected={enfCode === 'ALL'} onClick={() => setEnfCode('ALL')}>
              전체 위반
            </OptionChip>
            <OptionChip selected={enfCode === '1'} onClick={() => setEnfCode('1')}>
              속도위반 (0x01)
            </OptionChip>
            <OptionChip selected={enfCode === '3'} onClick={() => setEnfCode('3')}>
              신호위반 (0x03)
            </OptionChip>
            <span className="mx-1 text-[#e0e0e0]">|</span>
            <OptionChip selected={status === 'ALL'} onClick={() => setStatus('ALL')}>
              모든 상태
            </OptionChip>
            <OptionChip selected={status === 'SUCCESS'} onClick={() => setStatus('SUCCESS')}>
              변환성공
            </OptionChip>
            <OptionChip selected={status === 'FAILED'} onClick={() => setStatus('FAILED')}>
              실패
            </OptionChip>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a]">
                <th className="py-2.5 px-3 font-semibold">번호</th>
                <th className="py-2.5 px-3 font-semibold">상태</th>
                <th className="py-2.5 px-3 font-semibold">위반구분</th>
                <th className="py-2.5 px-3 font-semibold">장비코드</th>
                <th className="py-2.5 px-3 font-semibold">차량번호</th>
                <th className="py-2.5 px-3 font-semibold">차로 / 속도</th>
                <th className="py-2.5 px-3 font-semibold">영상수</th>
                <th className="py-2.5 px-3 font-semibold">위반시각</th>
                <th className="py-2.5 px-3 font-semibold">자규격 파일명(.DAT)</th>
                <th className="py-2.5 px-3 font-semibold text-right">동작</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#7a7a7a]">
                    조회된 변환 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-3 text-[#7a7a7a] font-mono">#{r.id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          r.status === 'SUCCESS'
                            ? 'bg-[#f5f5f7] text-[#0066cc]'
                            : 'bg-[#f5f5f7] text-[#333333]'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold">
                      {r.enfCode === '1' ? '속도위반' : r.enfCode === '3' ? '신호위반' : '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{r.deviceCode}</td>
                    <td className="py-2.5 px-3 font-semibold">{r.carNum}</td>
                    <td className="py-2.5 px-3">
                      {r.lane > 0 ? `${r.lane}차로 / ${r.enfSpeed}km/h` : '-'}
                    </td>
                    <td className="py-2.5 px-3">{r.imageCount}장</td>
                    <td className="py-2.5 px-3 font-mono text-[#7a7a7a]">{r.violationTime}</td>
                    <td className="py-2.5 px-3 font-mono text-[12px] max-w-[260px] truncate">
                      {r.targetFileName || r.errorMessage || r.sourceFileName}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {r.targetPath && (
                        <button
                          type="button"
                          onClick={() => onInspectFile(r.targetPath!)}
                          className="inline-flex items-center gap-1 text-[12px] text-[#0066cc] font-semibold cursor-pointer transition-transform duration-150 active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>검증</span>
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
