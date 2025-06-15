'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Clock, Edit, Trash, Plus, Eye } from 'lucide-react';
import { DayOfWeek, PeriodType, SystemStatus } from '@prisma/client';
import { useToast } from '@/components/ui/feedback/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CoordinatorTimetableViewProps {
  termId: string;
  classId?: string;
  courseId?: string;
}

const dayOrder: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

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

const getPeriodTypeColor = (type: PeriodType) => {
  switch (type) {
    case 'LECTURE':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'LAB':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'TUTORIAL':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'EXAM':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'BREAK':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function CoordinatorTimetableView({
  termId,
  classId,
  courseId,
}: CoordinatorTimetableViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
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
  
  // Fetch term details
  const { data: termData, isLoading: isLoadingTerm } = api.term.getById.useQuery(
    { id: termId },
    { enabled: !!termId }
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
  
  const isLoading = isLoadingTimetables || isLoadingTerm;
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  const timetables = timetablesData?.items || [];
  
  // Group timetable periods by day
  const timetablesByDay = dayOrder.reduce((acc, day) => {
    acc[day] = [];
    
    // Add periods for each timetable
    timetables.forEach(timetable => {
      const periodsForDay = timetable.periods.filter(period => period.dayOfWeek === day);
      
      if (periodsForDay.length > 0) {
        // Sort periods by start time
        periodsForDay.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        acc[day].push({
          timetableId: timetable.id,
          className: timetable.class?.name || 'Unknown Class',
          periods: periodsForDay,
        });
      }
    });
    
    return acc;
  }, {} as Record<DayOfWeek, Array<{ timetableId: string; className: string; periods: any[] }>>);
  
  // Check if we have any timetables with periods
  const hasTimetables = Object.values(timetablesByDay).some(dayTimetables => dayTimetables.length > 0);
  
  if (!hasTimetables) {
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {dayOrder.map((day) => (
          <Card key={day} className="overflow-hidden">
            <div className="bg-primary text-primary-foreground p-2 text-center font-medium">
              {day.charAt(0) + day.slice(1).toLowerCase()}
            </div>
            <CardContent className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
              {timetablesByDay[day].length > 0 ? (
                timetablesByDay[day].map((timetable) => (
                  <div key={timetable.timetableId} className="space-y-2">
                    <div className="text-sm font-medium">{timetable.className}</div>
                    {timetable.periods.map((period) => (
                      <div
                        key={period.id}
                        className={`p-2 rounded border text-xs ${getPeriodTypeColor(period.type)}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="outline" className="text-[10px]">
                            {getPeriodTypeLabel(period.type)}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => {
                                setSelectedTimetableId(timetable.timetableId);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => router.push(`/admin/coordinator/schedules/${timetable.timetableId}/edit`)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 text-red-500"
                              onClick={() => {
                                setSelectedTimetableId(timetable.timetableId);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(period.startTime)} - {formatTime(period.endTime)}
                          </span>
                        </div>
                        {period.assignment && (
                          <div className="mt-1 text-[10px]">
                            Teacher: {period.assignment.teacher?.user?.name || 'Unassigned'}
                          </div>
                        )}
                        {period.facility && (
                          <div className="mt-1 text-[10px]">
                            Room: {period.facility.name || 'Unassigned'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">No classes</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
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
      
      {/* View Timetable Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Timetable Details</DialogTitle>
            <DialogDescription>
              View detailed information about this timetable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTimetableId && (
              <TimetableDetails timetableId={selectedTimetableId} />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedTimetableId && (
              <Button onClick={() => router.push(`/admin/coordinator/schedules/${selectedTimetableId}`)}>
                View Full Details
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TimetableDetails({ timetableId }: { timetableId: string }) {
  const { data, isLoading } = api.schedule.getStats.useQuery(
    { id: timetableId },
    { enabled: !!timetableId }
  );
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!data) {
    return <div>No timetable details found</div>;
  }
  
  const { timetable, stats } = data;
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">Class</h3>
        <p>{timetable.class?.name || 'Unknown'}</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium">Duration</h3>
        <p>
          {new Date(timetable.startDate).toLocaleDateString()} - {new Date(timetable.endDate).toLocaleDateString()}
        </p>
        <p className="text-xs text-gray-500">{stats.durationInDays} days</p>
      </div>
      
      <div>
        <h3 className="text-sm font-medium">Periods</h3>
        <p>{stats.totalPeriods} total periods</p>
        <div className="mt-2 space-y-1">
          {Object.entries(stats.periodsByType).map(([type, count]) => (
            <div key={type} className="flex justify-between text-sm">
              <span>{getPeriodTypeLabel(type as PeriodType)}</span>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
