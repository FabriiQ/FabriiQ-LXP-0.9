'use client';

/**
 * PrintLayout
 * 
 * A reusable component for creating print-optimized layouts.
 * Provides consistent styling and structure for printed content.
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface PrintLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  author?: string;
  date?: string | Date;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  showPageNumbers?: boolean;
}

export function PrintLayout({
  children,
  title,
  subtitle,
  author,
  date,
  logo,
  footer,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  pageSize = 'a4',
  orientation = 'portrait',
  showPageNumbers = true,
}: PrintLayoutProps) {
  // Format date if provided
  const formattedDate = date 
    ? typeof date === 'string' 
      ? date 
      : date.toLocaleDateString()
    : new Date().toLocaleDateString();
  
  // Get page size dimensions
  const getPageSizeClass = () => {
    switch (pageSize) {
      case 'a4':
        return orientation === 'portrait' 
          ? 'w-[210mm] h-[297mm]' 
          : 'w-[297mm] h-[210mm]';
      case 'letter':
        return orientation === 'portrait' 
          ? 'w-[216mm] h-[279mm]' 
          : 'w-[279mm] h-[216mm]';
      case 'legal':
        return orientation === 'portrait' 
          ? 'w-[216mm] h-[356mm]' 
          : 'w-[356mm] h-[216mm]';
      default:
        return orientation === 'portrait' 
          ? 'w-[210mm] h-[297mm]' 
          : 'w-[297mm] h-[210mm]';
    }
  };
  
  return (
    <div 
      className={cn(
        "print-layout bg-white text-black mx-auto my-4 shadow-md",
        getPageSizeClass(),
        orientation === 'landscape' && 'print:rotate-90 print:origin-center',
        className
      )}
    >
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${pageSize} ${orientation};
            margin: 0;
          }
          
          body {
            background-color: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-layout {
            margin: 0;
            padding: 0;
            box-shadow: none;
            page-break-after: always;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          .no-page-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
      
      {/* Header */}
      <header 
        className={cn(
          "print-header border-b p-6 flex items-center justify-between",
          headerClassName
        )}
      >
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-lg text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {logo && (
          <div className="logo ml-4">
            {logo}
          </div>
        )}
      </header>
      
      {/* Metadata */}
      <div className="print-metadata px-6 py-3 text-sm text-gray-600 border-b flex justify-between">
        <div>
          {author && (
            <span className="mr-4">
              <span className="font-medium">Author:</span> {author}
            </span>
          )}
          <span>
            <span className="font-medium">Date:</span> {formattedDate}
          </span>
        </div>
        
        {showPageNumbers && (
          <div className="print-page-number">
            Page <span className="page-number"></span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <main 
        className={cn(
          "print-content p-6",
          contentClassName
        )}
      >
        {children}
      </main>
      
      {/* Footer */}
      <footer 
        className={cn(
          "print-footer border-t p-4 text-sm text-gray-600",
          footerClassName
        )}
      >
        {footer || (
          <div className="flex justify-between items-center">
            <div>
              {title}
            </div>
            {showPageNumbers && (
              <div className="print-page-number">
                Page <span className="page-number"></span>
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
