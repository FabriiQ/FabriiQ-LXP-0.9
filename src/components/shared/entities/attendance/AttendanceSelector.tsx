'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/core/card';
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
import { Label } from '@/components/ui/core/label';
import { Skeleton } from '@/components/ui/core/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/core/alert';
import {
  AlertCircle,
  Calendar,
  Search,
  ChevronDown,
  X,
  ArrowRight
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/core/popover';
import { Calendar as CalendarComponent } from '@/components/ui/core/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/core/select';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import {
  UserRole,
  EntityType
} from './types';

export interface Entity {
  id: string;
  name: string;
  code?: string;
  type?: string;
}

export interface AttendanceSelectorProps {
  /**
   * Entity type to select
   */
  entityType: EntityType;

  /**
   * Array of selectable entities
   */
  entities: Entity[];

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * Initial selected entity ID
   */
  initialEntityId?: string;

  /**
   * Initial date or date range
   */
  initialDate?: Date | { start: Date; end: Date };

  /**
   * Selection callback
   */
  onSelect: (entityId: string, date: Date | { start: Date; end: Date }) => void;

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
 * AttendanceSelector component with mobile-first design
 *
 * Features:
 * - Role-specific rendering
 * - Entity selection (campus, program, class, student)
 * - Date or date range selection
 * - Search functionality
 *
 * @example
 * ```tsx
 * <AttendanceSelector
 *   entityType="class"
 *   entities={classes}
 *   userRole={UserRole.TEACHER}
 *   onSelect={handleSelect}
 * />
 * ```
 */
export const AttendanceSelector: React.FC<AttendanceSelectorProps> = ({
  entityType,
  entities,
  userRole,
  initialEntityId = '',
  initialDate = new Date(),
  onSelect,
  isLoading = false,
  error,
  className,
}) => {
  // State for selected entity
  const [selectedEntityId, setSelectedEntityId] = useState<string>(initialEntityId);

  // State for date selection
  const [selectedDate, setSelectedDate] = useState<Date | { start: Date; end: Date }>(initialDate);

  // State for search term
  const [searchTerm, setSearchTerm] = useState('');

  // State for calendar open
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Filter entities based on search term
  const filteredEntities = entities.filter(entity =>
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entity.code && entity.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get entity label based on type
  const getEntityLabel = (): string => {
    switch (entityType) {
      case 'campus':
        return 'Campus';
      case 'program':
        return 'Program';
      case 'class':
        return 'Class';
      case 'student':
        return 'Student';
    }
  };

  // Handle entity selection
  const handleEntityChange = (id: string) => {
    setSelectedEntityId(id);
  };

  // Handle date selection
  const handleDateChange = (date: Date | { start: Date; end: Date }) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  // Handle form submission
  const handleSubmit = () => {
    onSelect(selectedEntityId, selectedDate);
  };

  // Format date for display
  const formatDateDisplay = (): string => {
    if (!selectedDate) return 'Select date';

    if (selectedDate instanceof Date) {
      return format(selectedDate, 'PPP');
    } else {
      return `${format(selectedDate.start, 'PPP')} - ${format(selectedDate.end, 'PPP')}`;
    }
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-32 ml-auto" />
        </CardFooter>
      </Card>
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

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Select {getEntityLabel()}</CardTitle>
        <CardDescription>
          Choose a {entityType.toLowerCase()} and date to view attendance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Entity selector */}
          <div className="space-y-2">
            <Label htmlFor="entity-select">{getEntityLabel()}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="entity-search"
                type="search"
                placeholder={`Search ${entityType.toLowerCase()}...`}
                className="pl-8 mb-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Select value={selectedEntityId} onValueChange={handleEntityChange}>
              <SelectTrigger id="entity-select">
                <SelectValue placeholder={`Select ${getEntityLabel()}`} />
              </SelectTrigger>
              <SelectContent>
                {filteredEntities.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    No {entityType.toLowerCase()} found
                  </div>
                ) : (
                  filteredEntities.map(entity => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name} {entity.code && `(${entity.code})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Date selector */}
          <div className="space-y-2">
            <Label htmlFor="date-select">Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date-select"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatDateDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  selected={selectedDate instanceof Date ? selectedDate : undefined}
                  onSelect={handleDateChange}
                />

                {/* Quick date selectors */}
                {entityType === 'student' && (
                  <div className="border-t p-3 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDateChange({
                        start: subDays(new Date(), 6),
                        end: new Date()
                      })}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDateChange({
                        start: subDays(new Date(), 29),
                        end: new Date()
                      })}
                    >
                      Last 30 days
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedEntityId}
        >
          View Attendance
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AttendanceSelector;
