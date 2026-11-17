import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import type { ConversionRecord } from '@shared/types/domain';

interface RecentStreamCardProps {
  records: ConversionRecord[];
  onInspectFile: (filePath: string) => void;
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
  onInspectFile,
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
    if (sortKey !== key) return <ArrowUpDown className="w-3.5 h-3.5 text-[#b0b0b5]" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0066cc]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0066cc]" />
    );
  };

  return (
    <UtilityCard
      title="실시간 변환 내역"
      badge={
        <span className="text-[13px] text-[#7a7a7a] font-normal whitespace-nowrap">
          최근 {records.length}건 (헤더 클릭 시 정렬)
        </span>
      }
      rightAction={
        <PillButton variant="pearl-capsule" size="sm" onClick={onGoHistory}>
          전체 이력 보기
        </PillButton>
      }
      className="h-full"
    >
      {records.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#7a7a7a]">
          대기 중 — 수신 폴더에 아규격 파일이 들어오면 자동으로 변환됩니다.
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto border border-[#e0e0e0] rounded-[12px]">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead className="sticky top-0 bg-[#f5f5f7] z-10 border-b border-[#e0e0e0] text-[#333333] text-[13px]">
              <tr>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>상태</span>
                    {renderSortIcon('status')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>위반구분</span>
                    {renderSortIcon('enfCode')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('deviceCode')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>장비번호</span>
                    {renderSortIcon('deviceCode')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('carNum')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>차량번호</span>
                    {renderSortIcon('carNum')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('enfSpeed')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>차로 · 속도</span>
                    {renderSortIcon('enfSpeed')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('violationTime')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>위반일시</span>
                    {renderSortIcon('violationTime')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleSort('targetFileName')}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-[#0066cc]"
                  >
                    <span>변환 파일명</span>
                    {renderSortIcon('targetFileName')}
                  </button>
                </th>
                <th className="py-2.5 px-3 font-semibold whitespace-nowrap text-right">영상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] bg-[#ffffff]">
              {sortedRecords.map((r) => (
                <tr key={r.id} className="hover:bg-[#f5f5f7]/60">
                  <td className="py-2 px-3 whitespace-nowrap">
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
                  <td className="py-2 px-3 font-semibold whitespace-nowrap">
                    {r.enfCode === '1' ? '속도위반' : r.enfCode === '3' ? '신호위반' : '-'}
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">{r.deviceCode}</td>
                  <td className="py-2 px-3 font-semibold whitespace-nowrap">{r.carNum}</td>
                  <td className="py-2 px-3 whitespace-nowrap text-[#333333]">
                    {r.lane > 0 ? `${r.lane}차로 · ${r.enfSpeed}킬로` : '-'}
                  </td>
                  <td className="py-2 px-3 text-[#7a7a7a] text-[13px] whitespace-nowrap">
                    {r.violationTime}
                  </td>
                  <td
                    className="py-2 px-3 text-[13px] text-[#333333] max-w-[200px] truncate"
                    title={r.targetFileName || r.errorMessage || r.sourceFileName}
                  >
                    {r.targetFileName || r.errorMessage || r.sourceFileName}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </UtilityCard>
  );
};
