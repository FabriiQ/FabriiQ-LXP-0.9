'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Custom Button component to avoid type errors
const Button = ({ children, variant, size, className, onClick, ...props }: any) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        variant === 'outline' && 'border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        variant === 'link' && 'text-primary underline-offset-4 hover:underline',
        size === 'default' && 'h-9 px-4 py-2',
        size === 'sm' && 'h-8 rounded-md px-3 text-xs',
        size === 'lg' && 'h-10 rounded-md px-8',
        size === 'icon' && 'h-9 w-9',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from 'date-fns';
import { UserRole, ClassData } from '../types';
import { ScheduleItem } from './ScheduleForm';
import { ScheduleAction } from './ScheduleList';

export interface ScheduleCalendarProps {
  /**
   * Class data
   */
  classData: ClassData;

  /**
   * Array of schedule items
   */
  scheduleItems: ScheduleItem[];

  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;

  /**
   * View mode
   * @default 'week'
   */
  viewMode?: 'day' | 'week' | 'month';

  /**
   * Initial date to display
   * @default current date
   */
  initialDate?: Date;

  /**
   * Array of allowed actions
   * @default []
   */
  actions?: ScheduleAction[];

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
   * Action callback
   */
  onAction?: (action: ScheduleAction, scheduleItem: ScheduleItem) => void;

  /**
   * Add schedule item callback
   */
  onAddScheduleItem?: (date?: Date) => void;

  /**
   * View mode change callback
   */
  onViewModeChange?: (viewMode: 'day' | 'week' | 'month') => void;

