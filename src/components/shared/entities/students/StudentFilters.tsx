'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Label } from '@/components/ui/core/label';
import { Checkbox } from '@/components/ui/core/checkbox';
import { Badge } from '@/components/ui/core/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/core/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import { Calendar } from '@/components/ui/core/calendar';
import { Slider } from '@/components/ui/core/slider';
import { 
  Check, 
  Filter, 
  Search, 
  X, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  StudentStatus, 
  StudentFilterOptions, 
  UserRole 
} from './types';

export interface StudentFiltersProps {
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Initial filter values
   */
  initialFilters?: StudentFilterOptions;
  
  /**
   * Filter change callback
   */
  onFilterChange: (filters: StudentFilterOptions) => void;
  
  /**
   * Available programs for filtering
   */
  availablePrograms?: { id: string; name: string }[];
  
  /**
   * Available classes for filtering
   */
  availableClasses?: { id: string; name: string }[];
  
  /**
   * Available campuses for filtering
   */
  availableCampuses?: { id: string; name: string }[];
  
  /**
   * Whether to show the filter in a card
   * @default true
   */
  showCard?: boolean;
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * StudentFilters component with mobile-first design
 * 
 * Features:
 * - Status filter
 * - Program filter
 * - Class filter
 * - Campus filter
 * - Date range filter
 * - Performance range filter
 * - Attendance range filter
 * 
 * @example
 * ```tsx
 * <StudentFilters 
 *   userRole={UserRole.TEACHER}
 *   initialFilters={{ status: [StudentStatus.ACTIVE] }}
 *   onFilterChange={handleFilterChange}
 *   availablePrograms={programs}
 * />
 * ```
 */
export const StudentFilters: React.FC<StudentFiltersProps> = ({
  userRole,
  initialFilters = {},
  onFilterChange,
  availablePrograms = [],
  availableClasses = [],
  availableCampuses = [],
  showCard = true,
  className,
}) => {
  // State for filters
  const [filters, setFilters] = useState<StudentFilterOptions>(initialFilters);
  
  // State for search terms
  const [programSearchTerm, setProgramSearchTerm] = useState('');
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [campusSearchTerm, setCampusSearchTerm] = useState('');
  
  // State for date range picker
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.joinDateRange?.start
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.joinDateRange?.end
  );
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  
  // State for performance range
  const [performanceRange, setPerformanceRange] = useState<[number, number]>([
    filters.performanceRange?.min || 0,
    filters.performanceRange?.max || 100,
  ]);
  
  // State for attendance range
  const [attendanceRange, setAttendanceRange] = useState<[number, number]>([
    filters.attendanceRange?.min || 0,
    filters.attendanceRange?.max || 100,
  ]);
  
  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  // Handle status filter change
  const handleStatusChange = (status: StudentStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    
    if (checked) {
      setFilters({
        ...filters,
        status: [...currentStatuses, status],
      });
    } else {
      setFilters({
        ...filters,
        status: currentStatuses.filter(s => s !== status),
      });
    }
  };
  
  // Handle program filter change
  const handleProgramChange = (programId: string, checked: boolean) => {
    const currentPrograms = filters.programs || [];
    
    if (checked) {
      setFilters({
        ...filters,
        programs: [...currentPrograms, programId],
      });
    } else {
      setFilters({
        ...filters,
        programs: currentPrograms.filter(p => p !== programId),
      });
    }
  };
  
  // Handle class filter change
  const handleClassChange = (classId: string, checked: boolean) => {
    const currentClasses = filters.classes || [];
    
    if (checked) {
      setFilters({
        ...filters,
        classes: [...currentClasses, classId],
      });
    } else {
      setFilters({
        ...filters,
        classes: currentClasses.filter(c => c !== classId),
      });
    }
  };
  
  // Handle campus filter change
  const handleCampusChange = (campusId: string, checked: boolean) => {
    const currentCampuses = filters.campuses || [];
    
    if (checked) {
      setFilters({
        ...filters,
        campuses: [...currentCampuses, campusId],
      });
    } else {
      setFilters({
        ...filters,
        campuses: currentCampuses.filter(c => c !== campusId),
      });
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      setFilters({
        ...filters,
        joinDateRange: {
          start: startDate,
          end: endDate,
        },
      });
    }
  };
  
  // Handle performance range change
  const handlePerformanceRangeChange = (value: [number, number]) => {
    setPerformanceRange(value);
    setFilters({
      ...filters,
      performanceRange: {
        min: value[0],
        max: value[1],
      },
    });
  };
  
