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
      <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 pointer-events-none" />
      <input
        type="text"
        className={`w-full h-[30px] pl-8 pr-3 rounded-[7px] bg-[#f8fafc] text-[#0f172a] text-[12.5px] border border-[#cbd5e1] focus:bg-[#ffffff] focus:outline-2 focus:outline-[#2563eb] placeholder:text-[#64748b] ${className}`}
        {...props}
      />
    </div>
  );
};
