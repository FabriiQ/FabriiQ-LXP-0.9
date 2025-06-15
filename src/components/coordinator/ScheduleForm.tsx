'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DayOfWeek, PeriodType, SystemStatus } from '@prisma/client';

// Define the form schema
const scheduleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  termId: z.string().min(1, 'Term is required'),
  classId: z.string().min(1, 'Class is required'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  usePattern: z.boolean().default(false),
  patternId: z.string().optional(),
  periods: z.array(
    z.object({
      dayOfWeek: z.nativeEnum(DayOfWeek),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
      type: z.nativeEnum(PeriodType),
      teacherId: z.string().min(1, 'Teacher is required'),
      facilityId: z.string().min(1, 'Facility is required'),
    })
  ).min(1, 'At least one period is required'),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleFormProps {
  terms: {
    id: string;
    name: string;
  }[];
  classes: {
    id: string;
    name: string;
  }[];
  teachers: {
    id: string;
    name: string;
  }[];
  facilities: {
    id: string;
    name: string;
  }[];
  patterns: {
    id: string;
    name: string;
  }[];
  defaultTermId?: string;
  defaultClassId?: string;
  onSuccess?: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

export function ScheduleForm({
  terms,
  classes,
  teachers,
  facilities,
  patterns,
  defaultTermId,
  defaultClassId,
  onSuccess,
  isSubmitting,
  setIsSubmitting,
}: ScheduleFormProps) {
  const { toast } = useToast();
  const [usePattern, setUsePattern] = useState(false);
  
  // Initialize form with default values
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: '',
      termId: defaultTermId || '',
      classId: defaultClassId || '',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      usePattern: false,
      periods: [
        {
          dayOfWeek: DayOfWeek.MONDAY,
          startTime: '09:00',
          endTime: '10:30',
          type: PeriodType.LECTURE,
          teacherId: '',
          facilityId: '',
        },
      ],
    },
  });
  
  // Create timetable mutation
  const createTimetableMutation = api.schedule.createTimetable.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Schedule created successfully',
        variant: 'success',
      });
      if (onSuccess) {
        onSuccess();
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create schedule',
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });
  
  // Apply schedule pattern mutation
  const applyPatternMutation = api.class.applySchedulePattern.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Schedule pattern applied successfully',
        variant: 'success',
      });
      if (onSuccess) {
        onSuccess();
      }
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply schedule pattern',
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });
  
  // Handle form submission
  const onSubmit = (values: ScheduleFormValues) => {
    setIsSubmitting(true);
    
    if (values.usePattern && values.patternId) {
      // Apply schedule pattern
      applyPatternMutation.mutate({
        patternId: values.patternId,
        classId: values.classId,
        type: PeriodType.LECTURE,
      });
    } else {
      // Create custom timetable
      createTimetableMutation.mutate({
        name: values.name,
        classId: values.classId,
        startDate: values.startDate,
        endDate: values.endDate,
        periods: values.periods,
      });
    }
  };
  
  // Add a new period
  const addPeriod = () => {
    const currentPeriods = form.getValues('periods') || [];
    form.setValue('periods', [
      ...currentPeriods,
      {
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '09:00',
        endTime: '10:30',
        type: PeriodType.LECTURE,
        teacherId: currentPeriods[0]?.teacherId || '',
        facilityId: currentPeriods[0]?.facilityId || '',
      },
    ]);
  };
  
  // Remove a period
  const removePeriod = (index: number) => {
    const currentPeriods = form.getValues('periods') || [];
    if (currentPeriods.length > 1) {
      form.setValue(
        'periods',
        currentPeriods.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: 'Error',
        description: 'At least one period is required',
        variant: 'error',
      });
    }
  };
  
  // Toggle pattern usage
  const toggleUsePattern = (value: boolean) => {
    setUsePattern(value);
    form.setValue('usePattern', value);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter schedule name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="termId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Term</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {terms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.name}
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
            name="classId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < form.getValues('startDate')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="border-t pt-6">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="usePattern"
              checked={usePattern}
              onCheckedChange={toggleUsePattern}
            />
            <label
              htmlFor="usePattern"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Use Schedule Pattern
            </label>
          </div>
          
          {usePattern ? (
            <FormField
              control={form.control}
              name="patternId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Pattern</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a pattern" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patterns.map((pattern) => (
                        <SelectItem key={pattern.id} value={pattern.id}>
                          {pattern.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Using a schedule pattern will automatically generate periods based on the pattern.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Periods</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPeriod}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Period
                </Button>
              </div>
              
              {form.watch('periods').map((_, index) => (
                <div key={index} className="border rounded-md p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Period {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePeriod(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`periods.${index}.dayOfWeek`}
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
                              <SelectItem value={DayOfWeek.MONDAY}>Monday</SelectItem>
                              <SelectItem value={DayOfWeek.TUESDAY}>Tuesday</SelectItem>
                              <SelectItem value={DayOfWeek.WEDNESDAY}>Wednesday</SelectItem>
                              <SelectItem value={DayOfWeek.THURSDAY}>Thursday</SelectItem>
                              <SelectItem value={DayOfWeek.FRIDAY}>Friday</SelectItem>
                              <SelectItem value={DayOfWeek.SATURDAY}>Saturday</SelectItem>
                              <SelectItem value={DayOfWeek.SUNDAY}>Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`periods.${index}.type`}
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
                              <SelectItem value={PeriodType.LECTURE}>Lecture</SelectItem>
                              <SelectItem value={PeriodType.LAB}>Lab</SelectItem>
                              <SelectItem value={PeriodType.TUTORIAL}>Tutorial</SelectItem>
                              <SelectItem value={PeriodType.EXAM}>Exam</SelectItem>
                              <SelectItem value={PeriodType.BREAK}>Break</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`periods.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`periods.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`periods.${index}.teacherId`}
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
                              {teachers.map((teacher) => (
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
                      name={`periods.${index}.facilityId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room/Facility</FormLabel>
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
                              {facilities.map((facility) => (
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
