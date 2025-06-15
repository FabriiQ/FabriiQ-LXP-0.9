'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../core/button';
import { ExtendedSelect } from '../extended/select';
import { useResponsive } from '@/lib/hooks/use-responsive';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showItemsCount?: boolean;
  className?: string;
  role?: 'systemAdmin' | 'campusAdmin' | 'teacher' | 'student' | 'parent';
  variant?: 'default' | 'simple' | 'compact';
}

/**
 * Pagination component for navigating through pages
 *
 * Features:
 * - Multiple variants (default, simple, compact)
 * - Page size selector
 * - Items count display
 * - Mobile-optimized with responsive design
 * - Role-specific styling
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 *   pageSize={10}
 *   onPageSizeChange={(size) => setPageSize(size)}
 *   totalItems={100}
 *   role="teacher"
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = false,
  showItemsCount = false,
  className,
  role,
  variant = 'default',
}: PaginationProps) {
  const { isMobile } = useResponsive();

  // Calculate start and end items
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    if (onPageSizeChange) {
      onPageSizeChange(Number(value));
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      // If there are 7 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        // Show ellipsis if current page is more than 3 away from the start
        pages.push('ellipsis');
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        // Show ellipsis if current page is more than 2 away from the end
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Render based on variant
  switch (variant) {
    case 'simple':
      return (
        <div
          className={cn(
            "flex items-center justify-between",
            className
          )}
        >
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              {!isMobile && <span className="ml-1">Previous</span>}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              {!isMobile && <span className="mr-1">Next</span>}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {showItemsCount && totalItems && (
            <div className="text-sm text-muted-foreground">
              {startItem}-{endItem} of {totalItems} items
            </div>
          )}
        </div>
      );

    case 'compact':
      return (
        <div
          className={cn(
            "flex items-center justify-between",
            className
          )}
        >
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {showPageSizeSelector && onPageSizeChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <ExtendedSelect
                value={pageSize.toString()}
                onChange={handlePageSizeChange}
                options={pageSizeOptions.map(size => ({ value: size.toString(), label: size.toString() }))}
                className="w-16"
              />
            </div>
          )}
        </div>
      );

    default:
      return (
        <div
          className={cn(
            "flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0",
            className
          )}
        >
          {/* Page size selector and items count */}
          <div className="flex items-center space-x-4">
            {showPageSizeSelector && onPageSizeChange && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Items per page:</span>
                <ExtendedSelect
                  value={pageSize.toString()}
                  onChange={handlePageSizeChange}
                  options={pageSizeOptions.map(size => ({ value: size.toString(), label: size.toString() }))}
                  className="w-20"
                />
              </div>
            )}

            {showItemsCount && totalItems && (
              <div className="text-sm text-muted-foreground">
                {startItem}-{endItem} of {totalItems} items
              </div>
            )}
          </div>

          {/* Pagination controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Desktop pagination */}
            {!isMobile && (
              <div className="flex items-center">
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === 'ellipsis' ? (
                      <div className="px-2">
                        <span className="px-2 text-muted-foreground">...</span>
                      </div>
                    ) : (
                      <Button
                        variant={page === currentPage ? "default" : "outline"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 mx-0.5",
                          page === currentPage && "pointer-events-none"
                        )}
                        onClick={() => handlePageChange(page)}
                        aria-label={`Page ${page}`}
                        aria-current={page === currentPage ? "page" : undefined}
                      >
                        {page}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Mobile pagination */}
            {isMobile && (
              <div className="text-sm px-2">
                Page {currentPage} of {totalPages}
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
  }
}
