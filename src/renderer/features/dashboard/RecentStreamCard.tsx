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
      title="최근 실시간 변환 스트림"
      subtitle="가장 최근에 처리된 단속 데이터 내역입니다. 행의 [뷰어 열기]를 누르면 .DAT 내부 영상을 즉시 확인합니다."
      rightAction={
        <PillButton variant="secondary-pill" size="sm" onClick={onGoHistory}>
          전체 이력 조회
        </PillButton>
      }
    >
      {records.length === 0 ? (
        <div className="py-12 text-center text-[14px] text-[#7a7a7a]">
          아직 변환된 단속 파일 내역이 없습니다. 수신 폴더에 아규격 파일이 유입되거나 상단의 [단일 아규격 파일 수동 변환]을 실행하면 이곳에 표시됩니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#e0e0e0] text-[#7a7a7a]">
                <th className="py-2.5 px-3 font-semibold">상태</th>
                <th className="py-2.5 px-3 font-semibold">위반구분</th>
                <th className="py-2.5 px-3 font-semibold">장비코드</th>
                <th className="py-2.5 px-3 font-semibold">차량번호</th>
                <th className="py-2.5 px-3 font-semibold">차로 / 속도</th>
                <th className="py-2.5 px-3 font-semibold">위반시각</th>
                <th className="py-2.5 px-3 font-semibold">생성된 자규격 파일(.DAT)</th>
                <th className="py-2.5 px-3 font-semibold text-right">영상 검증</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {records.slice(0, 12).map((r) => (
                <tr key={r.id} className="bg-[#ffffff]">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        r.status === 'SUCCESS'
                          ? 'bg-[#f5f5f7] text-[#0066cc]'
                          : 'bg-[#f5f5f7] text-[#333333]'
                      }`}
                    >
                      {r.status === 'SUCCESS' ? '변환완료' : r.status === 'FAILED' ? '실패' : '건너뜀'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">
                    {r.enfCode === '1' ? '속도위반' : r.enfCode === '3' ? '신호위반' : '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono">{r.deviceCode}</td>
                  <td className="py-2.5 px-3 font-semibold text-[#1d1d1f]">{r.carNum}</td>
                  <td className="py-2.5 px-3">
                    {r.lane > 0 ? `${r.lane}차로 / ${r.enfSpeed}km/h` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[#7a7a7a] font-mono">{r.violationTime}</td>
                  <td className="py-2.5 px-3 font-mono text-[12px] text-[#333333] max-w-[260px] truncate">
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
                        <span>뷰어 열기</span>
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
