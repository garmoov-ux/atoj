import React from 'react';

export const StatusFooter: React.FC = () => {
  return (
    <footer className="h-[32px] bg-[#f5f5f7] border-t border-[#e0e0e0] px-5 flex items-center justify-between text-[12px] text-[#7a7a7a] whitespace-nowrap shrink-0 select-none">
      <div className="flex items-center gap-2">
        <strong className="font-semibold text-[#333333]">무인교통단속장비 규격 변환기 2.0</strong>
        <span>·</span>
        <span>규격: 경찰-6310-98-0001 (아 → 자)</span>
      </div>
      <div>개발·기술지원: ㈜이노네트웍스 강홍선</div>
    </footer>
  );
};
