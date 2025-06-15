import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  X
} from 'lucide-react';
// Card components are used in the parent component
import { Button } from '@/components/ui/core/button';
import { Label } from '@/components/ui/core/label';
import { Checkbox } from '@/components/ui/core/checkbox';
import { Badge } from '@/components/ui/core/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/core/accordion';
// Select components are used in the parent component
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import { Calendar as CalendarComponent } from '@/components/ui/core/calendar';
import { Calendar } from 'lucide-react';
import {
  ReportStatus,
  ReportType,
  ReportFormat,
  ReportFrequency,
  ReportVisibility,
  ReportSortField,
  ReportFilterOptions
} from './types';
import { AnalyticsEntityType } from '../analytics/types';

export interface ReportFiltersProps {
  onFilter?: (filters: ReportFilterOptions) => void;
  onSort?: (field: ReportSortField, direction: 'asc' | 'desc') => void;
  initialFilters?: ReportFilterOptions;
  initialSortField?: ReportSortField;
  initialSortDirection?: 'asc' | 'desc';
  availableTags?: string[];
  className?: string;
}

export function ReportFilters({
  onFilter,
  onSort,
  initialFilters,
  initialSortField = ReportSortField.CREATED_AT,
  initialSortDirection = 'desc',
  availableTags = [],
  className = '',
}: ReportFiltersProps) {
  // State for filters
  const [filters, setFilters] = useState<ReportFilterOptions>(initialFilters || {});
  const [sortField, setSortField] = useState<ReportSortField>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  // State for date range picker
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.dateRange?.from
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.dateRange?.to
  );

  // Handle status filter change
  const handleStatusChange = (status: ReportStatus, checked: boolean) => {
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

  // Handle type filter change
  const handleTypeChange = (type: ReportType, checked: boolean) => {
    const currentTypes = filters.type || [];

    if (checked) {
      setFilters({
        ...filters,
        type: [...currentTypes, type],
      });
    } else {
      setFilters({
        ...filters,
        type: currentTypes.filter(t => t !== type),
      });
    }
  };

  // Handle format filter change
  const handleFormatChange = (format: ReportFormat, checked: boolean) => {
    const currentFormats = filters.format || [];

    if (checked) {
      setFilters({
        ...filters,
        format: [...currentFormats, format],
      });
    } else {
      setFilters({
        ...filters,
        format: currentFormats.filter(f => f !== format),
      });
    }
  };

  // Handle frequency filter change
  const handleFrequencyChange = (frequency: ReportFrequency, checked: boolean) => {
    const currentFrequencies = filters.frequency || [];

    if (checked) {
      setFilters({
        ...filters,
        frequency: [...currentFrequencies, frequency],
      });
    } else {
      setFilters({
        ...filters,
        frequency: currentFrequencies.filter(f => f !== frequency),
      });
    }
  };

  // Handle visibility filter change
  const handleVisibilityChange = (visibility: ReportVisibility, checked: boolean) => {
    const currentVisibilities = filters.visibility || [];

    if (checked) {
      setFilters({
        ...filters,
        visibility: [...currentVisibilities, visibility],
      });
    } else {
      setFilters({
        ...filters,
        visibility: currentVisibilities.filter(v => v !== visibility),
      });
    }
  };

  // Handle entity type filter change
  const handleEntityTypeChange = (entityType: AnalyticsEntityType, checked: boolean) => {
    const currentEntityTypes = filters.entityType || [];

    if (checked) {
      setFilters({
        ...filters,
        entityType: [...currentEntityTypes, entityType],
      });
    } else {
      setFilters({
        ...filters,
        entityType: currentEntityTypes.filter(et => et !== entityType),
      });
    }
  };

  // Handle tag filter change
  const handleTagChange = (tag: string, checked: boolean) => {
    const currentTags = filters.tags || [];

    if (checked) {
      setFilters({
        ...filters,
        tags: [...currentTags, tag],
      });
    } else {
      setFilters({
        ...filters,
        tags: currentTags.filter(t => t !== tag),
      });
    }
  };

  // Handle date range change
  const handleDateRangeChange = (from?: Date, to?: Date) => {
    if (from || to) {
      setFilters({
        ...filters,
        dateRange: { from: from!, to: to! },
      });
    } else {
      const { dateRange, ...restFilters } = filters;
      setFilters(restFilters);
    }
  };

  // Handle sort change
  const handleSortChange = (field: ReportSortField) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      if (onSort) onSort(field, newDirection);
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection('desc');
      if (onSort) onSort(field, 'desc');
    }
  };

  // Apply filters
  const applyFilters = () => {
    if (onFilter) {
      onFilter(filters);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setStartDate(undefined);
    setEndDate(undefined);
    setSortField(ReportSortField.CREATED_AT);
    setSortDirection('desc');

    if (onFilter) {
      onFilter({});
    }

    if (onSort) {
      onSort(ReportSortField.CREATED_AT, 'desc');
    }
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.status?.length) count += filters.status.length;
    if (filters.type?.length) count += filters.type.length;
    if (filters.format?.length) count += filters.format.length;
    if (filters.frequency?.length) count += filters.frequency.length;
    if (filters.visibility?.length) count += filters.visibility.length;
    if (filters.entityType?.length) count += filters.entityType.length;
    if (filters.tags?.length) count += filters.tags.length;
    if (filters.dateRange) count += 1;
    return count;
  };

  // Remove a specific filter
  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'status':
        handleStatusChange(value as ReportStatus, false);
        break;
      case 'type':
        handleTypeChange(value as ReportType, false);
        break;
      case 'format':
        handleFormatChange(value as ReportFormat, false);
        break;
      case 'frequency':
        handleFrequencyChange(value as ReportFrequency, false);
        break;
      case 'visibility':
        handleVisibilityChange(value as ReportVisibility, false);
        break;
      case 'entityType':
        handleEntityTypeChange(value as AnalyticsEntityType, false);
        break;
      case 'tag':
        handleTagChange(value, false);
        break;
      case 'dateRange':
        setStartDate(undefined);
        setEndDate(undefined);
        const { dateRange, ...restFilters } = filters;
        setFilters(restFilters);
        break;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="status">
          <AccordionTrigger className="text-sm font-medium">
            Status
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ReportStatus).map((status) => (
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
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="type">
          <AccordionTrigger className="text-sm font-medium">
            Type
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ReportType).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.type?.includes(type) || false}
                    onCheckedChange={(checked) =>
                      handleTypeChange(type, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm cursor-pointer"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="format">
          <AccordionTrigger className="text-sm font-medium">
            Format
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ReportFormat).map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <Checkbox
                    id={`format-${format}`}
                    checked={filters.format?.includes(format) || false}
                    onCheckedChange={(checked) =>
                      handleFormatChange(format, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`format-${format}`}
                    className="text-sm cursor-pointer"
                  >
                    {format}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="frequency">
          <AccordionTrigger className="text-sm font-medium">
            Frequency
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ReportFrequency).map((frequency) => (
                <div key={frequency} className="flex items-center space-x-2">
                  <Checkbox
                    id={`frequency-${frequency}`}
                    checked={filters.frequency?.includes(frequency) || false}
                    onCheckedChange={(checked) =>
                      handleFrequencyChange(frequency, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`frequency-${frequency}`}
                    className="text-sm cursor-pointer"
                  >
                    {frequency}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="visibility">
          <AccordionTrigger className="text-sm font-medium">
            Visibility
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ReportVisibility).map((visibility) => (
                <div key={visibility} className="flex items-center space-x-2">
                  <Checkbox
                    id={`visibility-${visibility}`}
                    checked={filters.visibility?.includes(visibility) || false}
                    onCheckedChange={(checked) =>
                      handleVisibilityChange(visibility, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`visibility-${visibility}`}
                    className="text-sm cursor-pointer"
                  >
                    {visibility}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="entityType">
          <AccordionTrigger className="text-sm font-medium">
            Entity Type
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AnalyticsEntityType).map((entityType) => (
                <div key={entityType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`entityType-${entityType}`}
                    checked={filters.entityType?.includes(entityType) || false}
                    onCheckedChange={(checked) =>
                      handleEntityTypeChange(entityType, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`entityType-${entityType}`}
                    className="text-sm cursor-pointer"
                  >
                    {entityType}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {availableTags.length > 0 && (
          <AccordionItem value="tags">
            <AccordionTrigger className="text-sm font-medium">
              Tags
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.tags?.includes(tag) || false}
                      onCheckedChange={(checked) =>
                        handleTagChange(tag, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-sm cursor-pointer"
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? (
                        startDate.toLocaleDateString()
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      selected={startDate}
                      onSelect={setStartDate}
                      // initialFocus is deprecated
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="endDate" className="text-sm">
                  End Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? (
                        endDate.toLocaleDateString()
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      selected={endDate}
                      onSelect={setEndDate}
                      // initialFocus is deprecated
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (startDate && endDate) {
                    handleDateRangeChange(startDate, endDate);
                  }
                }}
                disabled={!startDate || !endDate}
                className="col-span-1 sm:col-span-2"
              >
                Apply Date Range
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sort">
          <AccordionTrigger className="text-sm font-medium">
            Sort By
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {Object.values(ReportSortField).map((field) => (
                <Button
                  key={field}
                  variant={sortField === field ? "default" : "outline"}
                  size="sm"
                  className="mr-2 mb-2"
                  onClick={() => handleSortChange(field)}
                >
                  {field}
                  {sortField === field && (
                    sortDirection === 'asc'
                      ? <ChevronUp className="ml-1 h-4 w-4" />
                      : <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
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
                {status}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('status', status)}
                />
              </Badge>
            ))}

            {filters.type?.map(type => (
              <Badge key={`type-${type}`} variant="secondary" className="flex items-center gap-1">
                {type}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('type', type)}
                />
              </Badge>
            ))}

            {filters.format?.map(format => (
              <Badge key={`format-${format}`} variant="secondary" className="flex items-center gap-1">
                {format}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('format', format)}
                />
              </Badge>
            ))}

            {filters.frequency?.map(frequency => (
              <Badge key={`frequency-${frequency}`} variant="secondary" className="flex items-center gap-1">
                {frequency}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('frequency', frequency)}
                />
              </Badge>
            ))}

            {filters.visibility?.map(visibility => (
              <Badge key={`visibility-${visibility}`} variant="secondary" className="flex items-center gap-1">
                {visibility}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('visibility', visibility)}
                />
              </Badge>
            ))}

            {filters.entityType?.map(entityType => (
              <Badge key={`entityType-${entityType}`} variant="secondary" className="flex items-center gap-1">
                {entityType}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('entityType', entityType)}
                />
              </Badge>
            ))}

            {filters.tags?.map(tag => (
              <Badge key={`tag-${tag}`} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('tag', tag)}
                />
              </Badge>
            ))}

            {filters.dateRange && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('dateRange', '')}
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
          <Search className="h-4 w-4" />
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
  );
}
