'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/data-display/card';
import { Calendar as CalendarIcon, Filter } from 'lucide-react';
import { api } from '@/trpc/react';
import { Calendar } from '@/components/calendar/base/Calendar';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/forms/select';
import { DatePicker } from '@/components/ui/forms/date-picker-adapter';

export default function CalendarViewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<'month' | 'week' | 'day' | 'year'>('month');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 0)
  });
  const [selectedFilters, setSelectedFilters] = useState({
    campusId: '',
    eventType: '',
  });

  // Fetch academic events
  const { data: academicEvents, isLoading: isLoadingEvents } = api.academicCycle.getByDateRange.useQuery({
    institutionId: user?.institutionId || '',
    startDate: dateRange.from || new Date(),
    endDate: dateRange.to || new Date(),
  }, {
    enabled: !!user?.institutionId && !!dateRange.from && !!dateRange.to
  });

  // Fetch campuses for filter
  const { data: campuses } = api.campus.list.useQuery({
    institutionId: user?.institutionId || '',
  }, {
    enabled: !!user?.institutionId
  });

  // Format events for calendar
  const calendarEvents = React.useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      type: string;
      color?: string;
      description?: string;
    }> = [];
    
    // Add academic events
    if (academicEvents && Array.isArray(academicEvents)) {
      academicEvents.forEach(event => {
        events.push({
          id: event.id,
          title: event.name,
          start: new Date(event.startDate),
          end: new Date(event.endDate),
          type: 'ACADEMIC_EVENT',
          color: 'blue',
          description: event.description || '',
        });
      });
    }
    
    return events;
  }, [academicEvents]);

  const handleEventClick = (event: any) => {
    if (event.type === 'ACADEMIC_EVENT') {
      router.push(`/admin/system/calendar/events/${event.id}`);
    }
  };

  const handleViewChange = (newView: 'month' | 'week' | 'day' | 'year') => {
    setView(newView);
  };

  const handleDateRangeChange = (range?: { from?: Date; to?: Date }) => {
    if (range) {
      setDateRange(range);
    }
  };

  const isLoading = isLoadingEvents || !user;

  if (!user) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Academic Calendar"
            description="Loading user information..."
          />
        </div>
        <Card className="p-6 flex items-center justify-center h-64">
          <CalendarIcon className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading user information...</span>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Academic Calendar"
          description="View academic events and schedule patterns"
        />
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div className="flex-1 min-w-[200px]">
            <DatePicker
              type="range"
              label="Date Range"
              selected={dateRange}
              onSelect={handleDateRangeChange}
              dateFormat="MMM d, yyyy"
            />
          </div>
          
          <div className="w-48">
            <Select
              value={selectedFilters.campusId}
              onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, campusId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Campuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Campuses</SelectItem>
                {campuses?.items?.map(campus => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-48">
            <Select
              value={selectedFilters.eventType}
              onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, eventType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Event Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Event Types</SelectItem>
                <SelectItem value="REGISTRATION">Registration</SelectItem>
                <SelectItem value="ADD_DROP">Add/Drop</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="EXAMINATION">Examination</SelectItem>
                <SelectItem value="GRADING">Grading</SelectItem>
                <SelectItem value="ORIENTATION">Orientation</SelectItem>
                <SelectItem value="GRADUATION">Graduation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <CalendarIcon className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading calendar...</span>
          </div>
        ) : calendarEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No Events Found</h3>
            <p className="mt-1">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <Calendar 
            events={calendarEvents}
            onEventClick={handleEventClick}
            userType={user.userType as any}
            view={view}
            onViewChange={handleViewChange}
          />
        )}
      </Card>
    </div>
  );
} 