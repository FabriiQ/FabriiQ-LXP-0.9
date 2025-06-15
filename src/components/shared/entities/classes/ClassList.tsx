'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  LayoutGrid, 
  List, 
  SortAsc, 
  SortDesc, 
  MoreHorizontal,
  Users,
  BookOpen,
  Calendar,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassCard } from './ClassCard';
import { ClassActions } from './ClassActions';
import { ClassData, ClassListViewMode, UserRole, ClassAction } from './types';
import { Skeleton } from '@/components/ui/atoms/skeleton';

export interface ClassListColumn {
  id: string;
  header: string;
  accessorKey?: string;
  cell?: (data: ClassData) => React.ReactNode;
  sortable?: boolean;
}

export interface ClassListProps {
  /**
   * Array of class data
   */
  classes: ClassData[];
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * View mode for the list
   * @default 'grid'
   */
  viewMode?: ClassListViewMode;
  
  /**
   * Callback for actions
   */
  onAction?: (action: ClassAction, classData: ClassData) => void;
  
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Pagination configuration
   */
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  
  /**
   * Sorting configuration
   */
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
    onSortChange: (column: string, direction: 'asc' | 'desc') => void;
  };
  
  /**
   * Custom columns for table view
   */
  columns?: ClassListColumn[];
  
  /**
   * Available actions for each class
   */
  actions?: ClassAction[];
  
  /**
   * Optional className for custom styling
   */
  className?: string;
  
  /**
   * Optional callback for view mode change
   */
  onViewModeChange?: (viewMode: ClassListViewMode) => void;
}

/**
 * ClassList component with mobile-first design
 * 
 * Features:
 * - Multiple view modes (grid, table, mobile)
 * - Pagination
 * - Sorting
 * - Role-specific rendering
 * - Loading state
 * 
 * @example
 * ```tsx
 * <ClassList 
 *   classes={classes}
 *   userRole={UserRole.TEACHER}
 *   viewMode="grid"
 *   onAction={handleAction}
 *   pagination={{
 *     currentPage: 1,
 *     totalPages: 5,
 *     pageSize: 10,
 *     totalItems: 50,
 *     onPageChange: handlePageChange
 *   }}
 * />
 * ```
 */
