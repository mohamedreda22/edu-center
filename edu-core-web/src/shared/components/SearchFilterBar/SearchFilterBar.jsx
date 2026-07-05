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
    <div className="relative w-full max-w-sm">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
    </div>
  );
};

export default SearchFilterBar;
