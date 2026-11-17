import React from 'react';

interface OptionChipProps {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const OptionChip: React.FC<OptionChipProps> = ({
  selected = false,
  onClick,
  children,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[32px] px-3.5 rounded-full text-[12px] whitespace-nowrap shrink-0 transition-transform duration-150 active:scale-95 cursor-pointer select-none ${
        selected
          ? 'bg-[#0066cc] text-white font-semibold border border-[#0066cc]'
          : 'bg-[#f5f5f7] text-[#333333] font-normal border border-[#e0e0e0]'
      }`}
    >
      {children}
    </button>
  );
};
