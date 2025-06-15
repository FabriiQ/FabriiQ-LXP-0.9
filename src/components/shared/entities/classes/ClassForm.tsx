'use client';

import React from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClassData, UserRole, SystemStatus } from './types';

// Define form schema with zod
const classFormSchema = z.object({
  // Basic Information
  name: z.string().min(3, { message: 'Class name must be at least 3 characters' }),
  code: z.string().min(2, { message: 'Class code must be at least 2 characters' }),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'UPCOMING', 'COMPLETED', 'INACTIVE', 'ARCHIVED']),
  
  // Capacity
  minCapacity: z.coerce.number().min(1, { message: 'Minimum capacity must be at least 1' }),
  maxCapacity: z.coerce.number().min(1, { message: 'Maximum capacity must be at least 1' }),
  
  // Relations
  courseCampusId: z.string().min(1, { message: 'Course is required' }),
  termId: z.string().min(1, { message: 'Term is required' }),
  classTeacherId: z.string().optional(),
  facilityId: z.string().optional(),
  programCampusId: z.string().optional(),
  campusId: z.string().min(1, { message: 'Campus is required' }),
});

// Define form data type
type ClassFormValues = z.infer<typeof classFormSchema>;

export interface CourseOption {
  id: string;
  name: string;
  code: string;
}

export interface TeacherOption {
  id: string;
  name: string;
}

export interface TermOption {
  id: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
}

export interface FacilityOption {
  id: string;
  name: string;
  code: string;
}

export interface ProgramOption {
  id: string;
  name: string;
  code: string;
}

export interface CampusOption {
  id: string;
  name: string;
  code: string;
}

export interface ClassFormProps {
  /**
   * Class data for edit mode (optional for create mode)
   */
  classData?: Partial<ClassData>;
  
  /**
   * User role for role-specific rendering
   */
  userRole: UserRole;
  
  /**
   * Available courses
   */
  courses: CourseOption[];
  
  /**
   * Available teachers
   */
  teachers: TeacherOption[];
  
  /**
   * Available terms
   */
  terms: TermOption[];
  
  /**
   * Available facilities
   */
  facilities?: FacilityOption[];
  
  /**
   * Available programs
   */
  programs?: ProgramOption[];
  
  /**
   * Available campuses
   */
  campuses: CampusOption[];
  
  /**
   * Form submission callback
   */
  onSubmit: (values: ClassFormValues) => void;
  
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
 * ClassForm component with mobile-first design
 * 
 * Features:
 * - Role-specific field rendering
 * - Form validation with zod
 * - Create and edit modes
 * - Loading and error states
 * 
 * @example
 * ```tsx
 * <ClassForm 
 *   userRole={UserRole.TEACHER}
 *   courses={courses}
 *   teachers={teachers}
 *   terms={terms}
 *   campuses={campuses}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   mode="create"
 * />
 * ```
 */
export const ClassForm: React.FC<ClassFormProps> = ({
  classData,
  userRole,
  courses,
  teachers,
  terms,
  facilities = [],
  programs = [],
  campuses,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
  mode = 'create',
  className,
}) => {
  // Initialize form with default values or existing class data
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: classData?.name || '',
      code: classData?.code || '',
      description: classData?.description || '',
      status: classData?.status || 'UPCOMING',
      minCapacity: classData?.minCapacity || 10,
      maxCapacity: classData?.maxCapacity || 30,
      courseCampusId: classData?.courseCampusId || '',
      termId: classData?.termId || '',
      classTeacherId: classData?.classTeacherId || '',
      facilityId: classData?.facilityId || '',
      programCampusId: classData?.programCampusId || '',
      campusId: classData?.campusId || '',
    },
  });
  
  // Handle form submission
  const handleSubmit = (values: ClassFormValues) => {
    onSubmit(values);
  };
  
  // Determine which fields to show based on user role
  const canEditBasicInfo = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN, 
    UserRole.COORDINATOR
  ].includes(userRole);
  
  const canEditCapacity = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN
  ].includes(userRole);
  
  const canEditTeacher = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN, 
    UserRole.COORDINATOR
  ].includes(userRole);
  
  const canEditFacility = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN
  ].includes(userRole);
  
  const canEditProgram = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN
  ].includes(userRole);
  
  const canEditCampus = [
    UserRole.SYSTEM_ADMIN
  ].includes(userRole);
  
  const canEditStatus = [
    UserRole.SYSTEM_ADMIN, 
    UserRole.CAMPUS_ADMIN
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
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'create' ? 'Create New Class' : 'Edit Class'}</CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Fill in the details to create a new class' 
              : 'Update the class details'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                  <TabsTrigger value="assignment">Assignment</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  {/* Class Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter class name" 
                            {...field} 
                            disabled={!canEditBasicInfo || isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          The full name of the class
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Class Code */}
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter class code" 
                            {...field} 
                            disabled={!canEditBasicInfo || isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          A unique code for the class (e.g., CL-101)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter class description" 
                            {...field} 
                            disabled={!canEditBasicInfo || isLoading}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of the class
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Course */}
                  <FormField
                    control={form.control}
                    name="courseCampusId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!canEditBasicInfo || isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name} ({course.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The course this class belongs to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Term */}
                  <FormField
                    control={form.control}
                    name="termId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!canEditBasicInfo || isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {terms.map((term) => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.name} ({term.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The term this class belongs to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Capacity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Capacity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!canEditCapacity || isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum number of students
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Capacity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!canEditCapacity || isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of students
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* Schedule Tab */}
                <TabsContent value="schedule" className="space-y-4 pt-4">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Schedule settings will be available in a future update.
                    </p>
                  </div>
                </TabsContent>
                
                {/* Assignment Tab */}
                <TabsContent value="assignment" className="space-y-4 pt-4">
                  {/* Teacher */}
                  <FormField
                    control={form.control}
                    name="classTeacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!canEditTeacher || isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No teacher assigned</SelectItem>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The teacher assigned to this class
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Facility */}
                  <FormField
                    control={form.control}
                    name="facilityId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facility</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!canEditFacility || isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a facility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No facility assigned</SelectItem>
                            {facilities.map((facility) => (
                              <SelectItem key={facility.id} value={facility.id}>
                                {facility.name} ({facility.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The facility where this class will be held
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="py-4">
                    <Separator />
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Student enrollment will be available in a future update.
                    </p>
                  </div>
                </TabsContent>
                
                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 pt-4">
                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!canEditStatus || isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UPCOMING">Upcoming</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The current status of the class
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Program */}
                  {canEditProgram && (
                    <FormField
                      control={form.control}
                      name="programCampusId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a program" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">No program assigned</SelectItem>
                              {programs.map((program) => (
                                <SelectItem key={program.id} value={program.id}>
                                  {program.name} ({program.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The program this class belongs to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Campus */}
                  {canEditCampus && (
                    <FormField
                      control={form.control}
                      name="campusId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campus</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a campus" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {campuses.map((campus) => (
                                <SelectItem key={campus.id} value={campus.id}>
                                  {campus.name} ({campus.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The campus this class belongs to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-2 pt-4">
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'create' ? 'Create Class' : 'Update Class'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassForm;
