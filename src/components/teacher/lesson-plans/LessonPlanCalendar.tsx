'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/trpc/react';
import { Calendar } from '@/components/calendar/base/Calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/core/skeleton';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserType } from '@prisma/client';
import { toast } from '@/components/ui/toast';

interface LessonPlanCalendarProps {
  teacherId?: string;
  classId?: string;
  userType: UserType;
}

export default function LessonPlanCalendar({ teacherId, classId, userType }: LessonPlanCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  
  // Calculate date range based on current date and view
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  
  // Fetch lesson plan events
  const { data: events, isLoading } = api.lessonPlan.getCalendarEvents.useQuery({
    startDate,
    endDate,
    teacherId,
    classId
  }, {
    refetchOnWindowFocus: false
  });
  
  // Handle navigation
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  // Handle view change
  const handleViewChange = (newView: 'month' | 'week' | 'day') => {
    setView(newView);
  };
  
  // Handle event click
  const handleEventClick = (event: any) => {
    if (event.type === 'LESSON_PLAN') {
      // Navigate to the lesson plan view
      if (userType === UserType.CAMPUS_TEACHER) {
        router.push(`/teacher/lesson-plans/${event.id}`);
      } else if (userType === UserType.CAMPUS_COORDINATOR) {
        router.push(`/coordinator/lesson-plans/${event.id}`);
      } else if (userType === UserType.CAMPUS_ADMIN) {
        router.push(`/admin/lesson-plans/${event.id}`);
      }
    }
  };
  
  // Handle export to calendar
  const handleExportCalendar = async (eventId: string) => {
    try {
      const icalData = await api.lessonPlan.exportToCalendar.query(eventId);
      
      // Create a blob and download it
      const blob = new Blob([icalData], { type: 'text/calendar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lesson-plan-${eventId}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Calendar exported',
        description: 'The lesson plan has been exported to your calendar',
      });
    } catch (error) {
      console.error('Error exporting calendar:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export the lesson plan to calendar',
        variant: 'error',
      });
    }
  };
  
  // Format events for the calendar component
  const calendarEvents = events?.map(event => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
    onExport: () => handleExportCalendar(event.id)
  })) || [];
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Lesson Plan Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Select value={view} onValueChange={(value: any) => handleViewChange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <CalendarIcon className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading calendar...</span>
          </div>
        ) : calendarEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No Lesson Plans Found</h3>
            <p className="mt-1">No lesson plans scheduled for this period.</p>
          </div>
        ) : (
          <Calendar 
            events={calendarEvents}
            onEventClick={handleEventClick}
            userType={userType}
            view={view}
            onViewChange={handleViewChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
