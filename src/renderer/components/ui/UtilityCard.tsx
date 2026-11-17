import React from 'react';

interface UtilityCardProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  dark?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const UtilityCard: React.FC<UtilityCardProps> = ({
  title,
  subtitle,
  rightAction,
  dark = false,
  className = '',
  children,
}) => {
  const surfaceClass = dark
    ? 'bg-[#272729] text-white border border-[#3a3a3c]'
    : 'bg-[#ffffff] text-[#1d1d1f] border border-[#e0e0e0]';

  return (
    <section className={`rounded-[18px] p-6 ${surfaceClass} ${className}`}>
      {(title || rightAction) && (
        <header className="flex items-start justify-between gap-4 mb-5">
          <div>
            {title && (
              <h3 className="text-[19px] font-semibold tracking-[-0.018em] leading-[1.2]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className={`mt-1 text-[13px] ${
                  dark ? 'text-[#cccccc]' : 'text-[#7a7a7a]'
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
          {rightAction && <div className="shrink-0">{rightAction}</div>}
        </header>
      )}
      {children}
    </section>
  );
};
