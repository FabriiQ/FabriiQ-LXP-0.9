'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { ChevronLeft, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { api } from '@/trpc/react';
import { DataTable } from '@/components/ui/data-display/data-table';
import { format } from 'date-fns';
import { DayOfWeek } from '@prisma/client';
import { Badge } from '@/components/ui/atoms/badge';

export default function ClassSchedulePage() {
  const params = useParams();
  const classId = params?.id as string;

  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'ALL'>('ALL');

  const dayOrder = {
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6,
    'SUNDAY': 7,
  };

  const { data: classData, isLoading } = api.class.getById.useQuery({
    classId,
  });

  const { data: schedule, isLoading: isLoadingSchedule } = api.class.getSchedule.useQuery({
    classId,
  });

  const filteredPeriods = schedule?.periods?.filter(period =>
    selectedDay === 'ALL' || period.dayOfWeek === selectedDay
  ) || [];

  // Sort periods by day of week and start time
  const sortedPeriods = [...filteredPeriods].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return dayOrder[a.dayOfWeek as keyof typeof dayOrder] - dayOrder[b.dayOfWeek as keyof typeof dayOrder];
    }
    return a.startTime.toString().localeCompare(b.startTime.toString());
  });

  // Define columns for the data table
  const columns = [
    {
      header: 'Day',
      accessorKey: 'dayOfWeek',
      cell: ({ row }: any) => (
        <div className="font-medium">
          {row.original.dayOfWeek.charAt(0) + row.original.dayOfWeek.slice(1).toLowerCase()}
        </div>
      ),
    },
    {
      header: 'Time',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>
            {row.original.startTime} - {row.original.endTime}
          </span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'periodType',
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {row.original.periodType.charAt(0) + row.original.periodType.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      header: 'Subject',
      accessorKey: 'subject.name',
      cell: ({ row }: any) => (
        <div>{row.original.subject?.name || 'N/A'}</div>
      ),
    },
    {
      header: 'Facility',
      accessorKey: 'facility.name',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{row.original.facility?.name || 'N/A'}</span>
        </div>
      ),
    },
    {
      header: 'Teacher',
      accessorKey: 'teacher.name',
      cell: ({ row }: any) => (
        <div>{row.original.teacher?.name || 'N/A'}</div>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/system/classes/${classId}/schedule/${row.original.id}/edit`}>
              Edit
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout
      title={`Schedule: ${classData?.name || ''}`}
      description="Manage class schedule"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/system/classes' },
        { label: classData?.name || 'Class', href: `/admin/system/classes/${classId}` },
        { label: 'Schedule', href: '#' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/system/classes/${classId}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/system/classes/${classId}/schedule/new`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Period
            </Link>
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Button
                variant={selectedDay === 'ALL' ? 'default' : 'outline'}
                onClick={() => setSelectedDay('ALL')}
              >
                All Days
              </Button>
              {Object.keys(dayOrder).map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'default' : 'outline'}
                  onClick={() => setSelectedDay(day as DayOfWeek)}
                >
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={sortedPeriods}
            isLoading={isLoading || isLoadingSchedule}
            emptyMessage="No schedule periods found. Click 'Add Period' to create a new schedule."
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}
