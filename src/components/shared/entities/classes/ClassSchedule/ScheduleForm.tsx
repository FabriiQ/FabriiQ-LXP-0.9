'use client';

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  CalendarIcon, 
  Clock, 
  Loader2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parse, addMinutes } from 'date-fns';
import { UserRole, ClassData } from '../types';

// Define form schema with zod
const scheduleFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  type: z.string().min(1, { message: 'Type is required' }),
  date: z.date({ required_error: 'Date is required' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Start time must be in HH:MM format' }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'End time must be in HH:MM format' }),
  facilityId: z.string().optional(),
  teacherId: z.string().optional(),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.string().optional(),
  recurrenceEndDate: z.date().optional(),
}).refine(data => {
  if (!data.startTime || !data.endTime) return true;
  
  const startTime = parse(data.startTime, 'HH:mm', new Date());
  const endTime = parse(data.endTime, 'HH:mm', new Date());
  
  return endTime > startTime;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// Define form data type
type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export interface ScheduleItem {
  id?: string;
  title: string;
  type: string;
  date: Date;
  startTime: string;
  endTime: string;
  facilityId?: string;
  teacherId?: string;
  description?: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEndDate?: Date;
}

export interface ScheduleFormProps {
  /**
   * Class data
   */
  classData: ClassData;
  
  /**
   * Schedule item for edit mode (optional for create mode)
   */
  scheduleItem?: ScheduleItem;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Available schedule types
   */
  scheduleTypes: { id: string; name: string }[];
  
  /**
   * Available facilities
   */
  facilities?: { id: string; name: string }[];
  
  /**
   * Available teachers
   */
  teachers?: { id: string; name: string }[];
  
  /**
   * Form submission callback
   */
  onSubmit: (values: ScheduleFormValues) => void;
  
  /**
   * Form cancel callback
   */
  onCancel?: () => void;
  
  /**
   * Loading state
   * @default false
   */
  isLoading?: boolean;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Form mode
   * @default 'create'
   */
  mode?: 'create' | 'edit';
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ScheduleForm component with mobile-first design
 * 
 * Features:
 * - Role-specific field visibility
 * - Form validation with zod
 * - Create and edit modes
 * - Date and time selection
 * - Recurrence options
 * 
 * @example
 * ```tsx
 * <ScheduleForm 
 *   classData={classData}
 *   scheduleTypes={scheduleTypes}
 *   facilities={facilities}
 *   teachers={teachers}
 *   userRole={UserRole.TEACHER}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   mode="create"
 * />
 * ```
 */
export const ScheduleForm: React.FC<ScheduleFormProps> = ({
  classData,
  scheduleItem,
  userRole,
  scheduleTypes,
  facilities = [],
  teachers = [],
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  mode = 'create',
  className,
}) => {
  // State for recurrence
  const [isRecurring, setIsRecurring] = useState(scheduleItem?.isRecurring || false);
  
  // Initialize form with default values or existing schedule item
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      title: scheduleItem?.title || '',
      type: scheduleItem?.type || '',
      date: scheduleItem?.date || new Date(),
      startTime: scheduleItem?.startTime || '09:00',
      endTime: scheduleItem?.endTime || '10:00',
      facilityId: scheduleItem?.facilityId || '',
      teacherId: scheduleItem?.teacherId || '',
      description: scheduleItem?.description || '',
      isRecurring: scheduleItem?.isRecurring || false,
      recurrencePattern: scheduleItem?.recurrencePattern || 'weekly',
      recurrenceEndDate: scheduleItem?.recurrenceEndDate,
    },
  });
  
  // Handle form submission
  const handleSubmit = (values: ScheduleFormValues) => {
    onSubmit(values);
  };
  
  // Handle recurrence change
  const handleRecurrenceChange = (checked: boolean) => {
    setIsRecurring(checked);
    form.setValue('isRecurring', checked);
  };
  
  // Determine which fields to show based on user role
  const canEditSchedule = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN, 
    UserRole.COORDINATOR,
    UserRole.TEACHER
  ].includes(userRole);
  
  const canAssignTeacher = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN, 
    UserRole.COORDINATOR
  ].includes(userRole);
  
  const canAssignFacility = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN, 
    UserRole.COORDINATOR
  ].includes(userRole);
  
  // Render error message
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create Schedule Item' : 'Edit Schedule Item'}</CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Add a new schedule item to the class calendar' 
            : 'Update the schedule item details'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter title" 
                      {...field} 
                      disabled={!canEditSchedule || isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The title of the schedule item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!canEditSchedule || isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {scheduleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of schedule item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!canEditSchedule || isLoading}
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
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date of the schedule item
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Time Range */}
              <div className="space-y-4">
                {/* Start Time */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="time" 
                            {...field} 
                            disabled={!canEditSchedule || isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* End Time */}
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="time" 
                            {...field} 
                            disabled={!canEditSchedule || isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Facility and Teacher */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facility */}
              {canAssignFacility && (
                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No facility</SelectItem>
                          {facilities.map((facility) => (
                            <SelectItem key={facility.id} value={facility.id}>
                              {facility.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The facility where this schedule item will take place
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Teacher */}
              {canAssignTeacher && (
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No teacher</SelectItem>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The teacher for this schedule item
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter description" 
                      {...field} 
                      disabled={!canEditSchedule || isLoading}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about the schedule item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Recurrence */}
            <div className="space-y-4 border rounded-md p-4">
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          handleRecurrenceChange(checked as boolean);
                        }}
                        disabled={!canEditSchedule || isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring Schedule</FormLabel>
                      <FormDescription>
                        Set this schedule item to repeat
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Recurrence Pattern */}
                  <FormField
                    control={form.control}
                    name="recurrencePattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Pattern</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!canEditSchedule || isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Recurrence End Date */}
                  <FormField
                    control={form.control}
                    name="recurrenceEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={!canEditSchedule || isLoading}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>No end date</span>
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
                              disabled={(date) => {
                                const formDate = form.getValues('date');
                                return date < formDate;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the recurrence should end (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button 
          onClick={form.handleSubmit(handleSubmit)}
          disabled={!canEditSchedule || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          {mode === 'create' ? 'Create Schedule' : 'Update Schedule'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ScheduleForm;