export const ClassList: React.FC<ClassListProps> = ({
  classes,
  userRole,
  viewMode: initialViewMode = 'grid',
  onAction,
  isLoading = false,
  pagination,
  sorting,
  columns,
  actions = [ClassAction.VIEW],
  className,
  onViewModeChange,
}) => {
  // Local state for view mode
  const [viewMode, setViewMode] = useState<ClassListViewMode>(initialViewMode);
  
  // Handle view mode change
  const handleViewModeChange = (mode: ClassListViewMode) => {
    setViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };
  
  // Default columns if not provided
  const defaultColumns: ClassListColumn[] = [
    {
      id: 'name',
      header: 'Class Name',
      accessorKey: 'name',
      cell: (data) => (
        <div>
          <div className="font-medium">{data.name}</div>
          <div className="text-sm text-muted-foreground">{data.code}</div>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'course',
      header: 'Course',
      cell: (data) => data.courseCampus?.course?.name || '-',
      sortable: true,
    },
    {
      id: 'term',
      header: 'Term',
      cell: (data) => data.term?.name || '-',
      sortable: true,
    },
    {
      id: 'students',
      header: 'Students',
      cell: (data) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{data._count?.students || 0}</span>
        </div>
      ),
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      cell: (data) => {
        const getStatusBadgeVariant = (status: string) => {
          switch (status) {
            case 'ACTIVE':
              return 'success';
            case 'UPCOMING':
              return 'warning';
            case 'COMPLETED':
              return 'secondary';
            case 'INACTIVE':
              return 'outline';
            case 'ARCHIVED':
              return 'destructive';
            default:
              return 'default';
          }
        };
        
        return (
          <Badge variant={getStatusBadgeVariant(data.status)}>
            {data.status.charAt(0) + data.status.slice(1).toLowerCase()}
          </Badge>
        );
      },
      sortable: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (data) => (
        <ClassActions
          classData={data}
          userRole={userRole}
          enabledActions={actions}
          onAction={onAction ? (action) => onAction(action, data) : undefined}
          placement="list"
        />
      ),
      sortable: false,
    },
  ];
  
  // Use provided columns or default columns
  const tableColumns = columns || defaultColumns;
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <BookOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No classes found</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        There are no classes matching your criteria. Try adjusting your filters or search terms.
      </p>
    </div>
  );
  
  // Render loading skeleton for grid view
  const renderGridSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <ClassCard
          key={`skeleton-${index}`}
          classData={{} as ClassData}
          userRole={userRole}
          isLoading={true}
        />
      ))}
    </div>
  );
  
  // Render loading skeleton for table view
  const renderTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          {tableColumns.map((column) => (
            <TableHead key={column.id}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <TableRow key={`skeleton-row-${rowIndex}`}>
            {tableColumns.map((column) => (
              <TableCell key={`skeleton-cell-${column.id}-${rowIndex}`}>
                <Skeleton className="h-8 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
  
  // Render grid view
  const renderGridView = () => {
    if (isLoading) {
      return renderGridSkeleton();
    }
    
    if (classes.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classData) => (
          <ClassCard
            key={classData.id}
            classData={classData}
            userRole={userRole}
            actions={actions}
            onAction={onAction ? (action) => onAction(action, classData) : undefined}
          />
        ))}
      </div>
    );
  };
  
  // Render table view
  const renderTableView = () => {
    if (isLoading) {
      return renderTableSkeleton();
    }
    
    if (classes.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {tableColumns.map((column) => (
                <TableHead key={column.id}>
                  {column.sortable && sorting ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 -ml-2 font-medium"
                      onClick={() => {
                        const direction = 
                          sorting.column === column.id && sorting.direction === 'asc' 
                            ? 'desc' 
                            : 'asc';
                        sorting.onSortChange(column.id, direction);
                      }}
                    >
                      {column.header}
                      {sorting.column === column.id ? (
                        sorting.direction === 'asc' ? (
                          <SortAsc className="ml-2 h-4 w-4" />
                        ) : (
                          <SortDesc className="ml-2 h-4 w-4" />
                        )
                      ) : null}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((classData) => (
              <TableRow key={classData.id}>
                {tableColumns.map((column) => (
                  <TableCell key={`${classData.id}-${column.id}`}>
                    {column.cell 
                      ? column.cell(classData)
                      : column.accessorKey 
                        ? (classData as any)[column.accessorKey] 
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Render mobile view
  const renderMobileView = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (classes.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <div className="space-y-4">
        {classes.map((classData) => (
          <div key={classData.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{classData.name}</h3>
                <p className="text-sm text-muted-foreground">{classData.code}</p>
              </div>
              <Badge variant={
                classData.status === 'ACTIVE' ? 'success' :
                classData.status === 'UPCOMING' ? 'warning' :
                classData.status === 'COMPLETED' ? 'secondary' :
                'default'
              }>
                {classData.status.charAt(0) + classData.status.slice(1).toLowerCase()}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm mb-3">
              {classData.courseCampus?.course && (
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  {classData.courseCampus.course.name}
                </div>
              )}
              {classData._count?.students !== undefined && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  {classData._count.students} Students
                </div>
              )}
              {classData.term && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  {classData.term.name}
                </div>
              )}
              {classData.classTeacher?.user?.name && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  Teacher: {classData.classTeacher.user.name}
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action) => {
                    // Get base URL for actions based on user role
                    const getBaseUrl = () => {
                      switch (userRole) {
                        case UserRole.SYSTEM_ADMIN:
                          return `/admin/system/classes/${classData.id}`;
                        case UserRole.CAMPUS_ADMIN:
                          return `/admin/campus/classes/${classData.id}`;
                        case UserRole.COORDINATOR:
                          return `/admin/coordinator/classes/${classData.id}`;
                        case UserRole.TEACHER:
                          return `/teacher/classes/${classData.id}`;
                        case UserRole.STUDENT:
                          return `/student/classes/${classData.id}`;
                        default:
                          return `/classes/${classData.id}`;
                      }
                    };
                    
                    const actionUrl = `${getBaseUrl()}${action === ClassAction.VIEW ? '' : `/${action}`}`;
                    const actionLabel = action.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    
                    return (
                      <DropdownMenuItem 
                        key={action}
                        onClick={() => onAction && onAction(action, classData)}
                      >
                        <a href={actionUrl} className="flex items-center w-full">
                          {actionLabel}
                        </a>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (!pagination) return null;
    
    const { currentPage, totalPages, pageSize, totalItems, onPageChange } = pagination;
    
    // Calculate start and end item numbers
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} classes
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* View mode toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewModeChange('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleViewModeChange('table')}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">Table view</span>
          </Button>
        </div>
      </div>
      
      {/* Class list based on view mode */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'mobile' && renderMobileView()}
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default ClassList;
