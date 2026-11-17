import React from 'react';

export const StatusFooter: React.FC = () => {
  return (
    <footer className="h-[26px] bg-[#e2e8f0]/70 border-t border-[#cbd5e1] px-4 flex items-center justify-between text-[11px] text-[#475569] whitespace-nowrap shrink-0 select-none">
      <div className="flex items-center gap-2">
        <strong className="font-semibold text-[#0f172a]">AtoJ 무인교통단속장비 규격 변환기 2.0</strong>
        <span>·</span>
        <span>경찰-6310-98-0001 (아규격 → 자규격 .DAT)</span>
      </div>
      <div>개발·기술지원: ㈜이노네트웍스 강홍선</div>
    </footer>
  );
};
