'use client';

import React, { useState } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { getHours } from 'date-fns/getHours';
import { setHours } from 'date-fns/setHours';
import { addYears } from 'date-fns/addYears';
import { eachMonthOfInterval } from 'date-fns/eachMonthOfInterval';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';

import { startOfYear } from 'date-fns/startOfYear';
import { endOfYear } from 'date-fns/endOfYear';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/forms/select';
import { UserType } from '@/server/api/constants';
import { cn } from '@/lib/utils';
import { hasCalendarPermission, CalendarAction } from '@/lib/permissions/calendarPermissions';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'HOLIDAY' | 'ACADEMIC_EVENT' | 'SCHEDULE';
  color?: string;
  description?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  userType: UserType;
  view?: 'month' | 'week' | 'day' | 'year';
  onViewChange?: (view: 'month' | 'week' | 'day' | 'year') => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


export function Calendar({
  events,
  onDateClick,
  onEventClick,
  userType,
  view = 'month',
  onViewChange,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const viewOptions = [
    { value: 'year', label: 'Year' },
    { value: 'month', label: 'Month' },
    { value: 'week', label: 'Week' },
    { value: 'day', label: 'Day' },
  ];

  const canAddEvents = hasCalendarPermission(userType, CalendarAction.CREATE_ACADEMIC_EVENT);
  const canAddHolidays = hasCalendarPermission(userType, CalendarAction.CREATE_HOLIDAY);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    onEventClick?.(event);
  };

  const renderDayEvents = (date: Date, events: CalendarEvent[]) => {
    const dayEvents = events.filter(event =>
      isSameDay(date, event.start) ||
      (event.start <= date && event.end >= date)
    );

    return (
      <div className="space-y-1">
        {dayEvents.map(event => (
          <div
            key={event.id}
            className={cn(
              "text-xs p-1 rounded cursor-pointer truncate",
              event.type === 'HOLIDAY' ? 'bg-red-100 text-red-800' :
              event.type === 'ACADEMIC_EVENT' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleEventClick(event);
            }}
            title={event.title}
          >
            {event.title}
          </div>
        ))}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows: React.ReactNode[] = [];
    let days: React.ReactNode[] = [];
    let day = startDate;

    const header = DAYS_OF_WEEK.map(dayName => (
      <div key={dayName} className="font-semibold text-center py-2">
        {dayName}
      </div>
    ));

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(
          <div
            key={day.toString()}
            className={cn(
              "p-2 border min-h-[100px]",
              !isSameMonth(day, monthStart) && "bg-gray-50",
              selectedDate && isSameDay(day, selectedDate) && "bg-blue-50"
            )}
            onClick={() => handleDateClick(day)}
          >
            <div className="font-semibold">{format(day, 'd')}</div>
            {renderDayEvents(day, events)}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7">{header}</div>
        {rows}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-2">
          {/* Time column */}
          <div className="border-r">
            <div className="h-12" /> {/* Header spacer */}
            {HOURS.map(hour => (
              <div
                key={hour}
                className="h-20 border-b text-sm text-right pr-2 text-gray-500"
              >
                {format(setHours(new Date(), hour), 'ha')}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {days.map(day => (
            <div key={day.toString()} className="flex-1">
              <div className="h-12 text-center border-b font-semibold">
                <div>{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-sm",
                  isSameDay(day, new Date()) && "text-blue-600"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
              {HOURS.map(hour => {
                const currentHourDate = setHours(day, hour);
                const hourEvents = events.filter(event => {
                  const eventStart = new Date(event.start);
                  const eventEnd = new Date(event.end);
                  return (
                    getHours(eventStart) <= hour &&
                    getHours(eventEnd) >= hour &&
                    isSameDay(currentHourDate, eventStart)
                  );
                });

                return (
                  <div
                    key={`${day}-${hour}`}
                    className="h-20 border-b border-r relative"
                    onClick={() => handleDateClick(currentHourDate)}
                  >
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-0 right-0 m-1 p-1 text-xs rounded truncate cursor-pointer",
                          event.type === 'HOLIDAY' ? 'bg-red-100 text-red-800' :
                          event.type === 'ACADEMIC_EVENT' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          <div className="text-center border-b pb-2">
            <div className="font-semibold">{format(currentDate, 'EEEE')}</div>
            <div className="text-sm text-gray-500">{format(currentDate, 'MMMM d, yyyy')}</div>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            {HOURS.map(hour => {
              const currentHourDate = setHours(currentDate, hour);
              const hourEvents = events.filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);
                return (
                  getHours(eventStart) <= hour &&
                  getHours(eventEnd) >= hour &&
                  isSameDay(currentHourDate, eventStart)
                );
              });

              return (
                <React.Fragment key={hour}>
                  <div className="text-right pr-2 py-2 text-sm text-gray-500">
                    {format(setHours(new Date(), hour), 'ha')}
                  </div>
                  <div
                    className="border rounded-lg p-2 min-h-[60px]"
                    onClick={() => handleDateClick(currentHourDate)}
                  >
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className={cn(
                          "mb-1 p-1 text-xs rounded truncate cursor-pointer",
                          event.type === 'HOLIDAY' ? 'bg-red-100 text-red-800' :
                          event.type === 'ACADEMIC_EVENT' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <div className="grid grid-cols-3 gap-8">
        {months.map(month => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const startDate = startOfWeek(monthStart);
          const endDate = endOfWeek(monthEnd);
          const days = eachDayOfInterval({ start: startDate, end: endDate });

          const monthEvents = events.filter(event =>
            isSameMonth(month, event.start) ||
            isSameMonth(month, event.end)
          );

          return (
            <div key={month.toString()} className="space-y-2">
              <div className="font-semibold text-center">
                {format(month, 'MMMM')}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-xs text-gray-500">
                    {day[0]}
                  </div>
                ))}
                {days.map(day => (
                  <div
                    key={day.toString()}
                    className={cn(
                      "aspect-square flex items-center justify-center text-xs",
                      !isSameMonth(day, month) && "text-gray-300",
                      isSameDay(day, new Date()) && "bg-blue-100 rounded-full",
                      selectedDate && isSameDay(day, selectedDate) && "bg-blue-200 rounded-full"
                    )}
                    onClick={() => handleDateClick(day)}
                  >
                    {format(day, 'd')}
                  </div>
                ))}
              </div>
              {monthEvents.length > 0 && (
                <div className="text-xs space-y-1 mt-2">
                  {monthEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "truncate",
                        event.type === 'HOLIDAY' ? 'text-red-600' :
                        event.type === 'ACADEMIC_EVENT' ? 'text-blue-600' :
                        'text-green-600'
                      )}
                      title={event.title}
                    >
                      • {event.title}
                    </div>
                  ))}
                  {monthEvents.length > 3 && (
                    <div className="text-gray-500">
                      +{monthEvents.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'year':
        setCurrentDate(prev => direction === 'prev' ? addYears(prev, -1) : addYears(prev, 1));
        break;
      case 'month':
        setCurrentDate(prev => direction === 'prev' ? addMonths(prev, -1) : addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate(prev => direction === 'prev' ? addWeeks(prev, -1) : addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate(prev => direction === 'prev' ? addDays(prev, -1) : addDays(prev, 1));
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {view === 'year' && format(currentDate, 'yyyy')}
            {view === 'month' && format(currentDate, 'MMMM yyyy')}
            {view === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
            {view === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigate('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={view} onValueChange={onViewChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              {viewOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canAddEvents && (
            <Button variant="outline" onClick={() => onEventClick?.({
              id: 'new',
              title: 'New Event',
              start: new Date(),
              end: new Date(),
              type: 'ACADEMIC_EVENT'
            })}>
              Add Event
            </Button>
          )}
          {canAddHolidays && (
            <Button variant="outline" onClick={() => onEventClick?.({
              id: 'new',
              title: 'New Holiday',
              start: new Date(),
              end: new Date(),
              type: 'HOLIDAY'
            })}>
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
      {view === 'year' && renderYearView()}
    </div>
  );
}