  /**
   * Date change callback
   */
  onDateChange?: (date: Date) => void;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ScheduleCalendar component with mobile-first design
 *
 * Features:
 * - Role-specific action visibility
 * - Multiple view modes (day, week, month)
 * - Date navigation
 * - Color-coded schedule types
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <ScheduleCalendar
 *   classData={classData}
 *   scheduleItems={scheduleItems}
 *   userRole={UserRole.TEACHER}
 *   actions={['view', 'edit', 'delete']}
 *   onAction={handleAction}
 * />
 * ```
 */
export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  classData,
  scheduleItems,
  userRole,
  viewMode: initialViewMode = 'week',
  initialDate = new Date(),
  actions = [],
  isLoading = false,
  error,
  onAction,
  onAddScheduleItem,
  onViewModeChange,
  onDateChange,
  className,
}) => {
  // State for current date
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  // State for view mode
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>(initialViewMode);

  // State for selected schedule item
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);

  // Handle view mode change
  const handleViewModeChange = (mode: 'day' | 'week' | 'month') => {
    setViewMode(mode);

    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  // Handle date change
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);

    if (onDateChange) {
      onDateChange(date);
    }
  };

  // Handle previous period
  const handlePrevious = () => {
    let newDate: Date;

    switch (viewMode) {
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
      default:
        newDate = subWeeks(currentDate, 1);
    }

    handleDateChange(newDate);
  };

  // Handle next period
  const handleNext = () => {
    let newDate: Date;

    switch (viewMode) {
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
      default:
        newDate = addWeeks(currentDate, 1);
    }

    handleDateChange(newDate);
  };

  // Handle today
  const handleToday = () => {
    handleDateChange(new Date());
  };

  // Handle schedule item click
  const handleScheduleItemClick = (item: ScheduleItem) => {
    setSelectedItem(item);
  };

  // Handle action click
  const handleActionClick = (action: ScheduleAction) => {
    if (selectedItem && onAction) {
      onAction(action, selectedItem);
      setSelectedItem(null);
    }
  };

  // Handle add schedule item
  const handleAddScheduleItem = (date?: Date) => {
    if (onAddScheduleItem) {
      onAddScheduleItem(date);
    }
  };

  // Determine which actions to show based on user role
  const getVisibleActions = (role: UserRole): ScheduleAction[] => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
      case UserRole.CAMPUS_ADMIN:
        return actions; // All actions
      case UserRole.COORDINATOR:
        return actions.filter(action =>
          ['view', 'edit', 'duplicate'].includes(action)
        );
      case UserRole.TEACHER:
        return actions.filter(action =>
          ['view', 'edit', 'duplicate'].includes(action)
        );
      case UserRole.STUDENT:
        return actions.filter(action =>
          ['view'].includes(action)
        );
      default:
        return [];
    }
  };

  // Get visible actions based on user role
  const visibleActions = getVisibleActions(userRole);

  // Check if user can add schedule items
  const canAddScheduleItems = [
    UserRole.SYSTEM_ADMIN,
    UserRole.CAMPUS_ADMIN,
    UserRole.COORDINATOR,
    UserRole.TEACHER,
  ].includes(userRole);

  // Get schedule type color
  const getScheduleTypeColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'lab':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'exam':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'assignment':
        return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'office_hours':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Get schedule type name
  const getScheduleTypeName = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'Lecture';
      case 'lab':
        return 'Lab';
      case 'exam':
        return 'Exam';
      case 'assignment':
        return 'Assignment';
      case 'office_hours':
        return 'Office Hours';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get schedule items for a specific date
  const getScheduleItemsForDate = (date: Date) => {
    return scheduleItems.filter(item => {
      const itemDate = new Date(item.date);
      return isSameDay(itemDate, date);
    });
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>

            <Skeleton className="h-96 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <h5 className="font-medium">Error</h5>
        </div>
        <div className="mt-2 text-sm">{error}</div>
      </div>
    );
  }

  // Render day view
  const renderDayView = () => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    return (
      <div className="space-y-4">
        <div className="text-center py-2 border-b">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {hours.map(hour => {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;

            const hourItems = scheduleItems.filter(item => {
              const itemDate = new Date(item.date);
              if (!isSameDay(itemDate, currentDate)) return false;

              const itemStartHour = parseInt(item.startTime.split(':')[0]);
              return itemStartHour === hour;
            });

            return (
              <div key={hour} className="relative min-h-[60px]">
                <div className="absolute left-0 top-0 w-16 text-xs text-muted-foreground py-1">
                  {startTime}
                </div>
                <div className="ml-16 pl-2 border-l min-h-[60px]">
                  {hourItems.length > 0 ? (
                    <div className="space-y-1 py-1">
                      {hourItems.map(item => (
                        <Button
                          key={item.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-left h-auto py-2 px-3 rounded-md",
                            getScheduleTypeColor(item.type)
                          )}
                          onClick={() => handleScheduleItemClick(item)}
                        >
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.startTime} - {item.endTime}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    canAddScheduleItems && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground h-full w-full justify-start"
                        onClick={() => {
                          const date = new Date(currentDate);
                          date.setHours(hour, 0, 0, 0);
                          handleAddScheduleItem(date);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

    return (
      <div className="space-y-4">
        <div className="text-center py-2 border-b">
          <h3 className="text-lg font-semibold">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {days.map(day => (
                <div key={day.toString()} className="text-center">
                  <div className="font-medium">{format(day, 'EEE')}</div>
                  <div className={cn(
                    "text-sm",
                    isSameDay(day, new Date()) ? "bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center mx-auto" : ""
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="relative">
              {/* Time labels */}
              <div className="absolute left-0 top-0 w-12">
                {hours.map(hour => (
                  <div key={hour} className="h-20 text-xs text-muted-foreground pt-1">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div className="ml-12 grid grid-cols-7 gap-2 border-t">
                {days.map(day => (
                  <div key={day.toString()} className="border-l min-h-[800px]">
                    {hours.map(hour => {
                      const hourItems = scheduleItems.filter(item => {
                        const itemDate = new Date(item.date);
                        if (!isSameDay(itemDate, day)) return false;

                        const itemStartHour = parseInt(item.startTime.split(':')[0]);
                        return itemStartHour === hour;
                      });

                      return (
                        <div key={hour} className="h-20 border-b relative">
                          {hourItems.length > 0 ? (
                            <div className="absolute inset-0 p-1 overflow-y-auto">
                              {hourItems.map(item => (
                                <Button
                                  key={item.id}
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "w-full justify-start text-left h-auto py-1 px-2 text-xs rounded-sm mb-1",
                                    getScheduleTypeColor(item.type)
                                  )}
                                  onClick={() => handleScheduleItemClick(item)}
                                >
                                  <div className="truncate">
                                    <div className="font-medium truncate">{item.title}</div>
                                    <div className="text-xs truncate">{item.startTime} - {item.endTime}</div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          ) : (
                            canAddScheduleItems && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-full text-xs text-muted-foreground opacity-0 hover:opacity-100"
                                onClick={() => {
                                  const date = new Date(day);
                                  date.setHours(hour, 0, 0, 0);
                                  handleAddScheduleItem(date);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render month view
  const renderMonthView = () => {
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group days into weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    days.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return (
      <div className="space-y-4">
        <div className="text-center py-2 border-b">
          <h3 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="font-medium text-sm py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flatMap(week =>
            week.map(day => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const dayItems = getScheduleItemsForDate(day);

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "min-h-[100px] p-1 border rounded-md",
                    !isCurrentMonth && "bg-muted/20",
                    isToday && "border-primary"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {canAddScheduleItems && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground opacity-0 hover:opacity-100"
                        onClick={() => handleAddScheduleItem(day)}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="sr-only">Add</span>
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {dayItems.map(item => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left h-auto py-1 px-2 text-xs rounded-sm",
                          getScheduleTypeColor(item.type)
                        )}
                        onClick={() => handleScheduleItemClick(item)}
                      >
                        <div className="truncate">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs truncate">{item.startTime}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Class Schedule</CardTitle>
        <CardDescription>
          {classData.name} ({classData.code})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Navigation controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('day')}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('week')}
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('month')}
              >
                Month
              </Button>

              {canAddScheduleItems && onAddScheduleItem && (
                <Button size="sm" onClick={() => handleAddScheduleItem(currentDate)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              )}
            </div>
          </div>

          {/* Calendar view */}
          <div className="border rounded-md p-4">
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'month' && renderMonthView()}
          </div>

          {/* Schedule item details popover */}
          {selectedItem && (
            <Popover open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
              <PopoverContent className="w-80" align="center">
                <div className="space-y-4">
                  <div className={cn("p-2 rounded-md", getScheduleTypeColor(selectedItem.type))}>
                    <h3 className="font-medium">{selectedItem.title}</h3>
                    <p className="text-sm">{getScheduleTypeName(selectedItem.type)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{format(new Date(selectedItem.date), 'PPPP')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{selectedItem.startTime} - {selectedItem.endTime}</span>
                    </div>
                    {selectedItem.facilityId && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Facility</span>
                      </div>
                    )}
                    {selectedItem.teacherId && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Teacher</span>
                      </div>
                    )}
                    {selectedItem.isRecurring && (
                      <Badge variant="outline" className="mt-1">
                        Recurring
                      </Badge>
                    )}
                    {selectedItem.description && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm">{selectedItem.description}</p>
                      </div>
                    )}
                  </div>

                  {visibleActions.length > 0 && (
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      {visibleActions.map(action => (
                        <Button
                          key={action}
                          variant={action === 'delete' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.charAt(0).toUpperCase() + action.slice(1)}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleCalendar;
