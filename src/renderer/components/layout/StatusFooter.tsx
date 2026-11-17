import React from 'react';

export const StatusFooter: React.FC = () => {
  return (
    <footer className="bg-[#f5f5f7] border-t border-[#e0e0e0] py-4 px-6 text-center text-[12px] text-[#7a7a7a] tracking-[-0.12px] select-none">
      <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-center gap-2">
        <strong className="font-semibold text-[#333333]">AtoJ Converter v2.0.0</strong>
        <span>|</span>
        <span>규격: 경찰-6310-98-0001 (아 → 자)</span>
        <span>|</span>
        <span>개발·기술지원: ㈜이노네트웍스 강홍선 (s_gain@naver.com)</span>
      </div>
    </footer>
  );
};
