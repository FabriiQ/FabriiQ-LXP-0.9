'use client';

import { useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, Calendar, Clock, Edit, Trash, User, Building } from 'lucide-react';
import { DayOfWeek, PeriodType } from '@prisma/client';
import { useToast } from '@/components/ui/feedback/toast';
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

export default function ScheduleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const unwrappedParams = use(params);
  const timetableId = unwrappedParams.id;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch timetable details
  const { data: timetableData, isLoading: isLoadingTimetable } = api.schedule.getTimetable.useQuery(
    { id: timetableId },
    { enabled: !!timetableId }
  );
  
  // Fetch timetable stats
  const { data: statsData, isLoading: isLoadingStats } = api.schedule.getStats.useQuery(
    { id: timetableId },
    { enabled: !!timetableId }
  );
  
  // Delete timetable mutation
  const deleteTimetableMutation = api.schedule.deleteTimetable.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Timetable deleted successfully',
        variant: 'success',
      });
      router.push('/admin/coordinator/schedules');
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
    deleteTimetableMutation.mutate(timetableId);
  };
  
  const isLoading = isLoadingTimetable || isLoadingStats;
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!timetableData || !statsData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground">Schedule not found</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/admin/coordinator/schedules')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Schedules
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { timetable } = statsData;
  const periods = timetableData.periods || [];
  
  // Group periods by day
  const periodsByDay = periods.reduce((acc, period) => {
    if (!acc[period.dayOfWeek]) {
      acc[period.dayOfWeek] = [];
    }
    acc[period.dayOfWeek].push(period);
    return acc;
  }, {} as Record<DayOfWeek, any[]>);
  
  // Sort periods by start time
  Object.keys(periodsByDay).forEach((day) => {
    periodsByDay[day as DayOfWeek].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });
  
  // Order days of week
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
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/coordinator/schedules')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedules
          </Button>
          <PageHeader
            title={timetable.name || `Schedule for ${timetable.class?.name || 'Unknown Class'}`}
            description={`Schedule details and periods`}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/coordinator/schedules/${timetableId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Schedule
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete Schedule
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="periods">Periods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timetable.class?.name || 'Unknown Class'}</div>
                <p className="text-sm text-muted-foreground">
                  {timetable.class?.course?.name || 'Unknown Course'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.stats.durationInDays} days</div>
                <p className="text-sm text-muted-foreground">
                  {new Date(timetable.startDate).toLocaleDateString()} - {new Date(timetable.endDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData.stats.totalPeriods}</div>
                <p className="text-sm text-muted-foreground">
                  Across {Object.keys(periodsByDay).length} days
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Period Types</CardTitle>
              <CardDescription>
                Breakdown of periods by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(statsData.stats.periodsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getPeriodTypeColor(type as PeriodType)}>
                        {getPeriodTypeLabel(type as PeriodType)}
                      </Badge>
                      <span>{count} periods</span>
                    </div>
                    <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${(count as number / statsData.stats.totalPeriods) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="periods" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {dayOrder.map((day) => (
              <Card key={day} className="overflow-hidden">
                <div className="bg-primary text-primary-foreground p-2 text-center font-medium">
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </div>
                <CardContent className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
                  {periodsByDay[day] && periodsByDay[day].length > 0 ? (
                    periodsByDay[day].map((period) => (
                      <div
                        key={period.id}
                        className={`p-2 rounded border text-xs ${getPeriodTypeColor(period.type)}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="outline" className="text-[10px]">
                            {getPeriodTypeLabel(period.type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatTime(period.startTime)} - {formatTime(period.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          <span>
                            {period.assignment?.teacher?.user?.name || 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Building className="h-3 w-3" />
                          <span>
                            {period.facility?.name || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">No classes</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
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
