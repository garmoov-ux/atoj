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
      className={`h-[29px] px-3 rounded-[6px] text-[12px] whitespace-nowrap shrink-0 transition-all duration-150 active:scale-95 cursor-pointer select-none ${
        selected
          ? 'bg-[#2563eb] text-white font-semibold border border-[#2563eb]'
          : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#334155] font-medium border border-[#cbd5e1]'
      }`}
    >
      {children}
    </button>
  );
};
