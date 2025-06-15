'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

/**
 * Rich Text Display Component
 * 
 * A component for displaying rich text content with proper styling.
 */
export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  content,
  className
}) => {
  if (!content) {
    return null;
  }
  
  return (
    <div 
      className={cn(
        "prose dark:prose-invert max-w-none",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default RichTextDisplay;
