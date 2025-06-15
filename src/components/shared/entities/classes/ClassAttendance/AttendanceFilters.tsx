'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { X, Filter, Search, CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '../types';
import { format } from 'date-fns';

export interface AttendanceFilterOption {
  id: string;
  name: string;
}

export interface AttendanceFiltersState {
  search?: string;
  status?: 'present' | 'absent' | 'excused' | 'all';
  studentId?: string;
  date?: Date;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface AttendanceFiltersProps {
  /**
   * Current filter state
   */
  filters: AttendanceFiltersState;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Available filters
   */
  availableFilters?: {
    students?: AttendanceFilterOption[];
  };
  
  /**
   * Filter change callback
   */
  onFilterChange: (filters: AttendanceFiltersState) => void;
  
  /**
   * Layout of the filters
   * @default 'horizontal'
   */
  layout?: 'horizontal' | 'vertical' | 'dropdown';
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * AttendanceFilters component with mobile-first design
 * 
 * Features:
 * - Role-specific filter visibility
 * - Multiple layout options
 * - Filter chips for active filters
 * - Clear filters functionality
 * - Date range selection
 * 
 * @example
 * ```tsx
 * <AttendanceFilters 
 *   filters={filters}
 *   userRole={UserRole.TEACHER}
 *   availableFilters={{
 *     students: [{ id: 'student-1', name: 'John Doe' }]
 *   }}
 *   onFilterChange={handleFilterChange}
 *   layout="horizontal"
 * />
 * ```
 */
export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  filters,
  userRole,
  availableFilters = {},
  onFilterChange,
  layout = 'horizontal',
  className,
}) => {
  // Local state for search input
  const [searchValue, setSearchValue] = useState(filters.search || '');
  
  // Update search value when filters change
  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchValue });
  };
  
  // Handle filter change
  const handleFilterChange = (key: keyof AttendanceFiltersState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  // Handle clear all filters
  const handleClearAllFilters = () => {
    onFilterChange({});
    setSearchValue('');
  };
  
  // Handle clear single filter
  const handleClearFilter = (key: keyof AttendanceFiltersState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFilterChange(newFilters);
    
    if (key === 'search') {
      setSearchValue('');
    }
  };
  
  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.keys(filters).length;
  };
  
  // Get filter label
  const getFilterLabel = (key: keyof AttendanceFiltersState, value: any) => {
    switch (key) {
      case 'status':
        return `Status: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
      case 'studentId':
        return `Student: ${availableFilters.students?.find(s => s.id === value)?.name || value}`;
      case 'date':
        return `Date: ${format(new Date(value), 'PP')}`;
      case 'dateRange':
        return `Date Range: ${format(new Date(value.from), 'PP')} - ${format(new Date(value.to), 'PP')}`;
      case 'search':
        return `Search: ${value}`;
      default:
        return `${key}: ${value}`;
    }
  };
  
  // Determine which filters to show based on user role
  const shouldShowFilter = (filterKey: string) => {
    // System admin, campus admin, and coordinator can see all filters
    if ([UserRole.SYSTEM_ADMIN, UserRole.CAMPUS_ADMIN, UserRole.COORDINATOR].includes(userRole)) {
      return true;
    }
    
    // Teacher can see all filters except certain student filters in some contexts
    if (userRole === UserRole.TEACHER) {
      return true;
    }
    
    // Student can only see date filters
    if (userRole === UserRole.STUDENT) {
      return ['date', 'dateRange'].includes(filterKey);
    }
    
    return false;
  };
  
  // Render search form
  const renderSearchForm = () => (
    <form onSubmit={handleSearchSubmit} className="flex w-full">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students..."
          className="pl-9 w-full"
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>
      <Button type="submit" variant="default" className="ml-2">
        Search
      </Button>
    </form>
  );
  
  // Render status filter
  const renderStatusFilter = () => (
    <div className="w-full">
      <Label htmlFor="status-filter" className="text-sm font-medium mb-1 block">
        Status
      </Label>
      <Select
        value={filters.status}
        onValueChange={(value) => handleFilterChange('status', value || undefined)}
      >
        <SelectTrigger id="status-filter" className="w-full">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="present">Present</SelectItem>
          <SelectItem value="absent">Absent</SelectItem>
          <SelectItem value="excused">Excused</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render student filter
  const renderStudentFilter = () => (
    <div className="w-full">
      <Label htmlFor="student-filter" className="text-sm font-medium mb-1 block">
        Student
      </Label>
      <Select
        value={filters.studentId}
        onValueChange={(value) => handleFilterChange('studentId', value || undefined)}
        disabled={!availableFilters.students?.length}
      >
        <SelectTrigger id="student-filter" className="w-full">
          <SelectValue placeholder="All Students" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Students</SelectItem>
          {availableFilters.students?.map((student) => (
            <SelectItem key={student.id} value={student.id}>
              {student.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render date filter
  const renderDateFilter = () => (
    <div className="w-full">
      <Label htmlFor="date-filter" className="text-sm font-medium mb-1 block">
        Date
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-filter"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !filters.date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.date ? format(filters.date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={filters.date}
            onSelect={(date) => handleFilterChange('date', date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
  
  // Render date range filter
  const renderDateRangeFilter = () => (
    <div className="w-full">
      <Label htmlFor="date-range-filter" className="text-sm font-medium mb-1 block">
        Date Range
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range-filter"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !filters.dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange?.from ? (
              filters.dateRange.to ? (
                <>
                  {format(filters.dateRange.from, 'LLL dd, y')} -{' '}
                  {format(filters.dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(filters.dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={filters.dateRange}
            onSelect={(range) => handleFilterChange('dateRange', range)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
  
  // Render active filter chips
  const renderActiveFilterChips = () => {
    const activeFilters = Object.entries(filters).filter(([_, value]) => value !== undefined);
    
    if (activeFilters.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {activeFilters.map(([key, value]) => (
          <Badge 
            key={key} 
            variant="outline"
            className="flex items-center gap-1 px-3 py-1"
          >
            {getFilterLabel(key as keyof AttendanceFiltersState, value)}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleClearFilter(key as keyof AttendanceFiltersState)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove filter</span>
            </Button>
          </Badge>
        ))}
        
        {activeFilters.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={handleClearAllFilters}
          >
            Clear all
          </Button>
        )}
      </div>
    );
  };
  
  // Render horizontal layout
  const renderHorizontalLayout = () => (
    <div className={cn("space-y-4", className)}>
      {/* Search form */}
      {shouldShowFilter('search') && (
        <div className="w-full">
          {renderSearchForm()}
        </div>
      )}
      
      {/* Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Status filter */}
        {shouldShowFilter('status') && renderStatusFilter()}
        
        {/* Student filter */}
        {shouldShowFilter('studentId') && availableFilters.students && renderStudentFilter()}
        
        {/* Date filter */}
        {shouldShowFilter('date') && renderDateFilter()}
        
        {/* Date range filter */}
        {shouldShowFilter('dateRange') && renderDateRangeFilter()}
      </div>
      
      {/* Active filter chips */}
      {renderActiveFilterChips()}
    </div>
  );
  
  // Render vertical layout
  const renderVerticalLayout = () => (
    <div className={cn("space-y-4", className)}>
      {/* Search form */}
      {shouldShowFilter('search') && (
        <div className="w-full">
          {renderSearchForm()}
        </div>
      )}
      
      {/* Filter controls */}
      <div className="space-y-4">
        {/* Status filter */}
        {shouldShowFilter('status') && renderStatusFilter()}
        
        {/* Student filter */}
        {shouldShowFilter('studentId') && availableFilters.students && renderStudentFilter()}
        
        {/* Date filter */}
        {shouldShowFilter('date') && renderDateFilter()}
        
        {/* Date range filter */}
        {shouldShowFilter('dateRange') && renderDateRangeFilter()}
      </div>
      
      {/* Active filter chips */}
      {renderActiveFilterChips()}
    </div>
  );
  
  // Render dropdown layout
  const renderDropdownLayout = () => (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search form */}
        {shouldShowFilter('search') && (
          <div className="flex-grow">
            {renderSearchForm()}
          </div>
        )}
        
        {/* Filter dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFilterCount()}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <h3 className="font-medium">Filters</h3>
              
              {/* Status filter */}
              {shouldShowFilter('status') && renderStatusFilter()}
              
              {/* Student filter */}
              {shouldShowFilter('studentId') && availableFilters.students && renderStudentFilter()}
              
              {/* Date filter */}
              {shouldShowFilter('date') && renderDateFilter()}
              
              {/* Date range filter */}
              {shouldShowFilter('dateRange') && renderDateRangeFilter()}
              
              {/* Clear all button */}
              {getActiveFilterCount() > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleClearAllFilters}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Active filter chips */}
      {renderActiveFilterChips()}
    </div>
  );
  
  // Render based on layout
  switch (layout) {
    case 'vertical':
      return renderVerticalLayout();
    case 'dropdown':
      return renderDropdownLayout();
    case 'horizontal':
    default:
      return renderHorizontalLayout();
  }
};

export default AttendanceFilters;
