'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce } from 'lodash';

interface QuestionSearchProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

/**
 * Question Search Component
 * 
 * This component provides search functionality for questions in the question bank.
 * It includes debouncing to prevent excessive API calls.
 */
export const QuestionSearch: React.FC<QuestionSearchProps> = ({
  value,
  onSearch,
  placeholder = 'Search questions...',
  className = '',
  debounceMs = 300,
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  
  // Create a debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      onSearch(term);
    }, debounceMs),
    [onSearch, debounceMs]
  );
  
  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    debouncedSearch(newValue);
  };
  
  // Handle clear search
  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };
  
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleChange}
        className="pl-9 pr-10"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default QuestionSearch;
