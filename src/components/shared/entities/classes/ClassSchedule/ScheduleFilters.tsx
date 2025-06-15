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

export interface ScheduleFilterOption {
  id: string;
  name: string;
}

export interface ScheduleFiltersState {
  search?: string;
  type?: string;
  date?: Date;
  dateRange?: {
    from: Date;
    to: Date;
  };
  teacherId?: string;
  facilityId?: string;
}

export interface ScheduleFiltersProps {
  /**
   * Current filter state
   */
  filters: ScheduleFiltersState;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Available filters
   */
  availableFilters?: {
    types?: ScheduleFilterOption[];
    teachers?: ScheduleFilterOption[];
    facilities?: ScheduleFilterOption[];
  };
  
  /**
   * Filter change callback
   */
  onFilterChange: (filters: ScheduleFiltersState) => void;
  
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
 * ScheduleFilters component with mobile-first design
 * 
 * Features:
 * - Role-specific filter visibility
 * - Multiple layout options
 * - Filter chips for active filters
 * - Date range selection
 * 
 * @example
 * ```tsx
 * <ScheduleFilters 
 *   filters={filters}
 *   userRole={UserRole.TEACHER}
 *   availableFilters={{
 *     types: [{ id: 'lecture', name: 'Lecture' }],
 *     teachers: [{ id: 'teacher-1', name: 'John Doe' }],
 *     facilities: [{ id: 'facility-1', name: 'Room 101' }]
 *   }}
 *   onFilterChange={handleFilterChange}
 *   layout="horizontal"
 * />
 * ```
 */
export const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({
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
  const handleFilterChange = (key: keyof ScheduleFiltersState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };
  
  // Handle clear all filters
  const handleClearAllFilters = () => {
    onFilterChange({});
    setSearchValue('');
  };
  
  // Handle clear single filter
  const handleClearFilter = (key: keyof ScheduleFiltersState) => {
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
  const getFilterLabel = (key: keyof ScheduleFiltersState, value: any) => {
    switch (key) {
      case 'type':
        return `Type: ${availableFilters.types?.find(t => t.id === value)?.name || value}`;
      case 'teacherId':
        return `Teacher: ${availableFilters.teachers?.find(t => t.id === value)?.name || value}`;
      case 'facilityId':
        return `Facility: ${availableFilters.facilities?.find(f => f.id === value)?.name || value}`;
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
    
    // Teacher can see all filters except certain admin filters
    if (userRole === UserRole.TEACHER) {
      return filterKey !== 'teacherId';
    }
    
    // Student can only see date filters and type
    if (userRole === UserRole.STUDENT) {
      return ['date', 'dateRange', 'type'].includes(filterKey);
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
          placeholder="Search schedule..."
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
  
  // Render type filter
  const renderTypeFilter = () => (
    <div className="w-full">
      <Label htmlFor="type-filter" className="text-sm font-medium mb-1 block">
        Type
      </Label>
      <Select
        value={filters.type}
        onValueChange={(value) => handleFilterChange('type', value || undefined)}
        disabled={!availableFilters.types?.length}
      >
        <SelectTrigger id="type-filter" className="w-full">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Types</SelectItem>
          {availableFilters.types?.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
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
  
  // Render facility filter
  const renderFacilityFilter = () => (
    <div className="w-full">
      <Label htmlFor="facility-filter" className="text-sm font-medium mb-1 block">
        Facility
      </Label>
      <Select
        value={filters.facilityId}
        onValueChange={(value) => handleFilterChange('facilityId', value || undefined)}
        disabled={!availableFilters.facilities?.length}
      >
        <SelectTrigger id="facility-filter" className="w-full">
          <SelectValue placeholder="All Facilities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Facilities</SelectItem>
          {availableFilters.facilities?.map((facility) => (
            <SelectItem key={facility.id} value={facility.id}>
              {facility.name}
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
            {getFilterLabel(key as keyof ScheduleFiltersState, value)}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleClearFilter(key as keyof ScheduleFiltersState)}
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
        {/* Type filter */}
        {shouldShowFilter('type') && availableFilters.types && renderTypeFilter()}
        
        {/* Teacher filter */}
        {shouldShowFilter('teacherId') && availableFilters.teachers && renderTeacherFilter()}
        
        {/* Facility filter */}
        {shouldShowFilter('facilityId') && availableFilters.facilities && renderFacilityFilter()}
        
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
        {/* Type filter */}
        {shouldShowFilter('type') && availableFilters.types && renderTypeFilter()}
        
        {/* Teacher filter */}
        {shouldShowFilter('teacherId') && availableFilters.teachers && renderTeacherFilter()}
        
        {/* Facility filter */}
        {shouldShowFilter('facilityId') && availableFilters.facilities && renderFacilityFilter()}
        
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
              
              {/* Type filter */}
              {shouldShowFilter('type') && availableFilters.types && renderTypeFilter()}
              
              {/* Teacher filter */}
              {shouldShowFilter('teacherId') && availableFilters.teachers && renderTeacherFilter()}
              
              {/* Facility filter */}
              {shouldShowFilter('facilityId') && availableFilters.facilities && renderFacilityFilter()}
              
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

export default ScheduleFilters;
