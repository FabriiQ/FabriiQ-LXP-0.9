import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus, 
  Filter, 
  SlidersHorizontal 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/core/card';
import { Input } from '@/components/ui/core/input';
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
import { AssessmentCard } from './AssessmentCard';
import { Assessment, AssessmentSortField } from './types';
import { AssessmentFilters } from './AssessmentFilters';

export interface AssessmentListProps {
  assessments: Assessment[];
  isLoading?: boolean;
  error?: string;
  onView?: (assessment: Assessment) => void;
  onEdit?: (assessment: Assessment) => void;
  onDelete?: (assessment: Assessment) => void;
  onPreview?: (assessment: Assessment) => void;
  onPublish?: (assessment: Assessment) => void;
  onArchive?: (assessment: Assessment) => void;
  onDuplicate?: (assessment: Assessment) => void;
  onAnalytics?: (assessment: Assessment) => void;
  onAssign?: (assessment: Assessment) => void;
  onCreateNew?: () => void;
  onSearch?: (searchTerm: string) => void;
  onFilter?: (filters: any) => void;
  onSort?: (field: AssessmentSortField, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  showCreateButton?: boolean;
  compact?: boolean;
  className?: string;
}

export function AssessmentList({
  assessments,
  isLoading = false,
  error,
  onView,
  onEdit,
  onDelete,
  onPreview,
  onPublish,
  onArchive,
  onDuplicate,
  onAnalytics,
  onAssign,
  onCreateNew,
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  totalCount = 0,
  pageSize = 10,
  currentPage = 1,
  totalPages = 1,
  showFilters = true,
  showSearch = true,
  showPagination = true,
  showCreateButton = true,
  compact = false,
  className = '',
}: AssessmentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Optional: Implement debounced search
  };

  const toggleFilters = () => {
    setShowFiltersPanel(!showFiltersPanel);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink 
          onClick={() => onPageChange?.(1)} 
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => onPageChange?.(i)} 
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink 
            onClick={() => onPageChange?.(totalPages)} 
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search assessments..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </form>
        )}
        
        <div className="flex gap-2 self-end">
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFilters}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          )}
          
          {showCreateButton && onCreateNew && (
            <Button
              variant="default"
              size="sm"
              onClick={onCreateNew}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Assessment</span>
            </Button>
          )}
        </div>
      </div>
      
      {showFiltersPanel && showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filter Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssessmentFilters onFilter={onFilter} onSort={onSort} />
          </CardContent>
        </Card>
      )}
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
              <div className="p-6 pt-2">
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {assessments.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/10">
              <p className="text-muted-foreground">No assessments found.</p>
              {onCreateNew && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={onCreateNew}
                >
                  Create your first assessment
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {assessments.map((assessment) => (
                <AssessmentCard
                  key={assessment.id}
                  assessment={assessment}
                  onView={onView ? () => onView(assessment) : undefined}
                  onEdit={onEdit ? () => onEdit(assessment) : undefined}
                  onDelete={onDelete ? () => onDelete(assessment) : undefined}
                  onPreview={onPreview ? () => onPreview(assessment) : undefined}
                  onPublish={onPublish ? () => onPublish(assessment) : undefined}
                  onArchive={onArchive ? () => onArchive(assessment) : undefined}
                  onDuplicate={onDuplicate ? () => onDuplicate(assessment) : undefined}
                  onAnalytics={onAnalytics ? () => onAnalytics(assessment) : undefined}
                  onAssign={onAssign ? () => onAssign(assessment) : undefined}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} assessments
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                  aria-disabled={currentPage === 1}
                  tabIndex={currentPage === 1 ? -1 : 0}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {renderPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                  aria-disabled={currentPage === totalPages}
                  tabIndex={currentPage === totalPages ? -1 : 0}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
