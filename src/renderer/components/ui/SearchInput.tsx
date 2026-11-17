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
      <Search className="w-4 h-4 text-[#7a7a7a] absolute left-4 pointer-events-none" />
      <input
        type="text"
        className={`w-full h-[42px] pl-10 pr-5 rounded-full bg-[#ffffff] text-[#1d1d1f] text-[14px] border border-[#e0e0e0] focus:outline-2 focus:outline-[#0071e3] placeholder:text-[#7a7a7a] ${className}`}
        {...props}
      />
    </div>
  );
};
