import { Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Input } from '../ui/input';

const SearchFilterBar = ({ placeholder = 'بحث...', onSearch }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(
    searchParams.get('search') || ''
  );

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (inputValue) {
        searchParams.set('search', inputValue);
      } else {
        searchParams.delete('search');
      }
      setSearchParams(searchParams, { replace: true });
      if (onSearch) {
        onSearch(inputValue);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue, searchParams, setSearchParams, onSearch]);

  return (
    <div className="relative w-full max-w-sm group">
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pr-10 bg-white border-none shadow-sm focus-visible:ring-secondary rounded-xl transition-all duration-200"
      />
    </div>
  );
};

export default SearchFilterBar;
