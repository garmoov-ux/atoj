import React from 'react';
import { Eye } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import { PillButton } from '../../components/ui/PillButton';
import type { ConversionRecord } from '@shared/types/domain';

interface RecentStreamCardProps {
  records: ConversionRecord[];
  onInspectFile: (filePath: string) => void;
  onGoHistory: () => void;
}

export const RecentStreamCard: React.FC<RecentStreamCardProps> = ({
  records,
  onInspectFile,
  onGoHistory,
}) => {
  return (
    <UtilityCard
      title="실시간 변환 내역"
      badge={
        <span className="text-[12px] text-[#7a7a7a] font-normal whitespace-nowrap">
          최근 {records.length}건
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
        <div className="flex-1 flex items-center justify-center text-[13px] text-[#7a7a7a]">
          대기 중 — 수신 폴더에 아규격 파일이 들어오면 자동으로 변환됩니다.
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead className="sticky top-0 bg-[#ffffff] z-10 border-b border-[#e0e0e0] text-[#7a7a7a]">
              <tr>
                <th className="py-2 px-3 font-semibold whitespace-nowrap">상태</th>
                <th className="py-2 px-3 font-semibold whitespace-nowrap">위반구분</th>
                <th className="py-2 px-3 font-semibold whitespace-nowrap">장비번호</th>
                <th className="py-2 px-3 font-semibold whitespace-nowrap">차량번호</th>
                <th className="py-2 px-3 font-semibold whitespace-nowrap">차로 · 속도</th>
                <th className="py-2 px-3 font-semibold whitespace-nowrap">위반일시</th>
                <th className="py-2 px-3 font-semibold whitespace-nowrap">변환 파일명</th>
                <th className="py-2 px-3 font-semibold whitespace-nowrap text-right">영상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-[#f5f5f7]/60">
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
                  <td className="py-2 px-3 whitespace-nowrap text-[#333333]">
                    {r.lane > 0 ? `${r.lane}차로 · ${r.enfSpeed}킬로` : '-'}
                  </td>
                  <td className="py-2 px-3 text-[#7a7a7a] text-[12px] whitespace-nowrap">
                    {r.violationTime}
                  </td>
                  <td
                    className="py-2 px-3 text-[12px] text-[#333333] max-w-[200px] truncate"
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </UtilityCard>
  );
};
