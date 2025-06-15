import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/core/card';
import { Input } from '@/components/ui/core/input';
import { Button } from '@/components/ui/core/button';
import { Label } from '@/components/ui/core/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
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
import { Checkbox } from '@/components/ui/core/checkbox';
import { Badge } from '@/components/ui/core/badge';
import { Calendar } from '@/components/ui/core/calendar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/core/tooltip';
import {
  ProgramFilter,
  ProgramSortField,
  UserRole,
  SystemStatus
} from './types';
import { Search, Filter, X, Calendar as CalendarIcon, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface ProgramFiltersProps {
  userRole: UserRole;
  initialFilters?: ProgramFilter;
  onFilterChange: (filters: ProgramFilter) => void;
  institutions?: { id: string; name: string }[];
  campuses?: { id: string; name: string }[];
  compact?: boolean;
  className?: string;
}

/**
 * ProgramFilters component
 *
 * Provides filtering controls for program lists.
 * Adapts based on the user's role and the compact mode.
 */
const ProgramFilters: React.FC<ProgramFiltersProps> = ({
  userRole,
  initialFilters = {},
  onFilterChange,
  institutions = [],
  campuses = [],
  compact = false,
  className
}) => {
  // State for filters
  const [filters, setFilters] = useState<ProgramFilter>(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  // Handle institution selection change
  const handleInstitutionChange = (institutionIds: string[]) => {
    setFilters(prev => ({ ...prev, institutionIds }));
  };

  // Handle campus selection change
  const handleCampusChange = (campusIds: string[]) => {
    setFilters(prev => ({ ...prev, campusIds }));
  };

  // Handle status selection change
  const handleStatusChange = (status: SystemStatus[]) => {
    setFilters(prev => ({ ...prev, status }));
  };

  // Handle sort change
  const handleSortChange = (field: ProgramSortField) => {
    const sortOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder }));
  };

  // Handle date range change
  const handleStartDateFromChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, startDateFrom: date }));
  };

  const handleStartDateToChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, startDateTo: date }));
  };

  const handleEndDateFromChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, endDateFrom: date }));
  };

  const handleEndDateToChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, endDateTo: date }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setIsFilterOpen(false);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.institutionIds && filters.institutionIds.length > 0) count++;
    if (filters.campusIds && filters.campusIds.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.startDateFrom || filters.startDateTo) count++;
    if (filters.endDateFrom || filters.endDateTo) count++;
    return count;
  };

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    return typeof date === 'string'
      ? format(new Date(date), 'MMM d, yyyy')
      : format(date, 'MMM d, yyyy');
  };

  // Render compact filter view
  if (compact) {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search programs..."
              className="pl-8"
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="h-4 w-4" />
                {getActiveFilterCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>

                {/* Institution filter (for System Admin only) */}
                {userRole === UserRole.SYSTEM_ADMIN && institutions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {institutions.slice(0, 4).map(institution => (
                        <div key={institution.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`institution-${institution.id}`}
                            checked={(filters.institutionIds || []).includes(institution.id)}
                            onCheckedChange={(checked) => {
                              const newInstitutionIds = [...(filters.institutionIds || [])];
                              if (checked) {
                                newInstitutionIds.push(institution.id);
                              } else {
                                const index = newInstitutionIds.indexOf(institution.id);
                                if (index !== -1) newInstitutionIds.splice(index, 1);
                              }
                              handleInstitutionChange(newInstitutionIds);
                            }}
                          />
                          <Label htmlFor={`institution-${institution.id}`} className="text-sm">
                            {institution.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {institutions.length > 4 && (
                      <Button variant="link" size="sm" className="h-auto p-0">
                        Show more
                      </Button>
                    )}
                  </div>
                )}

                {/* Campus filter */}
                {(userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && campuses.length > 0 && (
                  <div className="space-y-2">
                    <Label>Campus</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {campuses.slice(0, 4).map(campus => (
                        <div key={campus.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`campus-${campus.id}`}
                            checked={(filters.campusIds || []).includes(campus.id)}
                            onCheckedChange={(checked) => {
                              const newCampusIds = [...(filters.campusIds || [])];
                              if (checked) {
                                newCampusIds.push(campus.id);
                              } else {
                                const index = newCampusIds.indexOf(campus.id);
                                if (index !== -1) newCampusIds.splice(index, 1);
                              }
                              handleCampusChange(newCampusIds);
                            }}
                          />
                          <Label htmlFor={`campus-${campus.id}`} className="text-sm">
                            {campus.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {campuses.length > 4 && (
                      <Button variant="link" size="sm" className="h-auto p-0">
                        Show more
                      </Button>
                    )}
                  </div>
                )}

                {/* Status filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(SystemStatus).filter(status =>
                      status !== SystemStatus.DELETED || userRole === UserRole.SYSTEM_ADMIN
                    ).map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={(filters.status || []).includes(status)}
                          onCheckedChange={(checked) => {
                            const newStatus = [...(filters.status || [])];
                            if (checked) {
                              newStatus.push(status);
                            } else {
                              const index = newStatus.indexOf(status);
                              if (index !== -1) newStatus.splice(index, 1);
                            }
                            handleStatusChange(newStatus);
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date filters */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.startDateFrom ? (
                            formatDate(filters.startDateFrom)
                          ) : (
                            <span>Start From</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          selected={filters.startDateFrom ? new Date(filters.startDateFrom) : undefined}
                          onSelect={(date) => {
                            handleStartDateFromChange(date);
                            setIsStartDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.endDateFrom ? (
                            formatDate(filters.endDateFrom)
                          ) : (
                            <span>End From</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          selected={filters.endDateFrom ? new Date(filters.endDateFrom) : undefined}
                          onSelect={(date) => {
                            handleEndDateFromChange(date);
                            setIsEndDateOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <ArrowDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-1">
                <h4 className="font-medium mb-2">Sort by</h4>
                {Object.values(ProgramSortField).map(field => (
                  <Button
                    key={field}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleSortChange(field)}
                  >
                    {field.replace(/_/g, ' ')}
                    {filters.sortBy === field && (
                      <span className="ml-auto">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filters */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.institutionIds && filters.institutionIds.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Institution: {filters.institutionIds.length}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleInstitutionChange([])}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.campusIds && filters.campusIds.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Campus: {filters.campusIds.length}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleCampusChange([])}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.status && filters.status.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filters.status.length}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleStatusChange([])}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(filters.startDateFrom || filters.startDateTo) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Start Date
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, startDateFrom: undefined, startDateTo: undefined }));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(filters.endDateFrom || filters.endDateTo) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                End Date
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => {
                    setFilters(prev => ({ ...prev, endDateFrom: undefined, endDateTo: undefined }));
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={resetFilters}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Render full filter view
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Filter Programs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search programs..."
              className="pl-8"
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
          </div>

          <Accordion type="single" collapsible defaultValue="item-1">
            {/* Institution filter (for System Admin only) */}
            {userRole === UserRole.SYSTEM_ADMIN && institutions.length > 0 && (
              <AccordionItem value="item-1">
                <AccordionTrigger>Institution</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {institutions.map(institution => (
                      <div key={institution.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`institution-${institution.id}`}
                          checked={(filters.institutionIds || []).includes(institution.id)}
                          onCheckedChange={(checked) => {
                            const newInstitutionIds = [...(filters.institutionIds || [])];
                            if (checked) {
                              newInstitutionIds.push(institution.id);
                            } else {
                              const index = newInstitutionIds.indexOf(institution.id);
                              if (index !== -1) newInstitutionIds.splice(index, 1);
                            }
                            handleInstitutionChange(newInstitutionIds);
                          }}
                        />
                        <Label htmlFor={`institution-${institution.id}`}>
                          {institution.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Campus filter */}
            {(userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.CAMPUS_ADMIN) && campuses.length > 0 && (
              <AccordionItem value="item-2">
                <AccordionTrigger>Campus</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {campuses.map(campus => (
                      <div key={campus.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`campus-${campus.id}`}
                          checked={(filters.campusIds || []).includes(campus.id)}
                          onCheckedChange={(checked) => {
                            const newCampusIds = [...(filters.campusIds || [])];
                            if (checked) {
                              newCampusIds.push(campus.id);
                            } else {
                              const index = newCampusIds.indexOf(campus.id);
                              if (index !== -1) newCampusIds.splice(index, 1);
                            }
                            handleCampusChange(newCampusIds);
                          }}
                        />
                        <Label htmlFor={`campus-${campus.id}`}>
                          {campus.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Status filter */}
            <AccordionItem value="item-3">
              <AccordionTrigger>Status</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {Object.values(SystemStatus).filter(status =>
                    status !== SystemStatus.DELETED || userRole === UserRole.SYSTEM_ADMIN
                  ).map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={(filters.status || []).includes(status)}
                        onCheckedChange={(checked) => {
                          const newStatus = [...(filters.status || [])];
                          if (checked) {
                            newStatus.push(status);
                          } else {
                            const index = newStatus.indexOf(status);
                            if (index !== -1) newStatus.splice(index, 1);
                          }
                          handleStatusChange(newStatus);
                        }}
                      />
                      <Label htmlFor={`status-${status}`}>
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Date filters */}
            <AccordionItem value="item-4">
              <AccordionTrigger>Date Range</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div>
                    <Label className="mb-2 block">Start Date</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">From</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.startDateFrom ? (
                                formatDate(filters.startDateFrom)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              selected={filters.startDateFrom ? new Date(filters.startDateFrom) : undefined}
                              onSelect={handleStartDateFromChange}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">To</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.startDateTo ? (
                                formatDate(filters.startDateTo)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              selected={filters.startDateTo ? new Date(filters.startDateTo) : undefined}
                              onSelect={handleStartDateToChange}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">End Date</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">From</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.endDateFrom ? (
                                formatDate(filters.endDateFrom)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              selected={filters.endDateFrom ? new Date(filters.endDateFrom) : undefined}
                              onSelect={handleEndDateFromChange}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">To</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.endDateTo ? (
                                formatDate(filters.endDateTo)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              selected={filters.endDateTo ? new Date(filters.endDateTo) : undefined}
                              onSelect={handleEndDateToChange}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sort options */}
            <AccordionItem value="item-5">
              <AccordionTrigger>Sort</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.sortBy || ProgramSortField.NAME}
                      onValueChange={(value) => setFilters(prev => ({
                        ...prev,
                        sortBy: value as ProgramSortField
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ProgramSortField).map(field => (
                          <SelectItem key={field} value={field}>
                            {field.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.sortOrder || 'asc'}
                      onValueChange={(value) => setFilters(prev => ({
                        ...prev,
                        sortOrder: value as 'asc' | 'desc'
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetFilters}>
          Reset
        </Button>
        <Button onClick={() => onFilterChange(filters)}>
          Apply Filters
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProgramFilters;
