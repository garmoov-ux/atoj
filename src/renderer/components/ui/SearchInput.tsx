import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  wrapperClassName = '',
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex items-center ${wrapperClassName}`}>
      <Search className="w-4 h-4 text-[#7a7a7a] absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        className={`w-full h-[36px] pl-10 pr-4 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-[14px] border border-[#e0e0e0] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#0071e3] placeholder:text-[#7a7a7a] ${className}`}
        {...props}
      />
    </div>
  );
};
