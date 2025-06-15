'use client';

import { useState, useEffect, useRef } from 'react';
import { useTeacherAssistant } from '../hooks/use-teacher-assistant';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { SearchInterface } from './SearchInterface';
import { Button } from '@/components/ui/core/button';
import { X, Search, Settings } from 'lucide-react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { UI } from '../constants';

interface TeacherAssistantDialogProps {
  className?: string;
}

/**
 * Dialog component for the teacher assistant
 * 
 * Mobile-first design with responsive layout
 * - Full-height sidebar on desktop
 * - Bottom sheet on mobile
 */
export function TeacherAssistantDialog({ className }: TeacherAssistantDialogProps) {
  const { 
    isOpen, 
    setIsOpen, 
    isTyping, 
    isSearchMode, 
    setIsSearchMode,
    context
  } = useTeacherAssistant();
  
  const { isMobile } = useResponsive();
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen, isMobile]);
  
  // Prevent body scroll when dialog is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);
  
  if (!isOpen) return null;
  
  return (
    <div
      className={cn(
        "fixed z-50 bg-background shadow-xl transition-all duration-300",
        isMobile
          ? "inset-x-0 bottom-0 rounded-t-xl max-h-[90vh]"
          : "right-6 bottom-6 rounded-xl w-full max-w-[420px] max-h-[80vh]",
        className
      )}
      ref={dialogRef}
    >
      {/* Dialog Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">
          {isSearchMode ? 'Search Resources' : 'Teacher Assistant'}
        </h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchMode(!isSearchMode)}
            aria-label={isSearchMode ? "Chat mode" : "Search mode"}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {/* Open settings */}}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Dialog Content */}
      <div className="flex flex-col h-[calc(90vh-8rem)] md:h-[calc(80vh-8rem)]">
        {isSearchMode ? (
          <SearchInterface />
        ) : (
          <>
            <MessageList className="flex-1 overflow-y-auto p-4" />
            {isTyping && <TypingIndicator className="px-4 pb-2" />}
            <MessageInput className="border-t p-4" />
          </>
        )}
      </div>
    </div>
  );
}
