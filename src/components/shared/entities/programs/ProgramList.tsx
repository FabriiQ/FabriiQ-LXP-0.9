import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Skeleton } from '@/components/ui/core/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/core/pagination';
import {
  ProgramData,
  ProgramAction,
  ProgramFilter,
  UserRole
} from './types';
import ProgramCard from './ProgramCard';
import ProgramFilters from './ProgramFilters';
import { LayoutGrid, List, SortAsc, SortDesc, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgramListProps {
  programs: ProgramData[];
  userRole: UserRole;
  isLoading?: boolean;
  error?: string;
  institutions?: { id: string; name: string }[];
  campuses?: { id: string; name: string }[];
  onAction: (action: ProgramAction, program: ProgramData) => void;
  onFilterChange?: (filters: ProgramFilter) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

/**
 * ProgramList component
 *
 * Displays a list of programs with filtering and pagination.
 * Adapts based on the user's role and supports different view modes.
 */
const ProgramList: React.FC<ProgramListProps> = ({
  programs,
  userRole,
  isLoading = false,
  error,
  institutions = [],
  campuses = [],
  onAction,
  onFilterChange,
  pagination,
  className
}) => {
  // State for view mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<ProgramFilter>({});

  // Handle filter change
  const handleFilterChange = (newFilters: ProgramFilter) => {
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Handle action
  const handleAction = (action: ProgramAction, program: ProgramData) => {
    onAction(action, program);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "flex flex-col gap-2"
        }>
          {Array(6).fill(0).map((_, index) => (
            <Skeleton key={index} className={viewMode === 'grid'
              ? "h-64 w-full"
              : "h-20 w-full"
            } />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onFilterChange && onFilterChange({})}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (programs.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <ProgramFilters
          userRole={userRole}
          initialFilters={filters}
          onFilterChange={handleFilterChange}
          institutions={institutions}
          campuses={campuses}
          compact={true}
        />
        <Card className="w-full mt-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h3 className="text-lg font-medium mb-2">No programs found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {Object.keys(filters).length > 0
                ? "Try adjusting your filters to find what you're looking for."
                : "There are no programs to display."}
            </p>
            {Object.keys(filters).length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleFilterChange({})}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Filters */}
      <ProgramFilters
        userRole={userRole}
        initialFilters={filters}
        onFilterChange={handleFilterChange}
        institutions={institutions}
        campuses={campuses}
        compact={true}
      />

      {/* View mode toggle and count */}
      <div className="flex items-center justify-between mb-4 mt-6">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{programs.length}</span> programs
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Program list */}
      <div className={viewMode === 'grid'
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        : "flex flex-col gap-2"
      }>
        {programs.map(program => (
          <ProgramCard
            key={program.id}
            program={program}
            userRole={userRole}
            viewMode={viewMode === 'grid' ? 'full' : 'list'}
            onAction={handleAction}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.currentPage > 1) {
                    pagination.onPageChange(pagination.currentPage - 1);
                  }
                }}
                className={pagination.currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page =>
                page === 1 ||
                page === pagination.totalPages ||
                Math.abs(page - pagination.currentPage) <= 1
              )
              .reduce((items, page, i, filteredPages) => {
                if (i > 0 && filteredPages[i - 1] !== page - 1) {
                  items.push(
                    <PaginationItem key={`ellipsis-${page}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                items.push(
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        pagination.onPageChange(page);
                      }}
                      isActive={page === pagination.currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );

                return items;
              }, [] as React.ReactNode[])
            }

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pagination.currentPage < pagination.totalPages) {
                    pagination.onPageChange(pagination.currentPage + 1);
                  }
                }}
                className={pagination.currentPage >= pagination.totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ProgramList;
