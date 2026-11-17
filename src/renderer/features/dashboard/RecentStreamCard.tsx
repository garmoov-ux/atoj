import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import type { ConversionRecord } from '@shared/types/domain';

interface RecentStreamCardProps {
  records: ConversionRecord[];
  onInspectRecord: (record: ConversionRecord) => void;
  onGoHistory: () => void;
}

type SortKey =
  | 'id'
  | 'status'
  | 'enfCode'
  | 'deviceCode'
  | 'carNum'
  | 'enfSpeed'
  | 'violationTime'
  | 'targetFileName';

export const RecentStreamCard: React.FC<RecentStreamCardProps> = ({
  records,
  onInspectRecord,
  onGoHistory,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedRecords = useMemo(() => {
    const list = [...records];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'id' || sortKey === 'enfSpeed') {
        cmp = a[sortKey] - b[sortKey];
      } else {
        const valA = String(a[sortKey] ?? '');
        const valB = String(b[sortKey] ?? '');
        cmp = valA.localeCompare(valB, 'ko');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [records, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#2563eb]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2563eb]" />
    );
  };

  return (
    <UtilityCard
      title="실시간 변환 스트림"
      badge={
        <span className="text-[12px] text-[#64748b] font-normal whitespace-nowrap">
          최근 {records.length}건 · 행 클릭 시 상세 영상 및 속성:값 열람
        </span>
      }
      rightAction={
        <PillButton variant="pearl-capsule" size="sm" onClick={onGoHistory}>
          전체 이력
        </PillButton>
      }
      className="h-full"
    >
      {records.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[13px] text-[#64748b] border-t border-[#e2e8f0] -mx-3.5 -mb-3.5">
          대기 중 — 수신 폴더에 아규격 파일이 유입되면 즉시 자규격(.DAT)으로 변환됩니다.
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto border-t border-[#cbd5e1] -mx-3.5 -mb-3.5 rounded-b-[10px]">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-[#f1f5f9] z-10 border-b border-[#cbd5e1] text-[#334155] text-[12px]">
              <tr>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>위반구분</span>
                    {renderSortIcon('enfCode')}
                  </button>
                </th>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>장비</span>
                    {renderSortIcon('deviceCode')}
                  </button>
                </th>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('carNum')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>차량번호</span>
                    {renderSortIcon('carNum')}
                  </button>
                </th>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfSpeed')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>차로·속도</span>
                    {renderSortIcon('enfSpeed')}
                  </button>
                </th>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('violationTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>위반일시</span>
                    {renderSortIcon('violationTime')}
                  </button>
                </th>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('targetFileName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#2563eb]"
                  >
                    <span>변환 파일명</span>
                    {renderSortIcon('targetFileName')}
                  </button>
                </th>
                <th className="py-2 px-2.5 font-semibold whitespace-nowrap text-right">조회</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-[#ffffff]">
              {sortedRecords.map((r) => {
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
                    <td className="py-1.5 px-2.5 whitespace-nowrap">
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
                    <td className="py-1.5 px-2.5 font-semibold whitespace-nowrap">
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
                    <td className="py-1.5 px-2.5 whitespace-nowrap text-[#334155]">
                      {r.deviceCode}
                    </td>
                    <td className="py-1.5 px-2.5 font-bold whitespace-nowrap text-[#0f172a]">
                      {r.carNum}
                    </td>
                    <td className="py-1.5 px-2.5 whitespace-nowrap text-[#334155]">
                      {r.lane > 0 ? `${r.lane}차로 · ${r.enfSpeed}km/h` : '-'}
                    </td>
                    <td className="py-1.5 px-2.5 text-[#64748b] text-[12px] whitespace-nowrap">
                      {r.violationTime}
                    </td>
                    <td
                      className="py-1.5 px-2.5 text-[12px] text-[#334155] max-w-[160px] truncate"
                      title={r.targetFileName || r.errorMessage || r.sourceFileName}
                    >
                      {r.targetFileName || r.errorMessage || r.sourceFileName}
                    </td>
                    <td className="py-1.5 px-2.5 text-right whitespace-nowrap">
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
              })}
            </tbody>
          </table>
        </div>
      )}
    </UtilityCard>
  );
};
