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
import { Input } from '@/components/ui/core/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/core/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
import { DateRangeSelector, DateRange } from './DateRangeSelector';
import {
  AnalyticsEntityType,
  AnalyticsMetricType,
  AnalyticsTimePeriod,
  AnalyticsSortField,
  AnalyticsFilterOptions
} from './types';

export interface AnalyticsFiltersProps {
  onFilter?: (filters: AnalyticsFilterOptions) => void;
  onSort?: (field: AnalyticsSortField, direction: 'asc' | 'desc') => void;
  initialFilters?: AnalyticsFilterOptions;
  initialSortField?: AnalyticsSortField;
  initialSortDirection?: 'asc' | 'desc';
  availableEntityIds?: { id: string; name: string; type: AnalyticsEntityType }[];
  className?: string;
}

export function AnalyticsFilters({
  onFilter,
  onSort,
  initialFilters,
  initialSortField = AnalyticsSortField.CREATED_AT,
  initialSortDirection = 'desc',
  availableEntityIds = [],
  className = '',
}: AnalyticsFiltersProps) {
  // State for filters
  const [filters, setFilters] = useState<AnalyticsFilterOptions>(initialFilters || {});
  const [sortField, setSortField] = useState<AnalyticsSortField>(initialSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');

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

  // Handle metric type filter change
  const handleMetricTypeChange = (metricType: AnalyticsMetricType, checked: boolean) => {
    const currentMetricTypes = filters.metricType || [];

    if (checked) {
      setFilters({
        ...filters,
        metricType: [...currentMetricTypes, metricType],
      });
    } else {
      setFilters({
        ...filters,
        metricType: currentMetricTypes.filter(mt => mt !== metricType),
      });
    }
  };

  // Handle time period filter change
  const handleTimePeriodChange = (timePeriod: AnalyticsTimePeriod, checked: boolean) => {
    const currentTimePeriods = filters.timePeriod || [];

    if (checked) {
      setFilters({
        ...filters,
        timePeriod: [...currentTimePeriods, timePeriod],
      });
    } else {
      setFilters({
        ...filters,
        timePeriod: currentTimePeriods.filter(tp => tp !== timePeriod),
      });
    }
  };

  // Handle entity ID change
  const handleEntityIdChange = (entityId: string) => {
    setFilters({
      ...filters,
      entityId: entityId || undefined,
    });
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange) => {
    setFilters({
      ...filters,
      dateRange: range,
    });
  };

  // Handle search term change
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (field: AnalyticsSortField) => {
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
      onFilter({
        ...filters,
        searchTerm,
      });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortField(AnalyticsSortField.CREATED_AT);
    setSortDirection('desc');

    if (onFilter) {
      onFilter({});
    }

    if (onSort) {
      onSort(AnalyticsSortField.CREATED_AT, 'desc');
    }
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.entityType?.length) count += filters.entityType.length;
    if (filters.metricType?.length) count += filters.metricType.length;
    if (filters.timePeriod?.length) count += filters.timePeriod.length;
    if (filters.entityId) count += 1;
    if (filters.dateRange) count += 1;
    if (searchTerm) count += 1;
    return count;
  };

  // Remove a specific filter
  const removeFilter = (type: string, value: string) => {
    switch (type) {
      case 'entityType':
        handleEntityTypeChange(value as AnalyticsEntityType, false);
        break;
      case 'metricType':
        handleMetricTypeChange(value as AnalyticsMetricType, false);
        break;
      case 'timePeriod':
        handleTimePeriodChange(value as AnalyticsTimePeriod, false);
        break;
      case 'entityId':
        handleEntityIdChange('');
        break;
      case 'dateRange':
        const { dateRange, ...restFilters } = filters;
        setFilters(restFilters);
        break;
      case 'searchTerm':
        setSearchTerm('');
        break;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Search analytics..."
          value={searchTerm}
          onChange={handleSearchTermChange}
          className="flex-1"
        />
        <Button
          variant="default"
          size="sm"
          onClick={applyFilters}
          className="sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full">
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

        <AccordionItem value="metricType">
          <AccordionTrigger className="text-sm font-medium">
            Metric Type
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AnalyticsMetricType).map((metricType) => (
                <div key={metricType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`metricType-${metricType}`}
                    checked={filters.metricType?.includes(metricType) || false}
                    onCheckedChange={(checked) =>
                      handleMetricTypeChange(metricType, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`metricType-${metricType}`}
                    className="text-sm cursor-pointer"
                  >
                    {metricType}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="timePeriod">
          <AccordionTrigger className="text-sm font-medium">
            Time Period
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AnalyticsTimePeriod).map((timePeriod) => (
                <div key={timePeriod} className="flex items-center space-x-2">
                  <Checkbox
                    id={`timePeriod-${timePeriod}`}
                    checked={filters.timePeriod?.includes(timePeriod) || false}
                    onCheckedChange={(checked) =>
                      handleTimePeriodChange(timePeriod, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`timePeriod-${timePeriod}`}
                    className="text-sm cursor-pointer"
                  >
                    {timePeriod}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {availableEntityIds.length > 0 && (
          <AccordionItem value="entityId">
            <AccordionTrigger className="text-sm font-medium">
              Entity
            </AccordionTrigger>
            <AccordionContent>
              <Select
                value={filters.entityId || ''}
                onValueChange={handleEntityIdChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  {availableEntityIds.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name} ({entity.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="dateRange">
          <AccordionTrigger className="text-sm font-medium">
            Date Range
          </AccordionTrigger>
          <AccordionContent>
            <DateRangeSelector
              value={
                filters.dateRange || {
                  from: new Date(new Date().setDate(new Date().getDate() - 30)),
                  to: new Date(),
                }
              }
              onChange={handleDateRangeChange}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sort">
          <AccordionTrigger className="text-sm font-medium">
            Sort By
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {Object.values(AnalyticsSortField).map((field) => (
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
            {filters.entityType?.map(entityType => (
              <Badge key={`entityType-${entityType}`} variant="secondary" className="flex items-center gap-1">
                {entityType}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('entityType', entityType)}
                />
              </Badge>
            ))}

            {filters.metricType?.map(metricType => (
              <Badge key={`metricType-${metricType}`} variant="secondary" className="flex items-center gap-1">
                {metricType}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('metricType', metricType)}
                />
              </Badge>
            ))}

            {filters.timePeriod?.map(timePeriod => (
              <Badge key={`timePeriod-${timePeriod}`} variant="secondary" className="flex items-center gap-1">
                {timePeriod}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('timePeriod', timePeriod)}
                />
              </Badge>
            ))}

            {filters.entityId && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Entity: {availableEntityIds.find(e => e.id === filters.entityId)?.name || filters.entityId}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('entityId', '')}
                />
              </Badge>
            )}

            {filters.dateRange && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.dateRange.from.toLocaleDateString()} - {filters.dateRange.to.toLocaleDateString()}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFilter('dateRange', '')}
                />
              </Badge>
            )}

            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchTerm}
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
