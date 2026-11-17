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
      className={`px-4 py-2 rounded-full text-[13px] transition-transform duration-150 active:scale-95 cursor-pointer select-none ${
        selected
          ? 'bg-[#ffffff] text-[#1d1d1f] font-semibold border-2 border-[#0071e3]'
          : 'bg-[#ffffff] text-[#333333] font-normal border border-[#e0e0e0]'
      }`}
    >
      {children}
    </button>
  );
};
