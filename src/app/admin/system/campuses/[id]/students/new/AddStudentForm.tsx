'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/forms/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/forms/select';
import { Input } from '@/components/ui/forms/input';
import { DatePicker } from '@/components/ui/forms/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Define the form schema for existing student
const existingStudentSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student' }),
  programCampusId: z.string({ required_error: 'Please select a program' }).optional(),
  startDate: z.date({ required_error: 'Please select a start date' }),
  endDate: z.date().optional(),
});

// Define the form schema for new student
const newStudentSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phoneNumber: z.string().optional(),
  programCampusId: z.string({ required_error: 'Please select a program' }).optional(),
  startDate: z.date({ required_error: 'Please select a start date' }),
  endDate: z.date().optional(),
});

type ExistingStudentFormValues = z.infer<typeof existingStudentSchema>;
type NewStudentFormValues = z.infer<typeof newStudentSchema>;

interface AddStudentFormProps {
  campusId: string;
  programCampuses: any[];
}

export function AddStudentForm({
  campusId,
  programCampuses,
}: AddStudentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('existing');

  // Initialize form for existing student
  const existingStudentForm = useForm<ExistingStudentFormValues>({
    resolver: zodResolver(existingStudentSchema),
    defaultValues: {
      studentId: '',
      programCampusId: '',
      startDate: new Date(),
      endDate: undefined,
    },
  });

  // Initialize form for new student
  const newStudentForm = useForm<NewStudentFormValues>({
    resolver: zodResolver(newStudentSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      programCampusId: '',
      startDate: new Date(),
      endDate: undefined,
    },
  });

  const onSubmitExistingStudent = async (values: ExistingStudentFormValues) => {
    try {
      setIsSubmitting(true);
      // Here you would typically call your API to add the student
      // For now, we'll just simulate a successful addition
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('Student added to campus successfully');
      
      // Redirect back to students list
      router.push(`/admin/system/campuses/${campusId}/students`);
      router.refresh();
    } catch (error) {
      // Show error message
      alert('Failed to add student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitNewStudent = async (values: NewStudentFormValues) => {
    try {
      setIsSubmitting(true);
      // Here you would typically call your API to create and add the student
      // For now, we'll just simulate a successful creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert('New student created and added to campus successfully');
      
      // Redirect back to students list
      router.push(`/admin/system/campuses/${campusId}/students`);
      router.refresh();
    } catch (error) {
      // Show error message
      alert('Failed to create student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs defaultValue="existing" onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="existing">Existing Student</TabsTrigger>
        <TabsTrigger value="new">New Student</TabsTrigger>
      </TabsList>
      
      <TabsContent value="existing">
        <Card>
          <CardHeader>
            <CardTitle>Add Existing Student</CardTitle>
            <CardDescription>
              Add a student who already exists in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...existingStudentForm}>
              <form onSubmit={existingStudentForm.handleSubmit(onSubmitExistingStudent)} className="space-y-6">
                <FormField
                  control={existingStudentForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* This would typically be populated from an API */}
                            <SelectItem value="student1">John Doe</SelectItem>
                            <SelectItem value="student2">Jane Smith</SelectItem>
                            <SelectItem value="student3">Bob Johnson</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Select an existing student to add to this campus
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={existingStudentForm.control}
                  name="programCampusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program (Optional)</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programCampuses.map((pc) => (
                              <SelectItem key={pc.id} value={pc.id}>
                                {pc.program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Optionally assign the student to a program
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={existingStudentForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          When will the student start at this campus?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={existingStudentForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          When will the student leave this campus? Leave blank if indefinite.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Student'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="new">
        <Card>
          <CardHeader>
            <CardTitle>Create New Student</CardTitle>
            <CardDescription>
              Create a new student and add them to this campus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...newStudentForm}>
              <form onSubmit={newStudentForm.handleSubmit(onSubmitNewStudent)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={newStudentForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newStudentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newStudentForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. +1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newStudentForm.control}
                    name="programCampusId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program (Optional)</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                            <SelectContent>
                              {programCampuses.map((pc) => (
                                <SelectItem key={pc.id} value={pc.id}>
                                  {pc.program.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Optionally assign the student to a program
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={newStudentForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          When will the student start at this campus?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newStudentForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          When will the student leave this campus? Leave blank if indefinite.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Student'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 