  // Handle attendance range change
  const handleAttendanceRangeChange = (value: [number, number]) => {
    setAttendanceRange(value);
    setFilters({
      ...filters,
      attendanceRange: {
        min: value[0],
        max: value[1],
      },
    });
  };
  
  // Handle search term change
  const handleSearchTermChange = (term: string) => {
    setFilters({
      ...filters,
      searchTerm: term || undefined,
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setStartDate(undefined);
    setEndDate(undefined);
    setProgramSearchTerm('');
    setClassSearchTerm('');
    setCampusSearchTerm('');
    setPerformanceRange([0, 100]);
    setAttendanceRange([0, 100]);
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };
  
  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.status?.length) count += filters.status.length;
    if (filters.programs?.length) count += filters.programs.length;
    if (filters.classes?.length) count += filters.classes.length;
    if (filters.campuses?.length) count += filters.campuses.length;
    if (filters.joinDateRange) count += 1;
    if (filters.performanceRange) count += 1;
    if (filters.attendanceRange) count += 1;
    if (filters.searchTerm) count += 1;
    return count;
  };
  
  // Remove a specific filter
  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'status':
        handleStatusChange(value as StudentStatus, false);
        break;
      case 'program':
        handleProgramChange(value, false);
        break;
      case 'class':
        handleClassChange(value, false);
        break;
      case 'campus':
        handleCampusChange(value, false);
        break;
      case 'joinDateRange':
        setStartDate(undefined);
        setEndDate(undefined);
        const { joinDateRange, ...restFilters } = filters;
        setFilters(restFilters);
        break;
      case 'performanceRange':
        setPerformanceRange([0, 100]);
        const { performanceRange, ...restFilters2 } = filters;
        setFilters(restFilters2);
        break;
      case 'attendanceRange':
        setAttendanceRange([0, 100]);
        const { attendanceRange, ...restFilters3 } = filters;
        setFilters(restFilters3);
        break;
      case 'searchTerm':
        setFilters({
          ...filters,
          searchTerm: undefined,
        });
        break;
    }
  };
  
  // Filter available entities based on search terms
  const filteredPrograms = availablePrograms.filter(p => 
    p.name.toLowerCase().includes(programSearchTerm.toLowerCase())
  );
  
  const filteredClasses = availableClasses.filter(c => 
    c.name.toLowerCase().includes(classSearchTerm.toLowerCase())
  );
  
  const filteredCampuses = availableCampuses.filter(c => 
    c.name.toLowerCase().includes(campusSearchTerm.toLowerCase())
  );
  
  // Determine which filters to show based on user role
  const showProgramFilter = userRole !== UserRole.STUDENT;
  const showClassFilter = userRole !== UserRole.STUDENT;
  const showCampusFilter = userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN;
  const showPerformanceFilter = userRole !== UserRole.STUDENT;
  const showAttendanceFilter = userRole !== UserRole.STUDENT;
  
  const filtersContent = (
    <div className={className}>
      <div className="space-y-4">
        {/* Search filter */}
        <div className="space-y-2">
          <Label htmlFor="search-filter">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-filter"
              type="search"
              placeholder="Search students..."
              className="pl-8"
              value={filters.searchTerm || ''}
              onChange={(e) => handleSearchTermChange(e.target.value)}
            />
            {filters.searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => handleSearchTermChange('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          {/* Status filter */}
          <AccordionItem value="status">
            <AccordionTrigger className="text-sm font-medium">
              Status
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(StudentStatus).map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status?.includes(status) || false}
                      onCheckedChange={(checked) => 
                        handleStatusChange(status, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`status-${status}`}
                      className="text-sm cursor-pointer"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Program filter */}
          {showProgramFilter && availablePrograms.length > 0 && (
            <AccordionItem value="program">
              <AccordionTrigger className="text-sm font-medium">
                Program
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search programs..."
                      className="pl-8 mb-2"
                      value={programSearchTerm}
                      onChange={(e) => setProgramSearchTerm(e.target.value)}
                    />
                    {programSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setProgramSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredPrograms.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        No programs found
                      </div>
                    ) : (
                      filteredPrograms.map((program) => (
                        <div key={program.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`program-${program.id}`}
                            checked={filters.programs?.includes(program.id) || false}
                            onCheckedChange={(checked) => 
                              handleProgramChange(program.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`program-${program.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {program.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Class filter */}
          {showClassFilter && availableClasses.length > 0 && (
            <AccordionItem value="class">
              <AccordionTrigger className="text-sm font-medium">
                Class
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search classes..."
                      className="pl-8 mb-2"
                      value={classSearchTerm}
                      onChange={(e) => setClassSearchTerm(e.target.value)}
                    />
                    {classSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setClassSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredClasses.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        No classes found
                      </div>
                    ) : (
                      filteredClasses.map((cls) => (
                        <div key={cls.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${cls.id}`}
                            checked={filters.classes?.includes(cls.id) || false}
                            onCheckedChange={(checked) => 
                              handleClassChange(cls.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`class-${cls.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {cls.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Campus filter */}
          {showCampusFilter && availableCampuses.length > 0 && (
            <AccordionItem value="campus">
              <AccordionTrigger className="text-sm font-medium">
                Campus
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search campuses..."
                      className="pl-8 mb-2"
                      value={campusSearchTerm}
                      onChange={(e) => setCampusSearchTerm(e.target.value)}
                    />
                    {campusSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setCampusSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredCampuses.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        No campuses found
                      </div>
                    ) : (
                      filteredCampuses.map((campus) => (
                        <div key={campus.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`campus-${campus.id}`}
                            checked={filters.campuses?.includes(campus.id) || false}
                            onCheckedChange={(checked) => 
                              handleCampusChange(campus.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`campus-${campus.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {campus.name}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Join date range filter */}
          <AccordionItem value="joinDateRange">
            <AccordionTrigger className="text-sm font-medium">
              Join Date Range
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-sm">
                    Start Date
                  </Label>
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="startDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setIsStartDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="endDate" className="text-sm">
                    End Date
                  </Label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="endDate"
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setIsEndDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDateRangeChange}
                  disabled={!startDate || !endDate}
                  className="col-span-1 sm:col-span-2"
                >
                  Apply Date Range
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Performance range filter */}
          {showPerformanceFilter && (
            <AccordionItem value="performanceRange">
              <AccordionTrigger className="text-sm font-medium">
                Performance Range
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 px-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Min: {performanceRange[0]}%</span>
                      <span>Max: {performanceRange[1]}%</span>
                    </div>
                    <Slider
                      value={performanceRange}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handlePerformanceRangeChange}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Attendance range filter */}
          {showAttendanceFilter && (
            <AccordionItem value="attendanceRange">
              <AccordionTrigger className="text-sm font-medium">
                Attendance Range
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 px-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Min: {attendanceRange[0]}%</span>
                      <span>Max: {attendanceRange[1]}%</span>
                    </div>
                    <Slider
                      value={attendanceRange}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleAttendanceRangeChange}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
        
        {/* Active filters display */}
        {countActiveFilters() > 0 && (
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <Filter className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.status?.map(status => (
                <Badge key={`status-${status}`} variant="secondary" className="flex items-center gap-1">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('status', status)}
                  />
                </Badge>
              ))}
              
              {filters.programs?.map(programId => {
                const program = availablePrograms.find(p => p.id === programId);
                return program ? (
                  <Badge key={`program-${programId}`} variant="secondary" className="flex items-center gap-1">
                    {program.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('program', programId)}
                    />
                  </Badge>
                ) : null;
              })}
              
              {filters.classes?.map(classId => {
                const cls = availableClasses.find(c => c.id === classId);
                return cls ? (
                  <Badge key={`class-${classId}`} variant="secondary" className="flex items-center gap-1">
                    {cls.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('class', classId)}
                    />
                  </Badge>
                ) : null;
              })}
              
              {filters.campuses?.map(campusId => {
                const campus = availableCampuses.find(c => c.id === campusId);
                return campus ? (
                  <Badge key={`campus-${campusId}`} variant="secondary" className="flex items-center gap-1">
                    {campus.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('campus', campusId)}
                    />
                  </Badge>
                ) : null;
              })}
              
              {filters.joinDateRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Join: {format(filters.joinDateRange.start, 'MMM d, yyyy')} - {format(filters.joinDateRange.end, 'MMM d, yyyy')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('joinDateRange', '')}
                  />
                </Badge>
              )}
              
              {filters.performanceRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Performance: {filters.performanceRange.min}% - {filters.performanceRange.max}%
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('performanceRange', '')}
                  />
                </Badge>
              )}
              
              {filters.attendanceRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Attendance: {filters.attendanceRange.min}% - {filters.attendanceRange.max}%
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('attendanceRange', '')}
                  />
                </Badge>
              )}
              
              {filters.searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: {filters.searchTerm}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('searchTerm', '')}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={applyFilters}
            className="flex items-center gap-1"
          >
            <Check className="h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
  
  // If showCard is true, wrap the filters in a card
  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Filter Students</CardTitle>
        </CardHeader>
        <CardContent>
          {filtersContent}
        </CardContent>
      </Card>
    );
  }
  
  // Otherwise, just return the filters
  return filtersContent;
};

export default StudentFilters;
