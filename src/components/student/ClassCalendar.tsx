'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isSameDay, addMonths, subMonths, eachDayOfInterval,
  startOfWeek, endOfWeek, addDays, isSameMonth } from 'date-fns';
import { startOfMonth, endOfMonth, isToday, differenceInDays } from '@/app/student/utils/date-utils';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Download,
  BookOpen,
  FileText,
  Award,
  MapPin
} from 'lucide-react';
import { Layers, PenTool, Zap, Flame } from '@/app/student/utils/custom-icons';
import Link from 'next/link';
import { Activity } from '@/features/activities/types/activity-schema';
import { saveActivity } from '@/features/activities/offline/db';
import { isOnline } from '@/utils/offline-storage';
import { CalendarService, StudyStreak, StudyLocation } from '@/app/student/utils/calendar.service';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Define view types
type CalendarView = 'day' | 'week' | 'month';
type DensityOption = 'compact' | 'spacious';

// Define props interface
export interface ClassCalendarProps {
  activities: Activity[];
  classId: string;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

/**
 * ClassCalendar component with mobile-first design and UX psychology principles
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
 * <ClassCalendar
 *   activities={activities}
 *   classId="class-123"
 * />
 * ```
 */
export const ClassCalendar: React.FC<ClassCalendarProps> = ({
  activities,
  classId,
  isLoading = false,
  error,
  onRefresh,
}) => {
  // Get user session for student ID
  const { data: session } = useSession();
  const studentId = session?.user?.id || 'guest';

  // State for calendar view and navigation
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [density, setDensity] = useState<DensityOption>('spacious');
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [animating, setAnimating] = useState(false);

  // State for study streak and locations
  const [studyStreak, setStudyStreak] = useState<StudyStreak | null>(null);
  const [studyLocations, setStudyLocations] = useState<StudyLocation[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  // No need for virtualization ref in this component

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

  // Load study streak data
  useEffect(() => {
    const loadStudyStreak = async () => {
      try {
        if (studentId) {
          const streak = await CalendarService.getStudyStreak(studentId);
          setStudyStreak(streak);
        }
      } catch (error) {
        console.error('Error loading study streak:', error);
      }
    };

    loadStudyStreak();
  }, [studentId]);

  // Load study locations
  useEffect(() => {
    const loadStudyLocations = async () => {
      try {
        if (studentId) {
          const locations = await CalendarService.getStudyLocations(studentId);
          setStudyLocations(locations);
        }
      } catch (error) {
        console.error('Error loading study locations:', error);
      }
    };

    loadStudyLocations();
  }, [studentId]);

  // Use calendar service for helper functions

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

  // Use format directly from date-fns

  // Use calendar service for helper functions
  const getActivityTypeColor = (type: string) => CalendarService.getActivityTypeColor(type);
  const getEstimatedTime = (activity: Activity) => CalendarService.getEstimatedTime(activity);
  const getActivitiesForDate = (date: Date) => CalendarService.getActivitiesForDate(activities, date);

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

  // Render month view
  const renderMonthView = () => {
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

    // Check if the date is a "fresh start" opportunity
    const isFreshStartOpportunity = (date: Date) => CalendarService.isFreshStartOpportunity(date);

    return (
      <div className={cn("transition-opacity duration-200", animating ? "opacity-0" : "opacity-100")}>
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const dayActivities = getActivitiesForDate(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isFreshStart = isFreshStartOpportunity(day);
            const isUpcoming = differenceInDays(day, new Date()) <= 3 && differenceInDays(day, new Date()) >= 0;

            return (
              <div
                key={i}
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
                  <span className="text-xs flex items-center">
                    {format(day, 'd')}
                    {hasStreak(day) && (
                      <Flame className="h-3 w-3 ml-1 text-orange-500" />
                    )}
                  </span>
                  {isFreshStart && (
                    <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded">
                      Fresh Start
                    </span>
                  )}
                </div>

                {dayActivities.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {density === 'compact'
                      ? (
                        <div className="flex justify-center items-center mt-2">
                          <Badge variant="outline" className="text-[8px]">
                            {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                          </Badge>
                        </div>
                      )
                      : dayActivities.slice(0, 2).map((activity, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "text-[8px] px-1 py-0.5 rounded truncate",
                            getActivityTypeColor(activity.type)
                          )}
                        >
                          {activity.title}
                        </div>
                      ))
                    }
                    {density === 'spacious' && dayActivities.length > 2 && (
                      <div className="text-[8px] text-center text-muted-foreground">
                        +{dayActivities.length - 2} more
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
                {getActivitiesForDate(selectedDate).length > 0 ? (
                  getActivitiesForDate(selectedDate).map((activity, idx) => (
                    <Card key={idx} className="overflow-hidden">
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
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenLocationDialog(activity)}>
                              <MapPin className="h-3 w-3 mr-1" />
                              Location
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/student/class/${classId}/subjects/${activity.subject}/activities/${activity.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
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

    return (
      <div className={cn("transition-opacity duration-200", animating ? "opacity-0" : "opacity-100")}>
        <div className="text-center mb-4">
          <h3 className="font-medium text-lg">{selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : ''}</h3>
          {isToday(selectedDate as Date) && (
            <Badge variant="outline" className="bg-primary/10 text-primary">Today</Badge>
          )}
        </div>

        <div className="space-y-4">
          {dayActivities.length > 0 ? (
            dayActivities.map((activity, idx) => (
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
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button size="sm" variant="outline" onClick={() => handleOpenLocationDialog(activity)}>
                    <MapPin className="h-4 w-4 mr-1" />
                    Study Location
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/student/class/${classId}/subjects/${activity.subject}/activities/${activity.id}`}>
                      Start Activity
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Activities Today</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                You don't have any activities scheduled for this day.
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
          )}
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

  // Handle opening the location dialog
  const handleOpenLocationDialog = useCallback((activity: Activity) => {
    setSelectedActivity(activity);
    setSelectedLocation(null);
    setShowLocationDialog(true);

    // Check if activity already has a location
    const checkExistingLocation = async () => {
      try {
        const locationId = await CalendarService.getActivityLocation(activity.id);
        if (locationId) {
          setSelectedLocation(locationId);
        }
      } catch (error) {
        console.error('Error checking existing location:', error);
      }
    };

    checkExistingLocation();
  }, []);

  // Handle saving the location association
  const handleSaveLocation = useCallback(async () => {
    if (selectedActivity && selectedLocation && studentId) {
      try {
        await CalendarService.associateLocationWithActivity(
          selectedActivity.id,
          selectedLocation,
          studentId
        );
        setShowLocationDialog(false);
      } catch (error) {
        console.error('Error saving location association:', error);
      }
    }
  }, [selectedActivity, selectedLocation, studentId]);

  // Check if a date has a streak
  const hasStreak = useCallback((date: Date) => {
    if (!studyStreak || !studyStreak.streakDates) return false;

    return studyStreak.streakDates.some(streakDate =>
      isSameDay(new Date(streakDate), date)
    );
  }, [studyStreak]);

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

          <div className="flex flex-wrap gap-2 items-center">
            {studyStreak && studyStreak.currentStreak > 0 && (
              <div className="flex items-center bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs mr-2">
                <Flame className="h-3 w-3 mr-1" />
                <span>{studyStreak.currentStreak} day streak</span>
              </div>
            )}

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

      {selectedDate && view !== 'day' && getActivitiesForDate(selectedDate).length > 0 && (
        <CardFooter className="p-4 pt-0 flex flex-col">
          <div className="w-full pt-4 border-t">
            <h3 className="font-medium mb-2">Activities for {format(selectedDate, 'MMMM d, yyyy')}</h3>
            <div className="space-y-2">
              {getActivitiesForDate(selectedDate).map((activity, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-md hover:bg-muted">
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
        </CardFooter>
      )}

      {isOffline && (
        <div className="bg-amber-50 p-2 text-amber-800 text-xs text-center">
          You're viewing cached calendar data. Some information may not be up to date.
        </div>
      )}

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Study Location</DialogTitle>
            <DialogDescription>
              Associate a study location with this activity to help with memory recall (Method of Loci).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Activity:</h4>
              <div className="p-2 bg-muted rounded-md">
                <p className="font-medium">{selectedActivity?.title}</p>
                <p className="text-sm text-muted-foreground">{selectedActivity?.subject}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Choose a study location:</h4>

              {studyLocations.length > 0 ? (
                <RadioGroup value={selectedLocation || ''} onValueChange={setSelectedLocation}>
                  {studyLocations.map(location => (
                    <div key={location.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted">
                      <RadioGroupItem value={location.id} id={`location-${location.id}`} />
                      <div className="grid gap-1.5">
                        <Label htmlFor={`location-${location.id}`} className="font-medium">
                          {location.name}
                          {location.isPreferred && (
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">Preferred</Badge>
                          )}
                        </Label>
                        {location.description && (
                          <p className="text-sm text-muted-foreground">{location.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No study locations found. Add locations in your profile settings.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveLocation} disabled={!selectedLocation}>Save Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClassCalendar;
