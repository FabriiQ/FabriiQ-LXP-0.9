'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/atoms/button';

// Types
export interface PaginationProps {
  /**
   * Total number of items
   */
  totalItems: number;
  /**
   * Number of items per page
   */
  itemsPerPage: number;
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;
  /**
   * Called when page changes
   */
  onPageChange: (page: number) => void;
  /**
   * Maximum number of page buttons to show
   * @default 5
   */
  maxPageButtons?: number;
  /**
   * Show first/last page buttons
   * @default false
   */
  showFirstLastButtons?: boolean;
  /**
   * Show page size selector
   * @default false
   */
  showPageSizeSelector?: boolean;
  /**
   * Available page sizes
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: number[];
  /**
   * Called when page size changes
   */
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Show total items count
   * @default false
   */
  showTotalItems?: boolean;
  /**
   * Custom class for the pagination container
   */
  className?: string;
  /**
   * Custom class for the page buttons
   */
  buttonClassName?: string;
  /**
   * Variant for the pagination buttons
   * @default 'outline'
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Size of the pagination buttons
   * @default 'sm'
   */
  size?: 'default' | 'sm' | 'lg';
  /**
   * Disable the pagination
   * @default false
   */
  disabled?: boolean;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  maxPageButtons = 5,
  showFirstLastButtons = false,
  showPageSizeSelector = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  showTotalItems = false,
  className,
  buttonClassName,
  variant = 'outline',
  size = 'sm',
  disabled = false,
}: PaginationProps) {
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure current page is within valid range
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | 'ellipsis')[] = [];
    
    // Calculate the range of page numbers to display
    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push('ellipsis');
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis');
      }
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page !== safeCurrentPage && page >= 1 && page <= totalPages && !disabled) {
      onPageChange(page);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-4", className)}>
      {/* Page size selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={handlePageSizeChange}
            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={disabled}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Total items */}
      {showTotalItems && (
        <div className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
      )}
      
      {/* Pagination controls */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* First page button */}
        {showFirstLastButtons && (
          <Button
            variant={variant}
            size={size}
            className={buttonClassName}
            onClick={() => handlePageChange(1)}
            disabled={safeCurrentPage === 1 || disabled}
            aria-label="Go to first page"
          >
            <span className="sr-only">First page</span>
            <ChevronLeft className="h-4 w-4 mr-1" />
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        {/* Previous page button */}
        <Button
          variant={variant}
          size={size}
          className={buttonClassName}
          onClick={() => handlePageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1 || disabled}
          aria-label="Go to previous page"
        >
          <span className="sr-only">Previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page number buttons */}
        {pageNumbers.map((pageNumber, index) => 
          pageNumber === 'ellipsis' ? (
            <span 
              key={`ellipsis-${index}`} 
              className="px-2 text-muted-foreground"
              aria-hidden="true"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <Button
              key={pageNumber}
              variant={pageNumber === safeCurrentPage ? 'default' : variant}
              size={size}
              className={buttonClassName}
              onClick={() => handlePageChange(pageNumber)}
              disabled={disabled}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </Button>
          )
        )}
        
        {/* Next page button */}
        <Button
          variant={variant}
          size={size}
          className={buttonClassName}
          onClick={() => handlePageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages || disabled}
          aria-label="Go to next page"
        >
          <span className="sr-only">Next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        {/* Last page button */}
        {showFirstLastButtons && (
          <Button
            variant={variant}
            size={size}
            className={buttonClassName}
            onClick={() => handlePageChange(totalPages)}
            disabled={safeCurrentPage === totalPages || disabled}
            aria-label="Go to last page"
          >
            <span className="sr-only">Last page</span>
            <ChevronRight className="h-4 w-4 mr-1" />
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </nav>
    </div>
  );
}

export default Pagination; 