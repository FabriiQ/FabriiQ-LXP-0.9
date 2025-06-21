'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  subject: string;
  type: string;
  dueDate: Date;
  status: 'completed' | 'pending' | 'overdue' | 'upcoming';
  score?: number;
  totalScore?: number;
  chapter: string;
  classId: string;
  className: string;
}

interface StudentActivityCalendarProps {
  activities: Activity[];
}

export default function StudentActivityCalendar({ activities }: StudentActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getActivitiesForDate = (date: Date) => {
    return activities.filter(activity => isSameDay(activity.dueDate, date));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'upcoming':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const selectedDateActivities = selectedDate ? getActivitiesForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Activity Calendar</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[150px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Click on a date to view activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map(day => {
                const dayActivities = getActivitiesForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      p-2 text-sm border rounded-md transition-colors min-h-[60px] flex flex-col items-center justify-start
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                      ${!isCurrentMonth ? 'text-muted-foreground' : ''}
                    `}
                  >
                    <span className="font-medium">{format(day, 'd')}</span>
                    {dayActivities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dayActivities.slice(0, 2).map(activity => (
                          <div
                            key={activity.id}
                            className={`w-2 h-2 rounded-full ${
                              activity.status === 'completed' ? 'bg-green-500' :
                              activity.status === 'pending' ? 'bg-yellow-500' :
                              activity.status === 'overdue' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}
                          />
                        ))}
                        {dayActivities.length > 2 && (
                          <span className="text-xs">+{dayActivities.length - 2}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a Date'}
            </CardTitle>
            <CardDescription>
              {selectedDate 
                ? `${selectedDateActivities.length} activity(ies) on this date`
                : 'Click on a calendar date to view activities'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDateActivities.length > 0 ? (
              <div className="space-y-3">
                {selectedDateActivities.map(activity => (
                  <div key={activity.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{activity.title}</h4>
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Subject:</strong> {activity.subject}</p>
                      <p><strong>Type:</strong> {activity.type}</p>
                      <p><strong>Chapter:</strong> {activity.chapter}</p>
                      {activity.score !== undefined && (
                        <p><strong>Score:</strong> {activity.score}/{activity.totalScore}</p>
                      )}
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <p className="text-muted-foreground text-center py-8">
                No activities scheduled for this date.
              </p>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Select a date to view activities.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
