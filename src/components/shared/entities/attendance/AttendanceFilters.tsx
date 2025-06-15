'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
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
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search, 
  X, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths } from 'date-fns';
import { 
  UserRole, 
  AttendanceStatus, 
  AttendanceFilterOptions 
} from './types';

export interface AttendanceFiltersProps {
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Initial filter values
   */
  initialFilters?: AttendanceFilterOptions;
  
  /**
   * Filter change callback
   */
  onFilterChange: (filters: AttendanceFilterOptions) => void;
  
  /**
   * Available classes for filtering
   */
  availableClasses?: { id: string; name: string }[];
  
  /**
   * Available programs for filtering
   */
  availablePrograms?: { id: string; name: string }[];
  
  /**
   * Available students for filtering
   */
  availableStudents?: { id: string; name: string }[];
  
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
 * AttendanceFilters component with mobile-first design
 * 
 * Features:
 * - Date range filter
 * - Status filter
 * - Class filter
 * - Program filter
 * - Student filter
 * - Role-based filter visibility
 * 
 * @example
 * ```tsx
 * <AttendanceFilters 
 *   userRole={UserRole.TEACHER}
 *   initialFilters={{ status: [AttendanceStatus.PRESENT] }}
 *   onFilterChange={handleFilterChange}
 *   availableClasses={classes}
 * />
 * ```
 */
export const AttendanceFilters: React.FC<AttendanceFiltersProps> = ({
  userRole,
  initialFilters = {},
  onFilterChange,
  availableClasses = [],
  availablePrograms = [],
  availableStudents = [],
  showCard = true,
  className,
}) => {
  // State for filters
  const [filters, setFilters] = useState<AttendanceFilterOptions>(initialFilters);
  
  // State for search terms
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [programSearchTerm, setProgramSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  
  // State for date range picker
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.dateRange?.start
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.dateRange?.end
  );
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  
  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  // Handle status filter change
  const handleStatusChange = (status: AttendanceStatus, checked: boolean) => {
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
  
  // Handle student filter change
  const handleStudentChange = (studentId: string, checked: boolean) => {
    const currentStudents = filters.students || [];
    
    if (checked) {
      setFilters({
        ...filters,
        students: [...currentStudents, studentId],
      });
    } else {
      setFilters({
        ...filters,
        students: currentStudents.filter(s => s !== studentId),
      });
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      setFilters({
        ...filters,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });
    }
  };
  
  // Handle search term change
  const handleSearchTermChange = (term: string) => {
    setFilters({
      ...filters,
      searchTerm: term,
    });
  };
  
  // Handle quick date range selection
  const handleQuickDateRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    
    setStartDate(start);
    setEndDate(end);
    
    setFilters({
      ...filters,
      dateRange: {
        start,
        end,
      },
    });
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setStartDate(undefined);
    setEndDate(undefined);
    setClassSearchTerm('');
    setProgramSearchTerm('');
    setStudentSearchTerm('');
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };
  
  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.status?.length) count += filters.status.length;
    if (filters.classes?.length) count += filters.classes.length;
    if (filters.programs?.length) count += filters.programs.length;
    if (filters.students?.length) count += filters.students.length;
    if (filters.dateRange) count += 1;
    if (filters.searchTerm) count += 1;
    return count;
  };
  
  // Remove a specific filter
  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'status':
        handleStatusChange(value as AttendanceStatus, false);
        break;
      case 'class':
        handleClassChange(value, false);
        break;
      case 'program':
        handleProgramChange(value, false);
        break;
      case 'student':
        handleStudentChange(value, false);
        break;
      case 'dateRange':
        setStartDate(undefined);
        setEndDate(undefined);
        const { dateRange, ...restFilters } = filters;
        setFilters(restFilters);
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
  const filteredClasses = availableClasses.filter(c => 
    c.name.toLowerCase().includes(classSearchTerm.toLowerCase())
  );
  
  const filteredPrograms = availablePrograms.filter(p => 
    p.name.toLowerCase().includes(programSearchTerm.toLowerCase())
  );
  
  const filteredStudents = availableStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );
  
  // Determine which filters to show based on user role
  const showClassFilter = userRole !== UserRole.STUDENT && availableClasses.length > 0;
  const showProgramFilter = (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && availablePrograms.length > 0;
  const showStudentFilter = userRole !== UserRole.STUDENT && availableStudents.length > 0;
  
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
              placeholder="Search attendance records..."
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
          {/* Date range filter */}
          <AccordionItem value="dateRange">
            <AccordionTrigger className="text-sm font-medium">
              Date Range
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
                
                <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateRange(6)}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickDateRange(29)}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      setStartDate(firstDayOfMonth);
                      setEndDate(today);
                      setFilters({
                        ...filters,
                        dateRange: {
                          start: firstDayOfMonth,
                          end: today,
                        },
                      });
                    }}
                  >
                    This Month
                  </Button>
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
          
          {/* Status filter */}
          <AccordionItem value="status">
            <AccordionTrigger className="text-sm font-medium">
              Status
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(AttendanceStatus).map((status) => (
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
          
          {/* Class filter */}
          {showClassFilter && (
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
          
          {/* Program filter */}
          {showProgramFilter && (
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
          
          {/* Student filter */}
          {showStudentFilter && (
            <AccordionItem value="student">
              <AccordionTrigger className="text-sm font-medium">
                Student
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="pl-8 mb-2"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                    />
                    {studentSearchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setStudentSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredStudents.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        No students found
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={filters.students?.includes(student.id) || false}
                            onCheckedChange={(checked) => 
                              handleStudentChange(student.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`student-${student.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {student.name}
                          </Label>
                        </div>
                      ))
                    )}
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
              
              {filters.students?.map(studentId => {
                const student = availableStudents.find(s => s.id === studentId);
                return student ? (
                  <Badge key={`student-${studentId}`} variant="secondary" className="flex items-center gap-1">
                    {student.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter('student', studentId)}
                    />
                  </Badge>
                ) : null;
              })}
              
              {filters.dateRange && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {format(filters.dateRange.start, 'MMM d, yyyy')} - {format(filters.dateRange.end, 'MMM d, yyyy')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('dateRange', '')}
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
          <CardTitle className="text-lg">Filter Attendance</CardTitle>
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

export default AttendanceFilters;
