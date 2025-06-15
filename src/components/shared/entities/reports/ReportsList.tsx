import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Settings,
  FileText,
  Calendar,
  Clock,
  Download,
  Eye,
  Edit,
  Trash,
  MoreHorizontal
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
import { Badge } from '@/components/ui/core/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/core/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/core/pagination';
import { format } from 'date-fns';
import { Report, ReportStatus, ReportType, ReportFormat, ReportSortField } from './types';
import { ReportFilters } from './ReportFilters';

// Helper function to get status badge variant
const getStatusBadgeVariant = (status: ReportStatus) => {
  switch (status) {
    case ReportStatus.PUBLISHED:
      return 'success';
    case ReportStatus.DRAFT:
      return 'secondary';
    case ReportStatus.SCHEDULED:
      return 'warning';
    case ReportStatus.ARCHIVED:
      return 'outline';
    default:
      return 'default';
  }
};

// Helper function to get type badge variant
const getTypeBadgeVariant = (type: ReportType) => {
  switch (type) {
    case ReportType.STANDARD:
      return 'default';
    case ReportType.CUSTOM:
      return 'secondary';
    case ReportType.SYSTEM:
      return 'destructive';
    case ReportType.REGULATORY:
      return 'warning';
    default:
      return 'default';
  }
};

// Helper function to get format badge variant
const getFormatBadgeVariant = (format: ReportFormat) => {
  switch (format) {
    case ReportFormat.PDF:
      return 'default';
    case ReportFormat.CSV:
      return 'secondary';
    case ReportFormat.EXCEL:
      return 'success';
    case ReportFormat.HTML:
      return 'warning';
    case ReportFormat.JSON:
      return 'destructive';
    default:
      return 'default';
  }
};

export interface ReportsListProps {
  reports: Report[];
  isLoading?: boolean;
  error?: string;
  onView?: (report: Report) => void;
  onEdit?: (report: Report) => void;
  onDelete?: (report: Report) => void;
  onDownload?: (report: Report) => void;
  onCreateNew?: () => void;
  onSearch?: (searchTerm: string) => void;
  onFilter?: (filters: any) => void;
  onSort?: (field: ReportSortField, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  showCreateButton?: boolean;
  className?: string;
}

export function ReportsList({
  reports,
  isLoading = false,
  error,
  onView,
  onEdit,
  onDelete,
  onDownload,
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
  className = '',
}: ReportsListProps) {
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
    // const maxVisiblePages = 5; // Unused variable

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
                placeholder="Search reports..."
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
              <span className="hidden sm:inline">Create Report</span>
            </Button>
          )}
        </div>
      </div>

      {showFiltersPanel && showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportFilters onFilter={onFilter} onSort={onSort} />
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {reports.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/10">
              <p className="text-muted-foreground">No reports found.</p>
              {onCreateNew && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={onCreateNew}
                >
                  Create your first report
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
                          <div>
                            <h3 className="text-lg font-semibold">{report.title}</h3>
                            {report.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant={getStatusBadgeVariant(report.status) as any}>
                            {report.status}
                          </Badge>
                          <Badge variant={getTypeBadgeVariant(report.type) as any}>
                            {report.type}
                          </Badge>
                          <Badge variant={getFormatBadgeVariant(report.format) as any}>
                            {report.format}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created: {format(report.createdAt, 'MMM d, yyyy')}
                          </div>

                          {report.lastGeneratedAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Generated: {format(report.lastGeneratedAt, 'MMM d, yyyy')}
                            </div>
                          )}

                          {report.scheduledAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Scheduled: {format(report.scheduledAt, 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>

                        {report.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {report.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {onView && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onView(report)}
                            title="View Report"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        {onDownload && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onDownload(report)}
                            title="Download Report"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              title="More Options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onEdit && report.status !== ReportStatus.ARCHIVED && (
                              <DropdownMenuItem onClick={() => onEdit(report)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}

                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(report)}
                                className="text-destructive"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} reports
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
