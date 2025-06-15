'use client';

import { useParams } from 'next/navigation';
import Head from 'next/head';
import { Calendar as CalendarIcon, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/trpc/react';
import { useState } from 'react';
import Link from 'next/link';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';

/**
 * Simplified Calendar page for a specific class in the student portal
 *
 * This version only shows activity deadlines in a simple calendar view
 * without complex data transformations or dependencies.
 */
export default function ClassCalendarPage() {
  const params = useParams();
  const classId = params?.id as string || "";
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch class data directly - minimal query
  const { data: classData, isLoading: classLoading } = api.class.getById.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Fetch activities for this class - minimal query
  const { data: activities, isLoading: activitiesLoading } = api.activity.listByClass.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Navigation functions
  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const goToCurrentMonth = () => setCurrentMonth(new Date());

  // Get days for the current month view
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // Get all days in the month
    return eachDayOfInterval({ start, end });
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date: Date) => {
    if (!activities) return [];

    return activities.filter(activity => {
      if (!activity.endDate) return false;
      const dueDate = new Date(activity.endDate);
      return isSameDay(dueDate, date);
    });
  };

  // Get activity type color
  const getActivityTypeColor = (type: string): string => {
    const typeMap: Record<string, string> = {
      'MULTIPLE_CHOICE': 'bg-primary/10 text-primary',
      'MULTIPLE_RESPONSE': 'bg-amber-500/10 text-amber-500',
      'TRUE_FALSE': 'bg-blue-500/10 text-blue-500',
      'FILL_IN_THE_BLANKS': 'bg-purple-500/10 text-purple-500',
      'MATCHING': 'bg-emerald-500/10 text-emerald-500',
      'SEQUENCE': 'bg-pink-500/10 text-pink-500',
      'NUMERIC': 'bg-indigo-500/10 text-indigo-500',
      'OPEN_ENDED': 'bg-red-500/10 text-red-500',
    };

    return typeMap[type] || 'bg-gray-500/10 text-gray-500';
  };

  // Render the calendar grid
  const renderCalendarGrid = () => {
    const days = getDaysInMonth();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the start of the month */}
          {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
            <div key={`empty-start-${i}`} className="h-24 p-1 border rounded-md bg-muted/20"></div>
          ))}

          {/* Days of the month */}
          {days.map(day => {
            const dayActivities = getActivitiesForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`h-24 p-1 border rounded-md ${!isCurrentMonth ? 'bg-muted/20' : ''} ${isCurrentDay ? 'border-primary' : ''}`}
              >
                <div className={`text-xs font-medium ${isCurrentDay ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>

                <div className="mt-1 space-y-1 overflow-y-auto max-h-[80%]">
                  {dayActivities.slice(0, 2).map((activity, idx) => (
                    <div
                      key={activity.id}
                      className={`text-[8px] px-1 py-0.5 rounded truncate ${getActivityTypeColor(activity.learningType || '')}`}
                    >
                      {activity.title}
                    </div>
                  ))}

                  {dayActivities.length > 2 && (
                    <div className="text-[8px] text-center text-muted-foreground">
                      +{dayActivities.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty cells for days after the end of the month */}
          {Array.from({ length: 6 - new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDay() }).map((_, i) => (
            <div key={`empty-end-${i}`} className="h-24 p-1 border rounded-md bg-muted/20"></div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Page title for SEO and browser tab */}
      <Head>
        <title>{classData?.name ? `${classData.name} - Calendar` : 'Class Calendar'}</title>
      </Head>

      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">
            View upcoming activities and deadlines
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg mx-2">
                  {format(currentMonth, 'MMMM yyyy')}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="ml-2" onClick={goToCurrentMonth}>
                  Today
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {classLoading || activitiesLoading ? (
              <div className="flex items-center justify-center h-64">
                <CalendarIcon className="h-8 w-8 animate-pulse text-primary" />
                <span className="ml-2">Loading calendar...</span>
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Activities</h3>
                <p className="text-muted-foreground mt-2">
                  There are no activities scheduled for this class.
                </p>
              </div>
            ) : (
              renderCalendarGrid()
            )}
          </CardContent>
        </Card>

        {/* Activity List Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {classLoading || activitiesLoading ? (
              <div className="flex items-center justify-center h-16">
                <CalendarIcon className="h-5 w-5 animate-pulse text-primary" />
                <span className="ml-2">Loading activities...</span>
              </div>
            ) : !activities || activities.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No upcoming activities</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities
                  .filter(activity => activity.endDate && new Date(activity.endDate) >= new Date())
                  .sort((a, b) => new Date(a.endDate || 0).getTime() - new Date(b.endDate || 0).getTime())
                  .slice(0, 5)
                  .map(activity => (
                    <div key={activity.id} className="flex justify-between items-center p-2 hover:bg-muted rounded-md">
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className={getActivityTypeColor(activity.learningType || '')}>
                            {activity.learningType || 'Activity'}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            Due: {activity.endDate ? format(new Date(activity.endDate), 'MMM d, yyyy') : 'No due date'}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/student/class/${classId}/subjects/${activity.subjectId}/activities/${activity.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
