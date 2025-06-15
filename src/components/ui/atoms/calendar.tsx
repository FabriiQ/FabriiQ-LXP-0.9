'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CalendarAction, hasCalendarPermission } from '@/lib/permissions/calendar-permissions';
import { UserType } from '@prisma/client';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  color?: string;
}

interface Holiday {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  holidays?: Holiday[];
  showWeekends?: boolean;
  disablePastDates?: boolean;
  userType: UserType;
  campusId?: string;
  view?: 'month' | 'week' | 'day';
  onViewChange?: (view: 'month' | 'week' | 'day') => void;
}

export function Calendar({
  events,
  onDateClick,
  onEventClick,
  holidays = [],
  showWeekends = false,
  disablePastDates = false,
  userType,
  campusId,
  view = 'month',
  onViewChange,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        if (!showWeekends && (i === 0 || i === 6)) {
          day = addDays(day, 1);
          continue;
        }

        const dateEvents = events.filter(
          (event) =>
            isSameDay(day, event.start) ||
            (event.start <= day && event.end >= day)
        );

        const dateHolidays = holidays.filter(
          (holiday) =>
            holiday.startDate <= day && holiday.endDate >= day
        );

        days.push({
          date: day,
          isCurrentMonth: isSameMonth(day, monthStart),
          isToday: isSameDay(day, new Date()),
          isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
          events: dateEvents,
          holidays: dateHolidays,
          isPast: day < new Date(),
        });

        day = addDays(day, 1);
      }

      rows.push(days);
      days = [];
    }

    return rows;
  }, [currentDate, events, holidays, selectedDate, showWeekends]);

  const handleDateClick = (date: Date) => {
    if (disablePastDates && date < new Date()) {
      return;
    }

    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const canViewHolidays = hasCalendarPermission(userType, CalendarAction.VIEW_HOLIDAYS);
  const canViewEvents = hasCalendarPermission(userType, CalendarAction.VIEW_ACADEMIC_EVENTS);

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {onViewChange && (
          <div className="flex space-x-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              onClick={() => onViewChange('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              onClick={() => onViewChange('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              onClick={() => onViewChange('day')}
            >
              Day
            </Button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {!showWeekends && <div className="hidden" />}
          <div className="py-2 text-center font-semibold">Mon</div>
          <div className="py-2 text-center font-semibold">Tue</div>
          <div className="py-2 text-center font-semibold">Wed</div>
          <div className="py-2 text-center font-semibold">Thu</div>
          <div className="py-2 text-center font-semibold">Fri</div>
          {showWeekends && (
            <>
              <div className="py-2 text-center font-semibold">Sat</div>
              <div className="py-2 text-center font-semibold">Sun</div>
            </>
          )}
        </div>

        {/* Calendar Days */}
        <div className="bg-white">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-7 gap-px border-t first:border-t-0"
            >
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={cn(
                    'min-h-[120px] p-2 relative',
                    !day.isCurrentMonth && 'bg-gray-50 text-gray-400',
                    day.isToday && 'bg-blue-50',
                    day.isSelected && 'bg-blue-100',
                    day.isPast && disablePastDates && 'cursor-not-allowed opacity-50',
                    !day.isPast && 'cursor-pointer hover:bg-gray-50'
                  )}
                  onClick={() => handleDateClick(day.date)}
                >
                  <div className="font-semibold mb-1">
                    {format(day.date, 'd')}
                  </div>

                  {/* Holidays */}
                  {canViewHolidays && day.holidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="text-xs mb-1 bg-red-100 text-red-800 rounded px-1 truncate"
                      title={holiday.name}
                    >
                      {holiday.name}
                    </div>
                  ))}

                  {/* Events */}
                  {canViewEvents && day.events.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs mb-1 rounded px-1 truncate cursor-pointer',
                        `bg-${event.color || 'blue'}-100`,
                        `text-${event.color || 'blue'}-800`
                      )}
                      title={event.title}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 