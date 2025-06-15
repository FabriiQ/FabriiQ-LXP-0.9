'use client';

import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import { CalendarAction, hasCalendarPermission } from '@/lib/permissions/calendar-permissions';
import { Edit, Trash2, Clock } from 'lucide-react';
import { UserType } from '@prisma/client';

interface SchedulePattern {
  id: string;
  name: string;
  description?: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  recurrence: string;
  startDate: Date;
  endDate?: Date;
}

interface SchedulePatternListProps {
  patterns: SchedulePattern[];
  userType: string;
  onEdit: (pattern: SchedulePattern) => void;
  onDelete: (patternId: string) => void;
}

const recurrenceColors = {
  DAILY: 'bg-blue-100 text-blue-800',
  WEEKLY: 'bg-green-100 text-green-800',
  BIWEEKLY: 'bg-purple-100 text-purple-800',
  MONTHLY: 'bg-orange-100 text-orange-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
};

const dayLabels = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export function SchedulePatternList({
  patterns,
  userType,
  onEdit,
  onDelete,
}: SchedulePatternListProps) {
  const canEditPatterns = hasCalendarPermission(userType as UserType, CalendarAction.UPDATE_SCHEDULE_PATTERN);
  const canDeletePatterns = hasCalendarPermission(userType as UserType, CalendarAction.DELETE_SCHEDULE_PATTERN);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return format(date, 'h:mm a');
  };

  return (
    <div className="space-y-4">
      {patterns.map((pattern) => (
        <Card key={pattern.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">{pattern.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={recurrenceColors[pattern.recurrence as keyof typeof recurrenceColors]}>
                {pattern.recurrence}
              </Badge>
              {canEditPatterns && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(pattern)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDeletePatterns && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(pattern.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pattern.description && (
                <p className="text-sm text-gray-500">{pattern.description}</p>
              )}
              <div className="flex flex-col space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>
                    {formatTime(pattern.startTime)} - {formatTime(pattern.endTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Days:</span>
                  <div className="flex space-x-1">
                    {pattern.daysOfWeek.map((day) => (
                      <Badge
                        key={day}
                        variant="outline"
                        className="text-xs"
                      >
                        {dayLabels[day as keyof typeof dayLabels]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Duration:</span>
                  <span>
                    {format(pattern.startDate, 'MMM d, yyyy')}
                    {pattern.endDate && (
                      <>
                        {' - '}
                        {format(pattern.endDate, 'MMM d, yyyy')}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 