'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { ArrowLeft, Plus, Calendar, Clock, MapPin } from 'lucide-react';
import { api } from '@/trpc/react';
import { DataTable } from '@/components/ui/data-display/data-table';
import { format } from 'date-fns';
import { DayOfWeek } from '@prisma/client';
import { Badge } from '@/components/ui/data-display/badge';

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

  const { data: classData } = api.class.getById.useQuery({
    classId,
  });

  const { data: schedule, isLoading: isLoadingSchedule } = api.class.getSchedule.useQuery({
    classId,
  });

  const filteredPeriods = schedule?.periods?.filter(period =>
    selectedDay === 'ALL' || period.dayOfWeek === selectedDay
  ) || [];

  // Sort periods by day and time
  const sortedPeriods = [...filteredPeriods].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return dayOrder[a.dayOfWeek as keyof typeof dayOrder] - dayOrder[b.dayOfWeek as keyof typeof dayOrder];
    }
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  const isLoading = isLoadingSchedule || false; // Ensure isLoading is always a boolean

  const columns = [
    {
      header: 'Day',
      accessorKey: 'dayOfWeek',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{row.original.dayOfWeek}</span>
        </div>
      ),
    },
    {
      header: 'Time',
      accessorKey: 'time',
      cell: ({ row }: any) => {
        const startTime = new Date(row.original.startTime);
        const endTime = new Date(row.original.endTime);

        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Duration',
      accessorKey: 'duration',
      cell: ({ row }: any) => {
        const startTime = new Date(row.original.startTime);
        const endTime = new Date(row.original.endTime);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
      },
    },
    {
      header: 'Subject',
      id: 'subject',
      cell: ({ row }: any) => {
        // Get subject from assignment metadata or directly from the assignment
        const subjectName = row.original.assignment?.qualification?.subject?.name || 'Not assigned';
        return (
          <div className="flex items-center">
            <span>{subjectName}</span>
          </div>
        );
      },
    },
    {
      header: 'Teacher',
      id: 'teacher',
      cell: ({ row }: any) => {
        // Get teacher from assignment
        const teacherName = row.original.assignment?.qualification?.teacher?.user?.name || 'Not assigned';
        return (
          <div className="flex items-center">
            <span>{teacherName}</span>
          </div>
        );
      },
    },
    {
      header: 'Facility',
      accessorKey: 'facility',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{row.original.facility?.name || 'Not assigned'}</span>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {row.original.type}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/campus/classes/${classId}/schedule/${row.original.id}/edit`}>
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
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Schedule', href: '#' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${classId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/campus/classes/${classId}/schedule/new`}>
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
                  {day}
                </Button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            data={sortedPeriods}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}