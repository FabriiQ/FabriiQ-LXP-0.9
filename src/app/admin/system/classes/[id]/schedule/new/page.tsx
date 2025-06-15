'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Input } from '@/components/ui/forms/input';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { DayOfWeek, PeriodType, SystemStatus } from '@prisma/client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Textarea } from '@/components/ui/forms/textarea';

// Form schema
const scheduleFormSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  periodType: z.nativeEnum(PeriodType),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  facilityId: z.string().optional(),
  notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export default function NewSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;

  const { data: classData } = api.class.getById.useQuery({
    classId,
  });

  const { data: subjects } = api.subject.list.useQuery({
    courseId: classData?.courseCampusId ? classData.courseCampus?.courseId : undefined,
    status: SystemStatus.ACTIVE
  }, {
    enabled: !!classData?.courseCampus?.courseId
  });

  const { data: teachers } = api.teacher.getAllTeachers.useQuery({
    campusId: classData?.campusId || ''
  }, {
    enabled: !!classData?.campusId
  });

  const { data: facilities } = api.facility.getFacilitiesByCampus.useQuery({
    campusId: classData?.campusId || '',
    status: SystemStatus.ACTIVE
  }, {
    enabled: !!classData?.campusId
  });

  const utils = api.useUtils();

  // Create schedule mutation
  const createScheduleMutation = api.schedule.create.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Schedule period created successfully',
      });
      utils.class.getSchedule.invalidate({ classId });
      router.push(`/admin/system/classes/${classId}/schedule`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Form
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      dayOfWeek: DayOfWeek.MONDAY,
      periodType: PeriodType.LECTURE,
      startTime: '09:00',
      endTime: '10:00',
      subjectId: '',
      teacherId: '',
      facilityId: '',
      notes: '',
    },
  });

  // Handle form submission
  const onSubmit = (values: ScheduleFormValues) => {
    createScheduleMutation.mutate({
      classId,
      dayOfWeek: values.dayOfWeek,
      periodType: values.periodType,
      startTime: values.startTime,
      endTime: values.endTime,
      teacherId: values.teacherId || '',
      facilityId: values.facilityId || '',
      status: SystemStatus.ACTIVE,
    });
  };

  return (
    <PageLayout
      title="Add Schedule Period"
      description="Add a new period to the class schedule"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/system/classes' },
        { label: classData?.name || 'Class', href: `/admin/system/classes/${classId}` },
        { label: 'Schedule', href: `/admin/system/classes/${classId}/schedule` },
        { label: 'Add Period', href: '#' },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/admin/system/classes/${classId}/schedule`}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Schedule
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Add Schedule Period</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(DayOfWeek).map((day) => (
                            <SelectItem key={day} value={day}>
                              {day.charAt(0) + day.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="periodType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(PeriodType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0) + type.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {subjects?.items?.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {teachers?.items?.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {facilities?.items?.map((facility) => (
                            <SelectItem key={facility.id} value={facility.id}>
                              {facility.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this schedule period"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/admin/system/classes/${classId}/schedule`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createScheduleMutation.isLoading}
                >
                  {createScheduleMutation.isLoading ? 'Creating...' : 'Create Schedule Period'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
