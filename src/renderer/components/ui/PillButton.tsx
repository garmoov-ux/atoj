import React from 'react';

export type PillButtonVariant = 'primary' | 'secondary-pill' | 'dark-utility' | 'pearl-capsule';

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillButtonVariant;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export const PillButton: React.FC<PillButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-normal transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] disabled:opacity-45 disabled:pointer-events-none cursor-pointer select-none';

  const sizeClass =
    size === 'sm' ? 'px-3.5 py-1.5 text-[13px] leading-[1.29]' : 'px-5 py-2.5 text-[14px] leading-[1.29]';

  const variantMap: Record<PillButtonVariant, string> = {
    primary: 'bg-[#0066cc] text-white rounded-full',
    'secondary-pill': 'bg-transparent text-[#0066cc] border border-[#0066cc] rounded-full',
    'dark-utility': 'bg-[#1d1d1f] text-white rounded-[8px]',
    'pearl-capsule': 'bg-[#fafafc] text-[#333333] border-[3px] border-[#f0f0f0] rounded-[11px]',
  };

  return (
    <button className={`${base} ${sizeClass} ${variantMap[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};
