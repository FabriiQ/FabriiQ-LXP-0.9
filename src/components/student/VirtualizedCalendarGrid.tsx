'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format, isSameDay, addMonths, subMonths, eachDayOfInterval,
  startOfWeek, endOfWeek, addDays, isSameMonth, parseISO } from 'date-fns';
import { startOfMonth, endOfMonth, isToday, differenceInDays } from '@/app/student/utils/date-utils';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  Plus,
  Download,
  BookOpen,
  FileText,
  Award
} from 'lucide-react';
import { Layers, PenTool, Zap } from '@/app/student/utils/custom-icons';
import Link from 'next/link';
import { Activity } from '@/features/activities/types/activity-schema';
import { saveActivity } from '@/features/activities/offline/db';
import { isOnline } from '@/utils/offline-storage';
import { CalendarService } from '@/app/student/utils/calendar.service';

// Define view types
type CalendarView = 'day' | 'week' | 'month';
type DensityOption = 'compact' | 'spacious';

// Define lesson plan event interface
interface LessonPlanEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  color: string;
  description: string;
  metadata: {
    teacherName: string | null;
    className: string;
    subjectName: string | undefined;
    planType: string;
  };
}

// Define props interface
export interface VirtualizedCalendarGridProps {
  activities: Activity[];
  classId: string;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  lessonPlanEvents?: LessonPlanEvent[];
}

/**
 * VirtualizedCalendarGrid component with mobile-first design and UX psychology principles
 *
 * Features:
 * - Day/week/month views with intuitive switching
 * - Optimized rendering with virtualization
 * - Color coding for different activity types
 * - Visual density options
 * - Estimated completion times
 * - Study interval suggestions (Spacing Effect)
 * - Fresh start opportunities highlighting
 * - Offline support
 *
 * @example
 * ```tsx
 * <VirtualizedCalendarGrid
 *   activities={activities}
 *   classId="class-123"
 * />
 * ```
 */
