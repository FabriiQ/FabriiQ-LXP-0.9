'use client';

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
import { DayOfWeek, PeriodType, RecurrenceType } from '@prisma/client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { parse } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { DatePicker } from '@/components/ui/forms/date-picker';

interface Facility {
  id: string;
  name: string;
  type: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

// Schema for single period creation
const createPeriodSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  type: z.nativeEnum(PeriodType),
  facilityId: z.string().optional(),
  subjectId: z.string().optional(),
})
.refine(data => {
  const start = parse(data.startTime, 'HH:mm', new Date());
  const end = parse(data.endTime, 'HH:mm', new Date());
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

// Schema for schedule pattern creation
const createPatternSchema = z.object({
  name: z.string().min(1, 'Pattern name is required'),
  description: z.string().optional(),
  daysOfWeek: z.array(z.nativeEnum(DayOfWeek)).min(1, 'Select at least one day'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  recurrence: z.nativeEnum(RecurrenceType),
  startDate: z.date(),
  endDate: z.date().optional(),
  type: z.nativeEnum(PeriodType),
  facilityId: z.string().optional(),
  subjectId: z.string().optional(),
})
.refine(data => {
  const start = parse(data.startTime, 'HH:mm', new Date());
  const end = parse(data.endTime, 'HH:mm', new Date());
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
})
.refine(data => {
  if (data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type SinglePeriodFormData = z.infer<typeof createPeriodSchema>;
type PatternFormData = z.infer<typeof createPatternSchema>;

export default function NewPeriodPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;

  // Form for single period
  const singlePeriodForm = useForm<SinglePeriodFormData>({
    resolver: zodResolver(createPeriodSchema),
    defaultValues: {
      type: PeriodType.LECTURE
    }
  });

  // Form for recurring pattern
  const patternForm = useForm<PatternFormData>({
    resolver: zodResolver(createPatternSchema),
    defaultValues: {
      recurrence: RecurrenceType.WEEKLY,
      startDate: new Date(),
      daysOfWeek: [],
      type: PeriodType.LECTURE
    }
  });

  const { data: classData } = api.class.getById.useQuery({
    classId,
    include: {
      teachers: true,
      classTeacher: {
        include: {
          user: true
        }
      }
    }
  });

  const { data: facilities } = api.facility.getFacilities.useQuery({
    campusId: classData?.campusId ?? '',
    status: 'ACTIVE',
  }, {
    enabled: !!classData?.campusId
  });

  // Get subjects for the class
  const { data: subjects } = api.class.getSubjects.useQuery({
    classId
  }, {
    enabled: !!classId
  });

  const { data: teacherAssignments } = api.class.getTeacherAssignments.useQuery({
    classId
  }, {
    enabled: !!classId
  });

  // Get existing schedule patterns
  const { data: schedulePatterns } = api.schedulePattern.list.useQuery({
    page: 1,
    pageSize: 100
  });

  // Mutation for creating a single period
  const createPeriod = api.class.createPeriod.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Period created successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/schedule`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create period: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Mutation for creating a schedule pattern
  const createPattern = api.schedulePattern.create.useMutation({
    onSuccess: (data) => {
      // After creating the pattern, apply it to the timetable
      applyPatternToTimetable.mutate({
        patternId: data.id,
        classId,
        facilityId: patternForm.getValues().facilityId,
        type: patternForm.getValues().type
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create schedule pattern: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Mutation for applying a pattern to a timetable
  const applyPatternToTimetable = api.class.applySchedulePattern.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Schedule pattern applied successfully',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/schedule`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to apply schedule pattern: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Submit handler for single period
  const onSubmitSinglePeriod = async (data: SinglePeriodFormData) => {
    // Get the first teacher assignment if available
    const assignmentId = teacherAssignments?.[0]?.id;

    if (!assignmentId) {
      toast({
        title: 'Error',
        description: 'No teacher assigned to this class. Please assign a teacher first.',
        variant: 'error',
      });
      return;
    }

    // Convert time strings to Date objects
    const startDate = parse(data.startTime, 'HH:mm', new Date());
    const endDate = parse(data.endTime, 'HH:mm', new Date());

    createPeriod.mutate({
      classId,
      dayOfWeek: data.dayOfWeek,
      startTime: startDate,
      endTime: endDate,
      type: data.type,
      facilityId: data.facilityId,
      subjectId: data.subjectId,
      assignmentId
    });
  };

  // Submit handler for pattern creation
  const onSubmitPattern = async (data: PatternFormData) => {
    // First create the schedule pattern
    createPattern.mutate({
      name: data.name,
      description: data.description,
      daysOfWeek: data.daysOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      recurrence: data.recurrence,
      startDate: data.startDate,
      endDate: data.endDate
    });
  };

  // Handler for applying an existing pattern
  const handleApplyExistingPattern = (patternId: string) => {
    if (!patternId) return;

    // We don't need to check for teacher assignment here anymore
    // as the server will handle creating one if needed
    applyPatternToTimetable.mutate({
      patternId,
      classId,
      facilityId: patternForm.getValues().facilityId,
      type: patternForm.getValues().type,
      subjectId: patternForm.getValues().subjectId
    });
  };

  return (
    <PageLayout
      title="Add Schedule"
      description="Add periods to the class schedule"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Schedule', href: `/admin/campus/classes/${classId}/schedule` },
        { label: 'Add Schedule', href: '#' },
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add to Class Schedule</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create a single period or set up a recurring schedule pattern
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Period</TabsTrigger>
                <TabsTrigger value="pattern">Recurring Pattern</TabsTrigger>
              </TabsList>

              {/* Single Period Form */}
              <TabsContent value="single" className="pt-4">
                <form onSubmit={singlePeriodForm.handleSubmit(onSubmitSinglePeriod)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Day of Week</label>
                    <Select
                      value={singlePeriodForm.watch('dayOfWeek')}
                      onValueChange={(value) => singlePeriodForm.setValue('dayOfWeek', value as DayOfWeek)}
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
                    {singlePeriodForm.formState.errors.dayOfWeek && (
                      <p className="text-sm text-destructive">{singlePeriodForm.formState.errors.dayOfWeek.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Time</label>
                      <Input
                        type="time"
                        {...singlePeriodForm.register('startTime')}
                      />
                      {singlePeriodForm.formState.errors.startTime && (
                        <p className="text-sm text-destructive">{singlePeriodForm.formState.errors.startTime.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Time</label>
                      <Input
                        type="time"
                        {...singlePeriodForm.register('endTime')}
                      />
                      {singlePeriodForm.formState.errors.endTime && (
                        <p className="text-sm text-destructive">{singlePeriodForm.formState.errors.endTime.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Period Type</label>
                    <Select
                      value={singlePeriodForm.watch('type')}
                      onValueChange={(value) => singlePeriodForm.setValue('type', value as PeriodType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PeriodType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {singlePeriodForm.formState.errors.type && (
                      <p className="text-sm text-destructive">{singlePeriodForm.formState.errors.type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Facility (Optional)</label>
                    <Select
                      value={singlePeriodForm.watch('facilityId')}
                      onValueChange={(value) => singlePeriodForm.setValue('facilityId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilities?.map((facility: Facility) => (
                          <SelectItem key={facility.id} value={facility.id}>
                            {facility.name} ({facility.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject (Optional)</label>
                    <Select
                      value={singlePeriodForm.watch('subjectId')}
                      onValueChange={(value) => singlePeriodForm.setValue('subjectId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects?.map((subject: Subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full" disabled={singlePeriodForm.formState.isSubmitting}>
                    {singlePeriodForm.formState.isSubmitting ? 'Creating...' : 'Create Period'}
                  </Button>
                </form>
              </TabsContent>

              {/* Recurring Pattern Form */}
              <TabsContent value="pattern" className="pt-4">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Use Existing Pattern</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Pattern</label>
                        <Select
                          onValueChange={handleApplyExistingPattern}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a schedule pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            {schedulePatterns?.items?.map((pattern) => (
                              <SelectItem key={pattern.id} value={pattern.id}>
                                {pattern.name} ({pattern.recurrence})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Period Type</label>
                        <Select
                          value={patternForm.watch('type')}
                          onValueChange={(value) => patternForm.setValue('type', value as PeriodType)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(PeriodType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Facility (Optional)</label>
                        <Select
                          value={patternForm.watch('facilityId')}
                          onValueChange={(value) => patternForm.setValue('facilityId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                          <SelectContent>
                            {facilities?.map((facility: Facility) => (
                              <SelectItem key={facility.id} value={facility.id}>
                                {facility.name} ({facility.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">Create New Pattern</h3>
                    <form onSubmit={patternForm.handleSubmit(onSubmitPattern)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Pattern Name</label>
                          <Input
                            placeholder="e.g., Monday-Wednesday-Friday Morning"
                            {...patternForm.register('name')}
                          />
                          {patternForm.formState.errors.name && (
                            <p className="text-sm text-destructive">{patternForm.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description (Optional)</label>
                          <Input
                            placeholder="Optional description"
                            {...patternForm.register('description')}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Days of Week</label>
                        <div className="grid grid-cols-7 gap-2">
                          {Object.values(DayOfWeek).map((day) => (
                            <div key={day} className="flex items-center space-x-2">
                              <Checkbox
                                id={`day-${day}`}
                                checked={patternForm.watch('daysOfWeek')?.includes(day)}
                                onCheckedChange={(checked) => {
                                  const currentDays = patternForm.watch('daysOfWeek') || [];
                                  if (checked) {
                                    patternForm.setValue('daysOfWeek', [...currentDays, day]);
                                  } else {
                                    patternForm.setValue('daysOfWeek', currentDays.filter(d => d !== day));
                                  }
                                }}
                              />
                              <label htmlFor={`day-${day}`} className="text-sm">
                                {day.substring(0, 3)}
                              </label>
                            </div>
                          ))}
                        </div>
                        {patternForm.formState.errors.daysOfWeek && (
                          <p className="text-sm text-destructive">{patternForm.formState.errors.daysOfWeek.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Time</label>
                          <Input
                            type="time"
                            {...patternForm.register('startTime')}
                          />
                          {patternForm.formState.errors.startTime && (
                            <p className="text-sm text-destructive">{patternForm.formState.errors.startTime.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Time</label>
                          <Input
                            type="time"
                            {...patternForm.register('endTime')}
                          />
                          {patternForm.formState.errors.endTime && (
                            <p className="text-sm text-destructive">{patternForm.formState.errors.endTime.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Recurrence Type</label>
                        <Select
                          value={patternForm.watch('recurrence')}
                          onValueChange={(value) => patternForm.setValue('recurrence', value as RecurrenceType)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select recurrence type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(RecurrenceType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Date</label>
                          <Controller
                            control={patternForm.control}
                            name="startDate"
                            render={({ field }) => (
                              <DatePicker
                                date={field.value}
                                setDate={field.onChange}
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date (Optional)</label>
                          <Controller
                            control={patternForm.control}
                            name="endDate"
                            render={({ field }) => (
                              <DatePicker
                                date={field.value}
                                setDate={field.onChange}
                              />
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Period Type</label>
                        <Select
                          value={patternForm.watch('type')}
                          onValueChange={(value) => patternForm.setValue('type', value as PeriodType)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(PeriodType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Facility (Optional)</label>
                        <Select
                          value={patternForm.watch('facilityId')}
                          onValueChange={(value) => patternForm.setValue('facilityId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                          <SelectContent>
                            {facilities?.map((facility: Facility) => (
                              <SelectItem key={facility.id} value={facility.id}>
                                {facility.name} ({facility.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subject (Optional)</label>
                        <Select
                          value={patternForm.watch('subjectId')}
                          onValueChange={(value) => patternForm.setValue('subjectId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects?.map((subject: Subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" className="w-full" disabled={patternForm.formState.isSubmitting}>
                        {patternForm.formState.isSubmitting ? 'Creating...' : 'Create Pattern & Apply'}
                      </Button>
                    </form>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
