'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtendedInput } from '../extended/input';
import { Button } from '../core/button';
import { useDebounce } from '@/hooks/use-debounce';

export interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  debounceMs?: number;
  showVoiceSearch?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  variant?: 'default' | 'minimal' | 'expanded';
  size?: 'default' | 'sm' | 'lg';
  autoFocus?: boolean;
}

/**
 * SearchBar component for search functionality
 *
 * Features:
 * - Debounced search
 * - Loading state
 * - Voice search (on supported browsers)
 * - Clear button
 * - Multiple variants and sizes
 * - Role-specific styling
 * - Mobile-optimized with responsive design
 *
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="Search..."
 *   onSearch={(value) => console.log(value)}
 *   showVoiceSearch
 *   debounceMs={500}
 *   role="teacher"
 * />
 * ```
 */
export function SearchBar({
  placeholder = 'Search...',
  value: propValue,
  onChange,
  onSearch,
  onClear,
  isLoading = false,
  debounceMs = 300,
  showVoiceSearch = false,
  className,
  inputClassName,
  buttonClassName,
  role,
  variant = 'default',
  size = 'default',
  autoFocus = false,
  ...props
}: SearchBarProps) {
  // State for controlled/uncontrolled input
  const [value, setValue] = useState(propValue || '');
  const debouncedValue = useDebounce(value, debounceMs);
  const inputRef = useRef<HTMLInputElement>(null);

  // State for voice search
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

  // Update internal state when prop value changes
  useEffect(() => {
    if (propValue !== undefined && propValue !== value) {
      setValue(propValue);
    }
  }, [propValue]);

  // Initialize speech recognition if supported
  useEffect(() => {
    if (showVoiceSearch && typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setValue(transcript);
          handleSearch(transcript);
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setSpeechRecognition(recognition);
      }
    }

    return () => {
      if (speechRecognition) {
        speechRecognition.abort();
      }
    };
  }, [showVoiceSearch]);

  // Trigger search when debounced value changes
  useEffect(() => {
    if (onSearch && debouncedValue !== propValue) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Handle search button click
  const handleSearch = (searchValue: string = value) => {
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setValue('');
    if (onChange) {
      onChange('');
    }
    if (onClear) {
      onClear();
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle voice search
  const handleVoiceSearch = () => {
    if (speechRecognition) {
      if (isListening) {
        speechRecognition.abort();
        setIsListening(false);
      } else {
        speechRecognition.start();
        setIsListening(true);
      }
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Determine size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8';
      case 'lg':
        return 'h-12';
      default:
        return 'h-10';
    }
  };

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return (
        <div
          className={cn(
            "relative",
            className
          )}
          {...props}
        >
          <ExtendedInput
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            className={cn(
              getSizeClasses(),
              "pr-8",
              inputClassName
            )}
            leftIcon={<Search className="h-4 w-4" />}
            role={role}
            autoFocus={autoFocus}
          />

          {value && (
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      );

    case 'expanded':
      return (
        <div
          className={cn(
            "flex items-center w-full max-w-3xl mx-auto rounded-full border border-input bg-background shadow-sm transition-all focus-within:shadow-md",
            getSizeClasses(),
            className
          )}
          {...props}
        >
          <div className="flex-1 flex items-center pl-4">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-base"
              autoFocus={autoFocus}
            />
          </div>

          <div className="flex items-center">
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
            )}

            {value && (
              <button
                type="button"
                className="p-2 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {showVoiceSearch && speechRecognition && (
              <button
                type="button"
                className={cn(
                  "p-2",
                  isListening ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={handleVoiceSearch}
                aria-label={isListening ? "Stop voice search" : "Start voice search"}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}

            <Button
              type="button"
              variant="default"
              size="sm"
              className={cn(
                "rounded-full ml-1",
                buttonClassName
              )}
              onClick={() => handleSearch()}
            >
              Search
            </Button>
          </div>
        </div>
      );

    default:
      return (
        <div
          className={cn(
            "flex items-center space-x-2",
            className
          )}
          {...props}
        >
          <div className="relative flex-1">
            <ExtendedInput
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className={cn(
                getSizeClasses(),
                inputClassName
              )}
              leftIcon={<Search className="h-4 w-4" />}
              rightIcon={
                isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : value ? (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleClear}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null
              }
              role={role}
              autoFocus={autoFocus}
            />

            {showVoiceSearch && speechRecognition && (
              <button
                type="button"
                className={cn(
                  "absolute right-2 top-1/2 transform -translate-y-1/2",
                  isListening ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={handleVoiceSearch}
                aria-label={isListening ? "Stop voice search" : "Start voice search"}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="default"
            size={size}
            className={buttonClassName}
            onClick={() => handleSearch()}
          >
            Search
          </Button>
        </div>
      );
  }
}
