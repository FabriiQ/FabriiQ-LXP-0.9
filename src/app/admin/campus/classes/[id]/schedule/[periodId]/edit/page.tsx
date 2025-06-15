'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Input } from '@/components/ui/forms/input';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { DayOfWeek, PeriodType, SystemStatus } from '@prisma/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse } from 'date-fns';

interface Facility {
  id: string;
  name: string;
  type: string;
}

const editPeriodSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  facilityId: z.string().optional(),
  status: z.nativeEnum(SystemStatus).optional(),
})
.refine(data => {
  const start = parse(data.startTime, 'HH:mm', new Date());
  const end = parse(data.endTime, 'HH:mm', new Date());
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type FormData = z.infer<typeof editPeriodSchema>;

export default function EditPeriodPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const periodId = params?.periodId as string;
  const [isLoaded, setIsLoaded] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(editPeriodSchema),
  });
  
  const { data: classData } = api.class.getById.useQuery({
    classId,
  });

  const { data: periodData, isLoading: isLoadingPeriod } = api.class.getSchedule.useQuery({
    classId
  }, {
    enabled: !!classId
  });

  const period = periodData?.periods?.find(p => p.id === periodId);

  // Fetch facilities
  const { data: facilities } = api.facility.getFacilities.useQuery({
    campusId: classData?.campusId ?? '',
    status: 'ACTIVE',
  }, {
    enabled: !!classData?.campusId
  });

  // Update form when period data is loaded
  useEffect(() => {
    if (period && !isLoaded) {
      const startTimeFormatted = format(new Date(period.startTime), 'HH:mm');
      const endTimeFormatted = format(new Date(period.endTime), 'HH:mm');
      
      reset({
        dayOfWeek: period.dayOfWeek,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        facilityId: period.facilityId || undefined,
        status: period.status,
      });
      
      setIsLoaded(true);
    }
  }, [period, reset, isLoaded]);

  const updatePeriod = api.class.updatePeriod.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Period updated successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/schedule`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update period: ${error.message}`,
        variant: 'error',
      });
    },
  });

  const deletePeriod = api.class.deletePeriod.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Period deleted successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/schedule`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete period: ${error.message}`,
        variant: 'error',
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    // Convert time strings to Date objects
    const startDate = parse(data.startTime, 'HH:mm', new Date());
    const endDate = parse(data.endTime, 'HH:mm', new Date());

    updatePeriod.mutate({
      id: periodId,
      startTime: startDate,
      endTime: endDate,
      facilityId: data.facilityId,
      status: data.status,
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this period?')) {
      deletePeriod.mutate(periodId);
    }
  };

  if (isLoadingPeriod) {
    return <div>Loading...</div>;
  }

  if (!period) {
    return <div>Period not found</div>;
  }

  return (
    <PageLayout
      title="Edit Period"
      description="Edit class period in the schedule"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Schedule', href: `/admin/campus/classes/${classId}/schedule` },
        { label: 'Edit Period', href: '#' },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/admin/campus/classes/${classId}/schedule`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schedule
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Edit Period</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Day of Week</label>
              <Select
                value={watch('dayOfWeek')}
                onValueChange={(value) => setValue('dayOfWeek', value as DayOfWeek)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DayOfWeek).map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.dayOfWeek && (
                <p className="text-sm text-destructive">{errors.dayOfWeek.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input 
                  type="time"
                  {...register('startTime')}
                />
                {errors.startTime && (
                  <p className="text-sm text-destructive">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input 
                  type="time"
                  {...register('endTime')}
                />
                {errors.endTime && (
                  <p className="text-sm text-destructive">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Facility (Optional)</label>
              <Select
                value={watch('facilityId') || ''}
                onValueChange={(value) => setValue('facilityId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {facilities?.map((facility: Facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name} ({facility.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={watch('status') || 'ACTIVE'}
                onValueChange={(value) => setValue('status', value as SystemStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Period'}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 