'use client';

import React, { useCallback, useEffect } from 'react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';

interface EssayRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  preventPaste?: boolean;
}

/**
 * Essay Rich Text Editor with paste prevention for academic integrity
 */
export const EssayRichTextEditor: React.FC<EssayRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start writing your essay here...",
  minHeight = "400px",
  disabled = false,
  preventPaste = true
}) => {
  // Handle paste prevention
  const handlePaste = useCallback((event: ClipboardEvent) => {
    if (preventPaste && !disabled) {
      event.preventDefault();
      
      // Show a user-friendly message
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode('');
        range.deleteContents();
        range.insertNode(textNode);
        
        // You could also show a toast notification here
        console.log('Paste prevented for academic integrity');
      }
    }
  }, [preventPaste, disabled]);

  // Handle keyboard shortcuts that might bypass paste prevention
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (preventPaste && !disabled) {
      // Prevent Ctrl+V (Windows/Linux) and Cmd+V (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        console.log('Paste shortcut prevented for academic integrity');
      }
      
      // Prevent Shift+Insert (alternative paste shortcut)
      if (event.shiftKey && event.key === 'Insert') {
        event.preventDefault();
        console.log('Paste shortcut prevented for academic integrity');
      }
    }
  }, [preventPaste, disabled]);

  // Add event listeners when component mounts
  useEffect(() => {
    if (preventPaste && !disabled) {
      // Add paste event listener to document
      document.addEventListener('paste', handlePaste);
      document.addEventListener('keydown', handleKeyDown);
      
      // Cleanup on unmount
      return () => {
        document.removeEventListener('paste', handlePaste);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [preventPaste, disabled, handlePaste, handleKeyDown]);

  // Custom onChange handler that can filter content if needed
  const handleChange = useCallback((newContent: string) => {
    // You could add additional content filtering here if needed
    onChange(newContent);
  }, [onChange]);

  return (
    <div className="relative">
      <RichTextEditor
        content={content}
        onChange={handleChange}
        placeholder={placeholder}
        minHeight={minHeight}
        disabled={disabled}
      />
      
      {preventPaste && !disabled && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-1 rounded border border-yellow-200 dark:border-yellow-800">
            <span className="flex items-center space-x-1">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Paste disabled</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
