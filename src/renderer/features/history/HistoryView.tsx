import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import type { ConversionRecord, HistoryQueryFilter } from '@shared/types/domain';

interface HistoryViewProps {
  onInspectFile: (filePath: string) => void;
  onStatusMessage: (msg: string) => void;
}

type SortKey =
  | 'id'
  | 'status'
  | 'enfCode'
  | 'deviceCode'
  | 'carNum'
  | 'enfSpeed'
  | 'imageCount'
  | 'violationTime'
  | 'targetFileName';

export const HistoryView: React.FC<HistoryViewProps> = ({
  onInspectFile,
  onStatusMessage,
}) => {
  const [items, setItems] = useState<ConversionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [enfCode, setEnfCode] = useState<'ALL' | '1' | '3'>('ALL');
  const [status, setStatus] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'SKIPPED'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'id' || sortKey === 'enfSpeed' || sortKey === 'imageCount') {
        cmp = a[sortKey] - b[sortKey];
      } else {
        const valA = String(a[sortKey] ?? '');
        const valB = String(b[sortKey] ?? '');
        cmp = valA.localeCompare(valB, 'ko');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3.5 h-3.5 text-[#b0b0b5]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0066cc]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0066cc]" />
    );
  };

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
          <span className="text-[13px] text-[#7a7a7a] font-normal whitespace-nowrap">
            총 {total.toLocaleString()}건 (컬럼 헤더 클릭 시 오름·내림차순 정렬)
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
            wrapperClassName="w-[320px] shrink-0"
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

        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead className="sticky top-0 bg-[#f5f5f7] z-10 border-b border-[#e0e0e0] text-[#333333] text-[13px]">
              <tr>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('id')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>순번</span>
                    {renderSortIcon('id')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>위반구분</span>
                    {renderSortIcon('enfCode')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>장비번호</span>
                    {renderSortIcon('deviceCode')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('carNum')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>차량번호</span>
                    {renderSortIcon('carNum')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfSpeed')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>차로 · 속도</span>
                    {renderSortIcon('enfSpeed')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('imageCount')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>영상수</span>
                    {renderSortIcon('imageCount')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('violationTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>위반일시</span>
                    {renderSortIcon('violationTime')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('targetFileName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>변환 파일명</span>
                    {renderSortIcon('targetFileName')}
                  </button>
                </th>
                <th className="py-2.5 px-3.5 font-semibold whitespace-nowrap text-right">영상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] bg-[#ffffff]">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[#7a7a7a]">
                    조회된 변환 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                sortedItems.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f5f5f7]/60">
                    <td className="py-2 px-3.5 text-[#7a7a7a] whitespace-nowrap">{r.id}번</td>
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                          r.status === 'SUCCESS'
                            ? 'bg-[#0066cc]/10 text-[#0066cc]'
                            : 'bg-[#f5f5f7] text-[#7a7a7a]'
                        }`}
                      >
                        {r.status === 'SUCCESS' ? '완료' : r.status === 'FAILED' ? '실패' : '제외'}
                      </span>
                    </td>
                    <td className="py-2 px-3.5 font-semibold whitespace-nowrap">
                      {r.enfCode === '1' ? '속도위반' : r.enfCode === '3' ? '신호위반' : '-'}
                    </td>
                    <td className="py-2 px-3.5 whitespace-nowrap">{r.deviceCode}</td>
                    <td className="py-2 px-3.5 font-semibold whitespace-nowrap">{r.carNum}</td>
                    <td className="py-2 px-3.5 whitespace-nowrap">
                      {r.lane > 0 ? `${r.lane}차로 · ${r.enfSpeed}킬로` : '-'}
                    </td>
                    <td className="py-2 px-3.5 whitespace-nowrap">{r.imageCount}장</td>
                    <td className="py-2 px-3.5 text-[13px] text-[#7a7a7a] whitespace-nowrap">
                      {r.violationTime}
                    </td>
                    <td
                      className="py-2 px-3.5 text-[13px] max-w-[260px] truncate"
                      title={r.targetFileName || r.errorMessage || r.sourceFileName}
                    >
                      {r.targetFileName || r.errorMessage || r.sourceFileName}
                    </td>
                    <td className="py-2 px-3.5 text-right whitespace-nowrap">
                      {r.targetPath && (
                        <button
                          type="button"
                          onClick={() => onInspectFile(r.targetPath!)}
                          className="inline-flex items-center gap-1 text-[13px] text-[#0066cc] font-semibold cursor-pointer transition-transform duration-150 active:scale-95"
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
