import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/atoms/card';
import { Input } from '@/components/ui/atoms/input';
import { Button } from '@/components/ui/atoms/button';
import { Label } from '@/components/ui/atoms/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/atoms/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/atoms/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/atoms/popover';
import { Checkbox } from '@/components/ui/atoms/checkbox';
import { Badge } from '@/components/ui/atoms/badge';
import { 
  TeacherFilter, 
  TeacherSortField, 
  UserRole, 
  SystemStatus 
} from './types';
import { Search, Filter, X, Check, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TeacherFiltersProps {
  userRole: UserRole;
  initialFilters?: TeacherFilter;
  onFilterChange: (filters: TeacherFilter) => void;
  campuses?: { id: string; name: string }[];
  subjects?: { id: string; name: string }[];
  compact?: boolean;
  className?: string;
}

/**
 * TeacherFilters component
 * 
 * Provides filtering controls for teacher lists.
 * Adapts based on the user's role and the compact mode.
 */
const TeacherFilters: React.FC<TeacherFiltersProps> = ({
  userRole,
  initialFilters = {},
  onFilterChange,
  campuses = [],
  subjects = [],
  compact = false,
  className
}) => {
  // State for filters
  const [filters, setFilters] = useState<TeacherFilter>(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };
  
  // Handle campus selection change
  const handleCampusChange = (campusIds: string[]) => {
    setFilters(prev => ({ ...prev, campusIds }));
  };
  
  // Handle subject selection change
  const handleSubjectChange = (subjectIds: string[]) => {
    setFilters(prev => ({ ...prev, subjectIds }));
  };
  
  // Handle status selection change
  const handleStatusChange = (status: SystemStatus[]) => {
    setFilters(prev => ({ ...prev, status }));
  };
  
  // Handle sort change
  const handleSortChange = (field: TeacherSortField) => {
    const sortOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setIsFilterOpen(false);
  };
  
  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.campusIds && filters.campusIds.length > 0) count++;
    if (filters.subjectIds && filters.subjectIds.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    return count;
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
              placeholder="Search teachers..."
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
                
                {/* Campus filter (for System Admin only) */}
                {userRole === UserRole.SYSTEM_ADMIN && campuses.length > 0 && (
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
                
                {/* Subject filter */}
                {subjects.length > 0 && (
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.slice(0, 4).map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subject-${subject.id}`}
                            checked={(filters.subjectIds || []).includes(subject.id)}
                            onCheckedChange={(checked) => {
                              const newSubjectIds = [...(filters.subjectIds || [])];
                              if (checked) {
                                newSubjectIds.push(subject.id);
                              } else {
                                const index = newSubjectIds.indexOf(subject.id);
                                if (index !== -1) newSubjectIds.splice(index, 1);
                              }
                              handleSubjectChange(newSubjectIds);
                            }}
                          />
                          <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                            {subject.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {subjects.length > 4 && (
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
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-1">
                <h4 className="font-medium mb-2">Sort by</h4>
                {Object.values(TeacherSortField).map(field => (
                  <Button
                    key={field}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleSortChange(field)}
                  >
                    {field}
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
            {filters.subjectIds && filters.subjectIds.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Subject: {filters.subjectIds.length}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleSubjectChange([])}
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
        <CardTitle>Filter Teachers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search teachers..."
              className="pl-8"
              value={filters.search || ''}
              onChange={handleSearchChange}
            />
          </div>
          
          <Accordion type="single" collapsible defaultValue="item-1">
            {/* Campus filter (for System Admin only) */}
            {userRole === UserRole.SYSTEM_ADMIN && campuses.length > 0 && (
              <AccordionItem value="item-1">
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
            
            {/* Subject filter */}
            {subjects.length > 0 && (
              <AccordionItem value="item-2">
                <AccordionTrigger>Subject</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {subjects.map(subject => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={(filters.subjectIds || []).includes(subject.id)}
                          onCheckedChange={(checked) => {
                            const newSubjectIds = [...(filters.subjectIds || [])];
                            if (checked) {
                              newSubjectIds.push(subject.id);
                            } else {
                              const index = newSubjectIds.indexOf(subject.id);
                              if (index !== -1) newSubjectIds.splice(index, 1);
                            }
                            handleSubjectChange(newSubjectIds);
                          }}
                        />
                        <Label htmlFor={`subject-${subject.id}`}>
                          {subject.name}
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
            
            {/* Sort options */}
            <AccordionItem value="item-4">
              <AccordionTrigger>Sort</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={filters.sortBy || TeacherSortField.NAME}
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        sortBy: value as TeacherSortField 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TeacherSortField).map(field => (
                          <SelectItem key={field} value={field}>
                            {field}
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

export default TeacherFilters;
