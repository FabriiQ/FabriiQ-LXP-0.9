'use client';

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Badge } from '@/components/ui/core/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/core/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import { 
  Search, 
  Grid, 
  List, 
  SlidersHorizontal, 
  Plus, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  StudentData, 
  StudentStatus, 
  StudentAction, 
  StudentListViewMode, 
  UserRole 
} from './types';
import { StudentCard } from './StudentCard';
import { StudentActions } from './StudentActions';

export interface StudentListProps {
  /**
   * Array of student data
   */
  students: StudentData[];
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * View mode for the list
   * @default 'grid'
   */
  viewMode?: StudentListViewMode;
  
  /**
   * Whether to show filters
   * @default true
   */
  showFilters?: boolean;
  
  /**
   * Whether to show search
   * @default true
   */
  showSearch?: boolean;
  
  /**
   * Whether to show pagination
   * @default true
   */
  showPagination?: boolean;
  
  /**
   * Whether to show add button
   * @default true
   */
  showAddButton?: boolean;
  
  /**
   * Array of allowed actions
   */
  actions?: StudentAction[];
  
  /**
   * Action callback
   */
  onAction?: (action: StudentAction, student: StudentData) => void;
  
  /**
   * Add callback
   */
  onAdd?: () => void;
  
  /**
   * Filter change callback
   */
  onFilterChange?: (filters: any) => void;
  
  /**
   * Search callback
   */
  onSearch?: (searchTerm: string) => void;
  
  /**
   * Page change callback
   */
  onPageChange?: (page: number) => void;
  
  /**
   * Current page
   * @default 1
   */
  currentPage?: number;
  
  /**
   * Total pages
   * @default 1
   */
  totalPages?: number;
  
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentList component with mobile-first design
 * 
 * Features:
 * - Role-based rendering
 * - Multiple view modes (grid, table, mobile)
 * - Filtering and searching
 * - Pagination
 * 
 * @example
 * ```tsx
 * <StudentList 
 *   students={students}
 *   userRole={UserRole.TEACHER}
 *   actions={[StudentAction.VIEW, StudentAction.EDIT]}
 *   onAction={handleAction}
 * />
 * ```
 */
export const StudentList: React.FC<StudentListProps> = ({
  students,
  userRole,
  viewMode: initialViewMode = 'grid',
  showFilters = true,
  showSearch = true,
  showPagination = true,
  showAddButton = true,
  actions = [StudentAction.VIEW],
  onAction,
  onAdd,
  onFilterChange,
  onSearch,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  isLoading = false,
  error,
  className,
}) => {
  // State for view mode
  const [viewMode, setViewMode] = useState<StudentListViewMode>(initialViewMode);
  
  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [programFilter, setProgramFilter] = useState<string>('all');
  
  // State for showing filters
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format score for display
  const formatScore = (score?: number) => {
    if (score === undefined) return 'N/A';
    return `${score.toFixed(1)}%`;
  };
  
  // Get status badge variant
  const getStatusVariant = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.ACTIVE:
        return 'success';
      case StudentStatus.INACTIVE:
        return 'secondary';
      case StudentStatus.SUSPENDED:
        return 'destructive';
      case StudentStatus.GRADUATED:
        return 'default';
      case StudentStatus.WITHDRAWN:
        return 'outline';
      default:
        return 'secondary';
    }
  };
  
  // Get leaderboard trend icon
  const getLeaderboardTrendIcon = (change?: number) => {
    if (!change) return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };
  
  // Handle search
  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchTerm);
    }
  };
  
  // Handle filter change
  const handleFilterChange = () => {
    if (onFilterChange) {
      onFilterChange({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        program: programFilter !== 'all' ? programFilter : undefined,
      });
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };
  
  // Handle student action
  const handleStudentAction = (action: StudentAction, student: StudentData) => {
    if (onAction) {
      onAction(action, student);
    }
  };
  
  // Handle add student
  const handleAddStudent = () => {
    if (onAdd) {
      onAdd();
    }
  };
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Skeleton className="h-9 w-24" />
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // Render grid view
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No students found.
          </div>
        ) : (
          students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              viewMode="compact"
              userRole={userRole}
              actions={actions}
              onAction={handleStudentAction}
            />
          ))
        )}
      </div>
    );
  };
  
  // Render table view
  const renderTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">Student</th>
              <th className="text-left py-3 px-4 font-medium">Program</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Academic</th>
              <th className="text-left py-3 px-4 font-medium">Attendance</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.profileImage} alt={student.name} />
                        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.enrollmentNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {student.programName || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={getStatusVariant(student.status)}>
                      {student.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {formatScore(student.academicScore)}
                  </td>
                  <td className="py-3 px-4">
                    {formatScore(student.attendanceRate)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <StudentActions
                      student={student}
                      userRole={userRole}
                      enabledActions={actions}
                      onAction={handleStudentAction}
                      compact={true}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render mobile view
  const renderMobileView = () => {
    return (
      <div className="space-y-4">
        {students.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No students found.
          </div>
        ) : (
          students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              viewMode="mobile"
              userRole={userRole}
              actions={actions}
              onAction={handleStudentAction}
            />
          ))
        )}
      </div>
    );
  };
  
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Students</CardTitle>
              {students.length > 0 && (
                <CardDescription>{students.length} students found</CardDescription>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {showSearch && (
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search students..."
                    className="pl-8 w-full sm:w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => {
                        setSearchTerm('');
                        if (onSearch) onSearch('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              
              {showFilters && (
                <Button
                  variant={showFilterPanel ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              )}
              
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {showAddButton && userRole !== UserRole.STUDENT && userRole !== UserRole.TEACHER && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAddStudent}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Student
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {showFilterPanel && (
          <CardContent className="border-b pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(StudentStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Program</label>
                <Select
                  value={programFilter}
                  onValueChange={setProgramFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {/* This would be populated from API data */}
                    <SelectItem value="program1">Computer Science</SelectItem>
                    <SelectItem value="program2">Business Administration</SelectItem>
                    <SelectItem value="program3">Graphic Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:col-span-2 flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => {
                    setStatusFilter('all');
                    setProgramFilter('all');
                    if (onFilterChange) {
                      onFilterChange({});
                    }
                  }}
                >
                  Reset
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleFilterChange}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardContent>
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'mobile' && renderMobileView()}
        </CardContent>
        
        {showPagination && totalPages > 1 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default StudentList;