export const VirtualizedCalendarGrid: React.FC<VirtualizedCalendarGridProps> = ({
  activities,
  classId,
  isLoading = false,
  error,
  onRefresh,
  lessonPlanEvents = [],
}) => {
  // State for calendar view and navigation
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [density, setDensity] = useState<DensityOption>('spacious');
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [animating, setAnimating] = useState(false);

  // Ref for virtualization
  const parentRef = useRef<HTMLDivElement>(null);

  // Update offline status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Cache activities in IndexedDB for offline use
  useEffect(() => {
    if (activities.length > 0) {
      const cacheActivities = async () => {
        try {
          // Store each activity in IndexedDB
          for (const activity of activities) {
            await saveActivity(activity.id, activity);
          }
        } catch (error) {
          console.error('Error caching activities:', error);
        }
      };

      cacheActivities();
    }
  }, [activities]);

  // Helper function to get activity type icon
  const getActivityTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Quiz': <FileText className="h-3 w-3" />,
      'Assignment': <PenTool className="h-3 w-3" />,
      'Exam': <Award className="h-3 w-3" />,
      'Reading': <BookOpen className="h-3 w-3" />,
      'Discussion': <Layers className="h-3 w-3" />,
      'Project': <Zap className="h-3 w-3" />,
      'MULTIPLE_CHOICE': <FileText className="h-3 w-3" />,
      'MULTIPLE_RESPONSE': <FileText className="h-3 w-3" />,
      'TRUE_FALSE': <FileText className="h-3 w-3" />,
      'FILL_IN_THE_BLANKS': <PenTool className="h-3 w-3" />,
      'MATCHING': <Layers className="h-3 w-3" />,
      'SEQUENCE': <Layers className="h-3 w-3" />,
      'NUMERIC': <FileText className="h-3 w-3" />,
      'OPEN_ENDED': <PenTool className="h-3 w-3" />,
    };

    return iconMap[type] || <FileText className="h-3 w-3" />;
  };

  // Format date to readable string
  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy');
  };

  // Use calendar service for helper functions
  const getActivityTypeColor = (type: string) => CalendarService.getActivityTypeColor(type);
  const getEstimatedTime = (activity: Activity) => CalendarService.getEstimatedTime(activity);
  const getActivitiesForDate = (date: Date) => CalendarService.getActivitiesForDate(activities, date);

  // Get lesson plan events for a specific date
  const getLessonPlanEventsForDate = (date: Date) => {
    if (!lessonPlanEvents || lessonPlanEvents.length === 0) return [];

    return lessonPlanEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check if the date falls within the event's date range
      return (
        (date >= eventStart && date <= eventEnd) ||
        isSameDay(date, eventStart) ||
        isSameDay(date, eventEnd)
      );
    });
  };

  // Navigation functions
  const goToPreviousPeriod = () => {
    setAnimating(true);
    setTimeout(() => {
      if (view === 'day') {
        setCurrentDate(prev => addDays(prev, -1));
      } else if (view === 'week') {
        setCurrentDate(prev => addDays(prev, -7));
      } else {
        setCurrentDate(prev => subMonths(prev, 1));
      }
      setAnimating(false);
    }, 200);
  };

  const goToNextPeriod = () => {
    setAnimating(true);
    setTimeout(() => {
      if (view === 'day') {
        setCurrentDate(prev => addDays(prev, 1));
      } else if (view === 'week') {
        setCurrentDate(prev => addDays(prev, 7));
      } else {
        setCurrentDate(prev => addMonths(prev, 1));
      }
      setAnimating(false);
    }, 200);
  };

  const goToToday = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentDate(new Date());
      setSelectedDate(new Date());
      setAnimating(false);
    }, 200);
  };

  // Set up virtualization for weeks - moved outside of render functions to maintain hook order
  const getWeeks = useCallback(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group days into weeks
    const weeks: Date[][] = [];
    let week: Date[] = [];

    days.forEach((day, i) => {
      week.push(day);
      if (i % 7 === 6) {
        weeks.push(week);
        week = [];
      }
    });

    return weeks;
  }, [currentDate]);

  // Calculate weeks and update when currentDate changes
  const [weeks, setWeeks] = useState<Date[][]>(getWeeks());

  useEffect(() => {
    setWeeks(getWeeks());
  }, [getWeeks]);

  // Set up virtualization for weeks - moved outside of render functions
  const rowVirtualizer = useVirtualizer({
    count: weeks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => density === 'compact' ? 80 : 100,
    overscan: 2,
  });

  // Check if the date is a "fresh start" opportunity
  const isFreshStartOpportunity = (date: Date) => CalendarService.isFreshStartOpportunity(date);

  // Render month view with virtualization
  const renderMonthView = () => {
    // Get the current weeks based on the current date
    const currentWeeks = weeks;

    return (
      <div
        ref={parentRef}
        className={cn(
          "transition-opacity duration-200 overflow-auto",
          animating ? "opacity-0" : "opacity-100"
        )}
        style={{ height: '500px' }}
      >
        <div className="grid grid-cols-7 mb-2 sticky top-0 bg-background z-10">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map(virtualRow => {
            const weekIndex = virtualRow.index;
            const weekDays = currentWeeks[weekIndex];

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day, dayIndex) => {
                    const dayActivities = getActivitiesForDate(day);
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isFreshStart = isFreshStartOpportunity(day);
                    const isUpcoming = differenceInDays(day, new Date()) <= 3 && differenceInDays(day, new Date()) >= 0;

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "border rounded-md p-1 min-h-[80px] relative cursor-pointer transition-all duration-200",
                          !isSameMonth(day, currentDate) && "bg-muted/50 opacity-50",
                          isToday(day) && "border-primary",
                          isSelected && "ring-2 ring-primary ring-offset-2",
                          isFreshStart && "bg-blue-50/50",
                          density === 'compact' ? "min-h-[60px]" : "min-h-[80px]"
                        )}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className={cn(
                          "flex justify-between items-start",
                          isToday(day) && "font-bold text-primary"
                        )}>
                          <span className="text-xs">{format(day, 'd')}</span>
                          {isFreshStart && (
                            <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded">
                              Fresh Start
                            </span>
                          )}
                        </div>

                        {/* Get lesson plan events for this day */}
                        {(dayActivities.length > 0 || getLessonPlanEventsForDate(day).length > 0) && (
                          <div className="mt-1 space-y-1">
                            {density === 'compact'
                              ? (
                                <div className="flex justify-center items-center mt-2">
                                  <Badge variant="outline" className="text-[8px]">
                                    {dayActivities.length + getLessonPlanEventsForDate(day).length} {dayActivities.length + getLessonPlanEventsForDate(day).length === 1 ? 'item' : 'items'}
                                  </Badge>
                                </div>
                              )
                              : (
                                <>
                                  {/* Show activities */}
                                  {dayActivities.slice(0, 1).map((activity, idx) => (
                                    <div
                                      key={`activity-${idx}`}
                                      className={cn(
                                        "text-[8px] px-1 py-0.5 rounded truncate",
                                        getActivityTypeColor(activity.type)
                                      )}
                                    >
                                      {activity.title}
                                    </div>
                                  ))}

                                  {/* Show lesson plan events */}
                                  {getLessonPlanEventsForDate(day).slice(0, 1).map((event, idx) => (
                                    <div
                                      key={`event-${idx}`}
                                      className="text-[8px] px-1 py-0.5 rounded truncate bg-indigo-100 text-indigo-800"
                                    >
                                      {event.title}
                                    </div>
                                  ))}
                                </>
                              )
                            }

                            {density === 'spacious' &&
                              (dayActivities.length + getLessonPlanEventsForDate(day).length > 2) && (
                              <div className="text-[8px] text-center text-muted-foreground">
                                +{dayActivities.length + getLessonPlanEventsForDate(day).length - 2} more
                              </div>
                            )}
                          </div>
                        )}

                        {isUpcoming && dayActivities.length > 0 && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
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
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className={cn("transition-opacity duration-200", animating ? "opacity-0" : "opacity-100")}>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, i) => {
            const dayActivities = getActivitiesForDate(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

            return (
              <div key={i} className="text-center">
                <div
                  className={cn(
                    "py-2 font-medium text-sm rounded-md cursor-pointer",
                    isToday(day) && "text-primary",
                    isSelected && "bg-primary/10"
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center mx-auto",
                    isToday(day) && "bg-primary text-white"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 space-y-2">
          {selectedDate && (
            <>
              <h3 className="font-medium">{format(selectedDate, 'EEEE, MMMM d')}</h3>
              <div className="space-y-2">
                {(getActivitiesForDate(selectedDate).length > 0 || getLessonPlanEventsForDate(selectedDate).length > 0) ? (
                  <>
                    {/* Display activities */}
                    {getActivitiesForDate(selectedDate).map((activity, idx) => (
                      <Card key={`activity-${idx}`} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{activity.title}</div>
                              <div className="text-sm text-muted-foreground">{activity.subject}</div>
                              <div className="flex items-center mt-1 space-x-2">
                                <Badge variant="outline" className={cn(getActivityTypeColor(activity.type))}>
                                  <span className="flex items-center">
                                    {getActivityTypeIcon(activity.type)}
                                    <span className="ml-1">{activity.type}</span>
                                  </span>
                                </Badge>
                                <div className="text-xs flex items-center text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  ~{getEstimatedTime(activity)} min
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/student/class/${classId}/subjects/${activity.subject}/activities/${activity.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Display lesson plan events */}
                    {getLessonPlanEventsForDate(selectedDate).map((event, idx) => (
                      <Card key={`event-${idx}`} className="overflow-hidden border-indigo-200">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                              </div>
                              <div className="flex items-center mt-1 space-x-2">
                                <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                                  <span className="flex items-center">
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    <span className="ml-1">Lesson</span>
                                  </span>
                                </Badge>
                              </div>
                              {event.description && (
                                <div className="mt-2 text-sm text-muted-foreground">
                                  {event.description}
                                </div>
                              )}
                              {event.metadata.teacherName && (
                                <div className="text-xs text-muted-foreground">
                                  Teacher: {event.metadata.teacherName}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h3 className="font-medium">No Activities</h3>
                    <p className="text-sm text-muted-foreground">
                      There are no activities scheduled for this day
                    </p>
                    <div className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-md max-w-md mx-auto">
                      <p className="font-medium mb-1">Study Tip:</p>
                      <p>Use this free day to review previous material or get ahead on upcoming topics.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render day view
  const renderDayView = () => {
    const dayActivities = selectedDate ? getActivitiesForDate(selectedDate) : [];
    const dayEvents = selectedDate ? getLessonPlanEventsForDate(selectedDate) : [];

    return (
      <div className={cn("transition-opacity duration-200", animating ? "opacity-0" : "opacity-100")}>
        <div className="text-center mb-4">
          <h3 className="font-medium text-lg">{selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}</h3>
          {isToday(selectedDate as Date) && (
            <Badge variant="outline" className="bg-primary/10 text-primary">Today</Badge>
          )}
        </div>

        <div className="space-y-4">
          {/* Display lesson plan events first */}
          {dayEvents.length > 0 && (
            <div>
              <h4 className="text-md font-medium mb-2">Lessons</h4>
              <div className="space-y-3">
                {dayEvents.map((event, idx) => (
                  <Card key={`event-${idx}`} className="overflow-hidden border-indigo-200">
                    <CardHeader className="p-4 pb-2 bg-indigo-50">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                          <span className="flex items-center">
                            <BookOpen className="h-3 w-3 mr-1" />
                            <span className="ml-1">Lesson</span>
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                      </div>
                      {event.description && (
                        <div className="mt-2 text-sm">
                          {event.description}
                        </div>
                      )}
                      {event.metadata.teacherName && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Teacher: {event.metadata.teacherName}
                        </div>
                      )}
                      {event.metadata.subjectName && (
                        <div className="text-sm text-muted-foreground">
                          Subject: {event.metadata.subjectName}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Display activities */}
          {dayActivities.length > 0 ? (
            <div>
              <h4 className="text-md font-medium mb-2">Activities</h4>
              <div className="space-y-3">
                {dayActivities.map((activity, idx) => (
                  <Card key={idx} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{activity.title}</CardTitle>
                        <Badge variant="outline" className={cn(getActivityTypeColor(activity.type))}>
                          <span className="flex items-center">
                            {getActivityTypeIcon(activity.type)}
                            <span className="ml-1">{activity.type}</span>
                          </span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground mb-2">{activity.subject}</div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          ~{getEstimatedTime(activity)} min
                        </div>
                        {activity.chapter && (
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                            {activity.chapter}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 bg-muted p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Optimal Study Approach:</p>
                        <p>Break this {activity.type.toLowerCase()} into {Math.ceil(getEstimatedTime(activity) / 25)} pomodoro sessions for best results.</p>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end">
                      <Button size="sm" asChild>
                        <Link href={`/student/class/${classId}/subjects/${activity.subject}/activities/${activity.id}`}>
                          Start Activity
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ) : dayEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Activities or Lessons Today</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                You don't have any activities or lessons scheduled for this day.
              </p>
              <div className="mt-6 text-sm text-muted-foreground bg-muted p-4 rounded-md max-w-md mx-auto">
                <p className="font-medium mb-2">Free Day Study Tips:</p>
                <ul className="space-y-2 text-left list-disc pl-5">
                  <li>Review notes from previous classes</li>
                  <li>Preview upcoming material</li>
                  <li>Create flashcards for key concepts</li>
                  <li>Connect with classmates to discuss challenging topics</li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  // Render the appropriate view based on state
  const renderCalendarView = () => {
    switch (view) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
      default:
        return renderMonthView();
    }
  };

  // Add to personal calendar function
  const addToPersonalCalendar = useCallback((activity: Activity) => {
    // Generate ICS content
    const icsContent = CalendarService.generateICSContent(activity);

    // Create a Blob with the ICS content
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activity.title.replace(/\s+/g, '_')}.ics`;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to load calendar</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline">
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={goToPreviousPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-medium mx-2">
              {view === 'day'
                ? format(currentDate, 'MMMM d, yyyy')
                : view === 'week'
                  ? `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')
              }
            </h2>
            <Button variant="ghost" size="icon" onClick={goToNextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="ml-2" onClick={goToToday}>
              Today
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={density} onValueChange={(value) => setDensity(value as DensityOption)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Density" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>

            <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {renderCalendarView()}
      </CardContent>

      {selectedDate && view !== 'day' &&
        (getActivitiesForDate(selectedDate).length > 0 || getLessonPlanEventsForDate(selectedDate).length > 0) && (
        <CardFooter className="p-4 pt-0 flex flex-col">
          <div className="w-full pt-4 border-t">
            <h3 className="font-medium mb-2">Schedule for {format(selectedDate, 'MMMM d, yyyy')}</h3>

            {/* Display lesson plan events */}
            {getLessonPlanEventsForDate(selectedDate).length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Lessons</h4>
                <div className="space-y-2">
                  {getLessonPlanEventsForDate(selectedDate).map((event, idx) => (
                    <div key={`event-${idx}`} className="flex justify-between items-center p-2 rounded-md hover:bg-muted border-l-2 border-indigo-300">
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 mr-2">
                            Lesson
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                          </span>
                        </div>
                        {event.metadata.teacherName && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Teacher: {event.metadata.teacherName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Display activities */}
            {getActivitiesForDate(selectedDate).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Activities</h4>
                <div className="space-y-2">
                  {getActivitiesForDate(selectedDate).map((activity, idx) => (
                    <div key={`activity-${idx}`} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className={cn("mr-2", getActivityTypeColor(activity.type))}>
                            {activity.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.subject}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => addToPersonalCalendar(activity)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" asChild>
                          <Link href={`/student/class/${classId}/subjects/${activity.subject}/activities/${activity.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardFooter>
      )}

      {isOffline && (
        <div className="bg-amber-50 p-2 text-amber-800 text-xs text-center">
          You're viewing cached calendar data. Some information may not be up to date.
        </div>
      )}
    </Card>
  );
};

export default VirtualizedCalendarGrid;
