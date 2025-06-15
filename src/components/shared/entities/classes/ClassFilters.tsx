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
import { X, Filter, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole, SystemStatus } from './types';

export interface FilterOption {
  id: string;
  name: string;
}

export interface ClassFiltersState {
  search?: string;
  status?: SystemStatus;
  termId?: string;
  programId?: string;
  courseId?: string;
  teacherId?: string;
  dayOfWeek?: string;
  timeOfDay?: string;
}

export interface ClassFiltersProps {
  /**
   * Current filter state
   */
  filters: ClassFiltersState;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Available filters
   */
  availableFilters?: {
    terms?: FilterOption[];
    programs?: FilterOption[];
    courses?: FilterOption[];
    teachers?: FilterOption[];
    daysOfWeek?: FilterOption[];
    timesOfDay?: FilterOption[];
  };
  
  /**
   * Filter change callback
   */
  onFilterChange: (filters: ClassFiltersState) => void;
  
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
 * ClassFilters component with mobile-first design
 * 
 * Features:
 * - Role-specific filter visibility
 * - Multiple layout options
 * - Filter chips for active filters
 * - Clear filters functionality
 * 
 * @example
 * ```tsx
 * <ClassFilters 
 *   filters={filters}
 *   userRole={UserRole.TEACHER}
 *   availableFilters={{
 *     terms: [{ id: 'term-1', name: 'Fall 2023' }],
 *     courses: [{ id: 'course-1', name: 'Programming Fundamentals' }]
 *   }}
 *   onFilterChange={handleFilterChange}
 *   layout="horizontal"
 * />
 * ```
 */
export const ClassFilters: React.FC<ClassFiltersProps> = ({
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
  const handleFilterChange = (key: keyof ClassFiltersState, value: string | undefined) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  // Handle clear all filters
  const handleClearAllFilters = () => {
    onFilterChange({});
    setSearchValue('');
  };
  
  // Handle clear single filter
  const handleClearFilter = (key: keyof ClassFiltersState) => {
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
  const getFilterLabel = (key: keyof ClassFiltersState, value: string) => {
    switch (key) {
      case 'status':
        return `Status: ${value.charAt(0) + value.slice(1).toLowerCase()}`;
      case 'termId':
        return `Term: ${availableFilters.terms?.find(t => t.id === value)?.name || value}`;
      case 'programId':
        return `Program: ${availableFilters.programs?.find(p => p.id === value)?.name || value}`;
      case 'courseId':
        return `Course: ${availableFilters.courses?.find(c => c.id === value)?.name || value}`;
      case 'teacherId':
        return `Teacher: ${availableFilters.teachers?.find(t => t.id === value)?.name || value}`;
      case 'dayOfWeek':
        return `Day: ${availableFilters.daysOfWeek?.find(d => d.id === value)?.name || value}`;
      case 'timeOfDay':
        return `Time: ${availableFilters.timesOfDay?.find(t => t.id === value)?.name || value}`;
      case 'search':
        return `Search: ${value}`;
      default:
        return `${key}: ${value}`;
    }
  };
  
  // Determine which filters to show based on user role
  const shouldShowFilter = (filterKey: keyof typeof availableFilters) => {
    // System admin can see all filters
    if (userRole === UserRole.SYSTEM_ADMIN) return true;
    
    // Campus admin can see all filters except system-wide ones
    if (userRole === UserRole.CAMPUS_ADMIN) {
      return true;
    }
    
    // Coordinator can see program, course, teacher, term filters
    if (userRole === UserRole.COORDINATOR) {
      return ['terms', 'courses', 'teachers'].includes(filterKey);
    }
    
    // Teacher can see term, course filters
    if (userRole === UserRole.TEACHER) {
      return ['terms', 'courses'].includes(filterKey);
    }
    
    // Student can see term, course filters
    if (userRole === UserRole.STUDENT) {
      return ['terms', 'courses'].includes(filterKey);
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
          placeholder="Search classes..."
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
          <SelectItem value="">All Statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="UPCOMING">Upcoming</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render term filter
  const renderTermFilter = () => (
    <div className="w-full">
      <Label htmlFor="term-filter" className="text-sm font-medium mb-1 block">
        Term
      </Label>
      <Select
        value={filters.termId}
        onValueChange={(value) => handleFilterChange('termId', value || undefined)}
        disabled={!availableFilters.terms?.length}
      >
        <SelectTrigger id="term-filter" className="w-full">
          <SelectValue placeholder="All Terms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Terms</SelectItem>
          {availableFilters.terms?.map((term) => (
            <SelectItem key={term.id} value={term.id}>
              {term.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render program filter
  const renderProgramFilter = () => (
    <div className="w-full">
      <Label htmlFor="program-filter" className="text-sm font-medium mb-1 block">
        Program
      </Label>
      <Select
        value={filters.programId}
        onValueChange={(value) => handleFilterChange('programId', value || undefined)}
        disabled={!availableFilters.programs?.length}
      >
        <SelectTrigger id="program-filter" className="w-full">
          <SelectValue placeholder="All Programs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Programs</SelectItem>
          {availableFilters.programs?.map((program) => (
            <SelectItem key={program.id} value={program.id}>
              {program.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render course filter
  const renderCourseFilter = () => (
    <div className="w-full">
      <Label htmlFor="course-filter" className="text-sm font-medium mb-1 block">
        Course
      </Label>
      <Select
        value={filters.courseId}
        onValueChange={(value) => handleFilterChange('courseId', value || undefined)}
        disabled={!availableFilters.courses?.length}
      >
        <SelectTrigger id="course-filter" className="w-full">
          <SelectValue placeholder="All Courses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Courses</SelectItem>
          {availableFilters.courses?.map((course) => (
            <SelectItem key={course.id} value={course.id}>
              {course.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render teacher filter
  const renderTeacherFilter = () => (
    <div className="w-full">
      <Label htmlFor="teacher-filter" className="text-sm font-medium mb-1 block">
        Teacher
      </Label>
      <Select
        value={filters.teacherId}
        onValueChange={(value) => handleFilterChange('teacherId', value || undefined)}
        disabled={!availableFilters.teachers?.length}
      >
        <SelectTrigger id="teacher-filter" className="w-full">
          <SelectValue placeholder="All Teachers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Teachers</SelectItem>
          {availableFilters.teachers?.map((teacher) => (
            <SelectItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render day of week filter
  const renderDayOfWeekFilter = () => (
    <div className="w-full">
      <Label htmlFor="day-filter" className="text-sm font-medium mb-1 block">
        Day of Week
      </Label>
      <Select
        value={filters.dayOfWeek}
        onValueChange={(value) => handleFilterChange('dayOfWeek', value || undefined)}
        disabled={!availableFilters.daysOfWeek?.length}
      >
        <SelectTrigger id="day-filter" className="w-full">
          <SelectValue placeholder="All Days" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Days</SelectItem>
          {availableFilters.daysOfWeek?.map((day) => (
            <SelectItem key={day.id} value={day.id}>
              {day.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render time of day filter
  const renderTimeOfDayFilter = () => (
    <div className="w-full">
      <Label htmlFor="time-filter" className="text-sm font-medium mb-1 block">
        Time of Day
      </Label>
      <Select
        value={filters.timeOfDay}
        onValueChange={(value) => handleFilterChange('timeOfDay', value || undefined)}
        disabled={!availableFilters.timesOfDay?.length}
      >
        <SelectTrigger id="time-filter" className="w-full">
          <SelectValue placeholder="All Times" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Times</SelectItem>
          {availableFilters.timesOfDay?.map((time) => (
            <SelectItem key={time.id} value={time.id}>
              {time.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
            {getFilterLabel(key as keyof ClassFiltersState, value as string)}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleClearFilter(key as keyof ClassFiltersState)}
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
      <div className="w-full">
        {renderSearchForm()}
      </div>
      
      {/* Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Status filter */}
        {renderStatusFilter()}
        
        {/* Term filter */}
        {shouldShowFilter('terms') && availableFilters.terms && renderTermFilter()}
        
        {/* Program filter */}
        {shouldShowFilter('programs') && availableFilters.programs && renderProgramFilter()}
        
        {/* Course filter */}
        {shouldShowFilter('courses') && availableFilters.courses && renderCourseFilter()}
        
        {/* Teacher filter */}
        {shouldShowFilter('teachers') && availableFilters.teachers && renderTeacherFilter()}
        
        {/* Day of week filter */}
        {shouldShowFilter('daysOfWeek') && availableFilters.daysOfWeek && renderDayOfWeekFilter()}
        
        {/* Time of day filter */}
        {shouldShowFilter('timesOfDay') && availableFilters.timesOfDay && renderTimeOfDayFilter()}
      </div>
      
      {/* Active filter chips */}
      {renderActiveFilterChips()}
    </div>
  );
  
  // Render vertical layout
  const renderVerticalLayout = () => (
    <div className={cn("space-y-4", className)}>
      {/* Search form */}
      <div className="w-full">
        {renderSearchForm()}
      </div>
      
      {/* Filter controls */}
      <div className="space-y-4">
        {/* Status filter */}
        {renderStatusFilter()}
        
        {/* Term filter */}
        {shouldShowFilter('terms') && availableFilters.terms && renderTermFilter()}
        
        {/* Program filter */}
        {shouldShowFilter('programs') && availableFilters.programs && renderProgramFilter()}
        
        {/* Course filter */}
        {shouldShowFilter('courses') && availableFilters.courses && renderCourseFilter()}
        
        {/* Teacher filter */}
        {shouldShowFilter('teachers') && availableFilters.teachers && renderTeacherFilter()}
        
        {/* Day of week filter */}
        {shouldShowFilter('daysOfWeek') && availableFilters.daysOfWeek && renderDayOfWeekFilter()}
        
        {/* Time of day filter */}
        {shouldShowFilter('timesOfDay') && availableFilters.timesOfDay && renderTimeOfDayFilter()}
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
        <div className="flex-grow">
          {renderSearchForm()}
        </div>
        
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
              {renderStatusFilter()}
              
              {/* Term filter */}
              {shouldShowFilter('terms') && availableFilters.terms && renderTermFilter()}
              
              {/* Program filter */}
              {shouldShowFilter('programs') && availableFilters.programs && renderProgramFilter()}
              
              {/* Course filter */}
              {shouldShowFilter('courses') && availableFilters.courses && renderCourseFilter()}
              
              {/* Teacher filter */}
              {shouldShowFilter('teachers') && availableFilters.teachers && renderTeacherFilter()}
              
              {/* Day of week filter */}
              {shouldShowFilter('daysOfWeek') && availableFilters.daysOfWeek && renderDayOfWeekFilter()}
              
              {/* Time of day filter */}
              {shouldShowFilter('timesOfDay') && availableFilters.timesOfDay && renderTimeOfDayFilter()}
              
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

export default ClassFilters;
