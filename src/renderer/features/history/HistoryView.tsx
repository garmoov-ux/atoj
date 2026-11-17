import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { PillButton } from '../../components/ui/PillButton';
import { OptionChip } from '../../components/ui/OptionChip';
import { SearchInput } from '../../components/ui/SearchInput';
import type { ConversionRecord, HistoryQueryFilter } from '@shared/types/domain';

interface HistoryViewProps {
  onInspectRecord: (record: ConversionRecord) => void;
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
  onInspectRecord,
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
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#2563eb]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2563eb]" />
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
    <div className="h-full p-3.5 w-full min-h-0 flex flex-col gap-3">
      {/* 방법 A: 상단 독립 검색·필터·액션 바 */}
      <section className="bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] px-4 py-2.5 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[15px] font-bold text-[#0f172a] whitespace-nowrap">
              단속 변환 이력 조회
            </h2>
            <span className="text-[12px] text-[#64748b] whitespace-nowrap">
              총 <strong className="text-[#0f172a] font-semibold">{total.toLocaleString()}</strong>건 · 행 클릭 시 스냅샷 영상 및 속성:값 열람
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
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
        </div>

        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-[#e2e8f0]">
          <SearchInput
            wrapperClassName="w-[270px] shrink-0"
            placeholder="차량번호 · 장비번호 · 파일명 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex items-center gap-1 overflow-x-auto">
            <OptionChip selected={enfCode === 'ALL'} onClick={() => setEnfCode('ALL')}>
              전체 위반
            </OptionChip>
            <OptionChip selected={enfCode === '1'} onClick={() => setEnfCode('1')}>
              속도위반
            </OptionChip>
            <OptionChip selected={enfCode === '3'} onClick={() => setEnfCode('3')}>
              신호위반
            </OptionChip>
            <span className="mx-1 text-[#cbd5e1]">|</span>
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
      </section>

      {/* 방법 A: 하단 단일 테두리 테이블 시트 (이중 테두리 없음) */}
      <section className="flex-1 min-h-0 bg-[#ffffff] border border-[#cbd5e1] rounded-[10px] overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-[#f1f5f9] z-10 border-b border-[#cbd5e1] text-[#334155] text-[12px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('id')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>순번</span>
                    {renderSortIcon('id')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>위반구분</span>
                    {renderSortIcon('enfCode')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>장비번호</span>
                    {renderSortIcon('deviceCode')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('carNum')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>차량번호</span>
                    {renderSortIcon('carNum')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfSpeed')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>차로 · 속도</span>
                    {renderSortIcon('enfSpeed')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('imageCount')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>영상수</span>
                    {renderSortIcon('imageCount')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('violationTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>위반일시</span>
                    {renderSortIcon('violationTime')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('targetFileName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>변환 파일명</span>
                    {renderSortIcon('targetFileName')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">조회</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-[#ffffff]">
              {sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-[#64748b]">
                    조회된 변환 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                sortedItems.map((r) => {
                  const canInspect = r.status === 'SUCCESS' || Boolean(r.targetPath);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => canInspect && onInspectRecord(r)}
                      className={
                        canInspect
                          ? 'hover:bg-[#eff6ff]/70 cursor-pointer transition-colors'
                          : 'hover:bg-[#f8fafc]'
                      }
                    >
                      <td className="py-2 px-3 text-[#64748b] whitespace-nowrap">#{r.id}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-[5px] text-[11px] font-semibold ${
                            r.status === 'SUCCESS'
                              ? 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]'
                              : r.status === 'FAILED'
                                ? 'bg-[#ffe4e6] text-[#be123c] border border-[#fecdd3]'
                                : 'bg-[#f1f5f9] text-[#64748b]'
                          }`}
                        >
                          {r.status === 'SUCCESS' ? '완료' : r.status === 'FAILED' ? '실패' : '제외'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-semibold whitespace-nowrap">
                        <span
                          className={
                            r.enfCode === '3'
                              ? 'text-[#e11d48]'
                              : r.enfCode === '1'
                                ? 'text-[#d97706]'
                                : 'text-[#64748b]'
                          }
                        >
                          {r.enfCode === '1' ? '속도위반' : r.enfCode === '3' ? '신호위반' : '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">{r.deviceCode}</td>
                      <td className="py-2 px-3 font-bold whitespace-nowrap text-[#0f172a]">
                        {r.carNum}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {r.lane > 0 ? `${r.lane}차로 · ${r.enfSpeed}km/h` : '-'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">{r.imageCount}장</td>
                      <td className="py-2 px-3 text-[12px] text-[#64748b] whitespace-nowrap">
                        {r.violationTime}
                      </td>
                      <td
                        className="py-2 px-3 text-[12px] max-w-[210px] truncate"
                        title={r.targetFileName || r.errorMessage || r.sourceFileName}
                      >
                        {r.targetFileName || r.errorMessage || r.sourceFileName}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        {canInspect && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectRecord(r);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#eff6ff] hover:bg-[#dbeafe] text-[11.5px] text-[#1d4ed8] font-semibold cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>상세</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
