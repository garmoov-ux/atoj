import React from 'react';
import { Info } from 'lucide-react';
import { UtilityCard } from '../../components/ui/UtilityCard';
import {
  ENF_TYPE_LABELS,
  SIGNAL_TYPE_LABELS,
  TRIGGER_TYPE_LABELS,
} from '@shared/spec-labels';
import type { DatInspectionResult } from '@shared/types/domain';

interface SpecKeyValuePanelProps {
  inspected: DatInspectionResult;
}

interface KvItem {
  key: string;
  value: React.ReactNode;
  accent?: 'primary' | 'danger' | 'emerald';
}

function KvSection({ title, items }: { title: string; items: KvItem[] }) {
  return (
    <div className="border border-[#cbd5e1] rounded-[8px] overflow-hidden bg-[#ffffff] shrink-0">
      <div className="bg-[#f1f5f9] px-3 py-1.5 border-b border-[#cbd5e1] text-[11.5px] font-bold text-[#334155] tracking-tight">
        {title}
      </div>
      <div className="divide-y divide-[#e2e8f0]">
        {items.map((item) => {
          const valColor =
            item.accent === 'primary'
              ? 'text-[#2563eb] font-bold'
              : item.accent === 'danger'
                ? 'text-[#e11d48] font-bold'
                : item.accent === 'emerald'
                  ? 'text-[#059669] font-bold'
                  : 'text-[#0f172a] font-semibold';

          return (
            <div
              key={item.key}
              className="grid grid-cols-12 items-center px-3 py-1.5 text-[12.5px] hover:bg-[#f8fafc]"
            >
              <span className="col-span-5 text-[#64748b] font-medium truncate">
                {item.key}
              </span>
              <span className="col-span-1 text-center text-[#94a3b8] font-mono">:</span>
              <span className={`col-span-6 text-right truncate ${valColor}`} title={String(item.value ?? '')}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SpecKeyValuePanel: React.FC<SpecKeyValuePanelProps> = ({ inspected }) => {
  const raw = inspected.rawHeader;
  const isSignal = inspected.violationCode === 3;

  const statusText =
    inspected.fileStatus === 'EXPORTED_SNAPSHOT'
      ? '외부시스템 반출됨 (내부 스냅샷 보존)'
      : inspected.fileStatus === 'DB_METADATA_ONLY'
        ? '외부시스템 반출됨 (DB 속성 보존)'
        : '결과 폴더(.DAT) 보관 중';

  const coreItems: KvItem[] = [
    { key: '차량번호', value: inspected.carNum, accent: 'primary' },
    {
      key: '위반구분',
      value: `${inspected.violationLabel} (코드 ${inspected.violationCode})`,
      accent: isSignal ? 'danger' : 'primary',
    },
    { key: '위반속도', value: `${inspected.violationSpeed} km/h`, accent: 'danger' },
    ...(inspected.speedLimit !== undefined
      ? [{ key: '단속기준속도', value: `${inspected.speedLimit} km/h` }]
      : []),
    { key: '위반차로', value: `${inspected.lane}차로` },
    { key: '차종분류', value: `${inspected.carTypeLabel} (코드 ${inspected.carType})` },
  ];

  const deviceItems: KvItem[] = [
    { key: '위반일시', value: inspected.violationTime },
    { key: '장비번호(LocalNo)', value: inspected.deviceCode || raw?.deviceCode || '-' },
    ...(raw
      ? [
          {
            key: '세부위반종류',
            value: `${ENF_TYPE_LABELS[raw.enfType] || '기본'} (${raw.enfType})`,
          },
          {
            key: '트리거종류',
            value: `${TRIGGER_TYPE_LABELS[raw.triggerType] || '기본'} (${raw.triggerType})`,
          },
          { key: '원본헤더크기', value: `${raw.rawSizeField} (114B)` },
        ]
      : []),
  ];

  const plateItems: KvItem[] = [
    {
      key: '번호판인식유무',
      value: inspected.hasPlate === 1 ? '존재 (1)' : '미존재 (0)',
      accent: inspected.hasPlate === 1 ? 'emerald' : undefined,
    },
    {
      key: '시작좌표 (X, Y)',
      value: `X: ${inspected.plateBox.x}, Y: ${inspected.plateBox.y}`,
    },
    {
      key: '영역크기 (W×H)',
      value: `${inspected.plateBox.width} × ${inspected.plateBox.height} px`,
    },
  ];

  const signalItems: KvItem[] = isSignal
    ? [
        {
          key: '신호등상태',
          value: `${inspected.signalShapeLabel || '-'} (코드 ${inspected.signalShape ?? '-'})`,
          accent: 'danger',
        },
        {
          key: '차량진행방향',
          value: `${inspected.carDirectionLabel || '-'} (코드 ${inspected.carDirection ?? '-'})`,
        },
        {
          key: '신호등종류',
          value:
            (inspected.signalType && SIGNAL_TYPE_LABELS[inspected.signalType]) ||
            `코드 ${inspected.signalType ?? '-'}`,
        },
        { key: '정지선통과시간', value: `${inspected.signalStartPassTime ?? 0} 초` },
        { key: '교차로통과시간', value: `${inspected.signalEndPassTime ?? 0} 초` },
        { key: '연속트래킹영상', value: `${inspected.trackingCount} 장` },
      ]
    : [];

  const fileItems: KvItem[] = [
    {
      key: '데이터보존상태',
      value: statusText,
      accent: inspected.fileStatus === 'AVAILABLE' ? 'emerald' : 'primary',
    },
    { key: '자규격파일명', value: inspected.targetFileName || inspected.fileName },
    ...(inspected.sourceFileName ? [{ key: '아규격원본명', value: inspected.sourceFileName }] : []),
    {
      key: '파일크기 / 버전',
      value: `${(inspected.fileSize / 1024).toFixed(1)} KB · ${inspected.fileVersion}`,
    },
    ...(inspected.createdAt ? [{ key: '변환처리시각', value: inspected.createdAt }] : []),
  ];

  return (
    <UtilityCard
      title="단속 데이터 명세 (속성 : 값)"
      badge={<Info className="w-3.5 h-3.5 text-[#2563eb]" />}
      className="flex-1 min-h-0"
      bodyClassName="overflow-y-auto space-y-2.5 pr-1"
    >
      <KvSection title="단속 핵심 속성" items={coreItems} />
      {signalItems.length > 0 && <KvSection title="신호위반 상세 속성" items={signalItems} />}
      <KvSection title="번호판 좌표 속성" items={plateItems} />
      <KvSection title="장비 및 시간 속성" items={deviceItems} />
      <KvSection title="파일 및 반출 상태" items={fileItems} />
    </UtilityCard>
  );
};
