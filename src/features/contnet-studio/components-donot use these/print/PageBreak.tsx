'use client';

/**
 * PageBreak
 * 
 * A component for adding page breaks in printed content.
 * Provides visual indication in the preview and actual page breaks when printed.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageBreakProps {
  className?: string;
  showInPreview?: boolean;
}

export function PageBreak({
  className,
  showInPreview = true,
}: PageBreakProps) {
  return (
    <div 
      className={cn(
        "page-break w-full",
        showInPreview && "border-t-2 border-dashed border-gray-300 my-8",
        "print:border-0 print:my-0",
        className
      )}
      style={{
        pageBreakAfter: 'always',
      }}
    >
      {showInPreview && (
        <div className="text-center text-xs text-gray-500 -mt-2.5 print:hidden">
          <span className="bg-white px-2">Page Break</span>
        </div>
      )}
    </div>
  );
}

export interface NoBreakContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function NoBreakContainer({
  children,
  className,
}: NoBreakContainerProps) {
  return (
    <div 
      className={cn(
        "no-page-break",
        className
      )}
      style={{
        pageBreakInside: 'avoid',
      }}
    >
      {children}
    </div>
  );
}
