'use client';

import { useState, ChangeEvent } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onChange?: (value: string) => void;
  variant?: 'default' | 'minimal' | 'expanded';
  className?: string;
  defaultValue?: string;
  value?: string;
}

/**
 * SearchBar component
 *
 * A reusable search bar component with different variants
 *
 * @example
 * <SearchBar
 *   placeholder="Search courses..."
 *   onSearch={(query) => console.log(query)}
 *   variant="default"
 * />
 */
export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onChange,
  variant = 'default',
  className = '',
  defaultValue = '',
  value,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    if (onChange) {
      onChange(newValue);
    }
    if (onSearch && variant !== 'expanded') {
      onSearch(newValue);
    }
  };

  // Base classes
  const baseClasses = 'flex items-center w-full transition-default';

  // Variant-specific classes
  const variantClasses = {
    default: 'bg-background border border-input rounded-md shadow-sm',
    minimal: 'bg-transparent border-b border-input',
    expanded: 'bg-background border border-input rounded-lg shadow-md',
  };

  // Input classes
  const inputClasses = 'w-full bg-transparent outline-none text-foreground';

  // Padding classes based on variant
  const paddingClasses = {
    default: 'py-2 px-3',
    minimal: 'py-1 px-2',
    expanded: 'py-3 px-4',
  };

  // Focus classes
  const focusClasses = {
    default: 'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
    minimal: 'focus-within:border-primary',
    expanded: 'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[variant]}
        ${focusClasses[variant]}
        ${className}
      `}
    >
      <Search
        className={`
          mr-2
          ${variant === 'minimal' ? 'h-4 w-4 text-muted-foreground' : 'h-5 w-5 text-muted-foreground'}
        `}
      />
      <input
        type="text"
        value={value !== undefined ? value : query}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          ${inputClasses}
          ${variant === 'minimal' ? 'text-sm' : 'text-base'}
        `}
      />
      {variant === 'expanded' && query.length > 0 && (
        <button
          type="submit"
          className="ml-2 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-default"
        >
          Search
        </button>
      )}
    </form>
  );
}
