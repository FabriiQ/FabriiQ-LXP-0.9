'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Clock, Edit, Trash, Plus, Eye, Search } from 'lucide-react';
import { DayOfWeek, PeriodType, SystemStatus } from '@prisma/client';
import { useToast } from '@/components/ui/feedback/toast';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-display/data-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CoordinatorScheduleListProps {
  termId: string;
  classId?: string;
  courseId?: string;
}

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

const getPeriodTypeLabel = (type: PeriodType) => {
  switch (type) {
    case 'LECTURE':
      return 'Lecture';
    case 'LAB':
      return 'Lab';
    case 'TUTORIAL':
      return 'Tutorial';
    case 'EXAM':
      return 'Exam';
    case 'BREAK':
      return 'Break';
    default:
      return type;
  }
};

export function CoordinatorScheduleList({
  termId,
  classId,
  courseId,
}: CoordinatorScheduleListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch timetables
  const { data: timetablesData, isLoading: isLoadingTimetables, refetch: refetchTimetables } = api.schedule.listTimetables.useQuery(
    {
      status: SystemStatus.ACTIVE,
      ...(classId && { classId }),
    },
    {
      enabled: !!termId,
      refetchOnWindowFocus: false,
    }
  );
  
  // Delete timetable mutation
  const deleteTimetableMutation = api.schedule.deleteTimetable.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Timetable deleted successfully',
        variant: 'success',
      });
      refetchTimetables();
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete timetable',
        variant: 'error',
      });
    },
  });
  
  const handleDeleteTimetable = () => {
    if (selectedTimetableId) {
      deleteTimetableMutation.mutate(selectedTimetableId);
    }
  };
  
  if (isLoadingTimetables) {
    return <LoadingSpinner />;
  }
  
  const timetables = timetablesData?.items || [];
  
  // Flatten timetables to create a list of all periods
  const allPeriods = timetables.flatMap(timetable => 
    timetable.periods.map(period => ({
      id: period.id,
      timetableId: timetable.id,
      className: timetable.class?.name || 'Unknown Class',
      dayOfWeek: period.dayOfWeek,
      startTime: period.startTime,
      endTime: period.endTime,
      type: period.type,
      teacher: period.assignment?.teacher?.user?.name || 'Unassigned',
      facility: period.facility?.name || 'Unassigned',
    }))
  );
  
  // Filter periods based on search query
  const filteredPeriods = searchQuery
    ? allPeriods.filter(
        period =>
          period.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
          period.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
          period.facility.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allPeriods;
  
  // Sort periods by day of week and start time
  const dayOrder: Record<DayOfWeek, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
  };
  
  filteredPeriods.sort((a, b) => {
    const dayDiff = dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
  
  // Define columns for the data table
  const columns = [
    {
      accessorKey: 'className',
      header: 'Class',
    },
    {
      accessorKey: 'dayOfWeek',
      header: 'Day',
      cell: ({ row }: any) => (
        <span>
          {row.original.dayOfWeek.charAt(0) + row.original.dayOfWeek.slice(1).toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: 'time',
      header: 'Time',
      cell: ({ row }: any) => (
        <span>
          {formatTime(row.original.startTime)} - {formatTime(row.original.endTime)}
        </span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: any) => (
        <Badge variant="outline">
          {getPeriodTypeLabel(row.original.type)}
        </Badge>
      ),
    },
    {
      accessorKey: 'teacher',
      header: 'Teacher',
    },
    {
      accessorKey: 'facility',
      header: 'Room',
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/coordinator/schedules/${row.original.timetableId}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/coordinator/schedules/${row.original.timetableId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500"
            onClick={() => {
              setSelectedTimetableId(row.original.timetableId);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    },
  ];
  
  if (filteredPeriods.length === 0) {
    return (
      <EmptyState
        title="No Schedules Found"
        description="There are no schedules available for the selected filters."
        icon={<Calendar className="h-10 w-10" />}
        action={
          <Button onClick={() => router.push('/admin/coordinator/schedules/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Schedule
          </Button>
        }
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search schedules..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push('/admin/coordinator/schedules/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>
      
      <DataTable
        columns={columns}
        data={filteredPeriods}
        pagination
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected timetable and all associated periods.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTimetable} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
