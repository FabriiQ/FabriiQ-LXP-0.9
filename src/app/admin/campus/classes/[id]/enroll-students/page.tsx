'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';

// Form schema for student enrollment
const formSchema = z.object({
  studentIds: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface Student {
  id: string;
  name: string;
  enrollmentNumber: string;
  email: string;
  isEnrolled?: boolean;
  enrollmentId?: string;
}

export default function EnrollStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const classId = typeof params?.id === 'string' ? params.id : '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<string[]>([]);
  const [enrollmentMap, setEnrollmentMap] = useState<Map<string, string>>(new Map());
  
  // Form initialization with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentIds: [],
    },
  });
  
  // Fetch class data using TRPC
  const { data: classDataResult } = api.class.getById.useQuery(
    { classId },
    { 
      enabled: !!classId,
      onSuccess: (data) => {
        if (data) {
          setClassData(data);
        }
      }
    }
  );
  
  // Fetch all students profiles using TRPC
  const { data: allStudentsData, isLoading: isLoadingAllStudents } = api.student.getAllStudentsByCampus.useQuery(
    { campusId: classData?.campusId },
    {
      enabled: !!classData?.campusId,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching students:', error);
        toast({
          title: 'Error',
          description: 'Failed to load students. Please try again.',
          variant: 'error',
        });
      }
    }
  );
  
  // Fetch enrolled students
  const { data: enrollmentsData, refetch: refetchEnrollments } = api.student.getStudentEnrollments.useQuery(
    { classId },
    { 
      enabled: !!classId,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching enrollments:', error);
      }
    }
  );
  
  // Combine the student data and enrollment data into a single derived state
  useEffect(() => {
    // Only process when we have all the necessary data
    if (!allStudentsData || !Array.isArray(allStudentsData)) {
      return;
    }
    
    // Process students data
    const processedStudents = allStudentsData
      .filter(student => student !== null && student !== undefined)
      .map((student) => {
        const studentId = student.id || '';
        
        // Check if student is enrolled
        let isEnrolled = false;
        let enrollmentId = undefined;
        
        // If we have enrollment data, check enrollment status
        if (enrollmentsData && Array.isArray(enrollmentsData)) {
          const enrollment = enrollmentsData.find(e => 
            e?.student?.id === studentId
          );
          
          if (enrollment) {
            isEnrolled = true;
            enrollmentId = enrollment.id;
          }
        }
        
        return {
          id: studentId,
          name: student?.user?.name || 'Unknown Student',
          enrollmentNumber: student?.enrollmentNumber || 'N/A',
          email: student?.user?.email || 'No Email',
          isEnrolled,
          enrollmentId,
        };
      });
    
    // Update student list
    setStudents(processedStudents);
    
    // Also create enrollment maps for later use
    const enrollmentIdMap = new Map<string, string>();
    const enrolledIds: string[] = [];
    
    if (enrollmentsData && Array.isArray(enrollmentsData)) {
      enrollmentsData.forEach((enrollment) => {
        if (enrollment?.student?.id && enrollment.id) {
          const studentId = enrollment.student.id;
          enrolledIds.push(studentId);
          enrollmentIdMap.set(studentId, enrollment.id);
        }
      });
    }
    
    setEnrollmentMap(enrollmentIdMap);
    setEnrolledStudents(enrolledIds);
    
    // Update form state with enrolled students
    if (enrolledIds.length > 0) {
      form.setValue('studentIds', enrolledIds);
    }
    
    // Update loading state when we have data
    if (classData) {
      setIsLoading(false);
    }
  }, [allStudentsData, enrollmentsData, classData, form]);
  
  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.enrollmentNumber?.toLowerCase().includes(query)
    );
  });
  
  // Mutations
  const createEnrollmentMutation = api.enrollment.createEnrollment.useMutation();
  const bulkEnrollMutation = api.enrollment.bulkEnroll.useMutation();
  const deleteEnrollmentMutation = api.enrollment.deleteEnrollment.useMutation();
  
  // Form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Ensure we have valid data
      const studentIdsToUpdate = Array.isArray(data.studentIds) ? data.studentIds : [];
      const currentEnrolledIds = Array.isArray(enrolledStudents) ? enrolledStudents : [];
      
      // Determine which students to add and which to remove
      const studentsToAdd = studentIdsToUpdate.filter(id => !currentEnrolledIds.includes(id));
      const studentsToRemove = currentEnrolledIds.filter(id => !studentIdsToUpdate.includes(id));
      
      // Get current user ID
      const currentUserId = session?.user?.id || '';
      
      if (!currentUserId) {
        throw new Error('User session not found. Please log in again.');
      }
      
      // Handle new enrollments
      if (studentsToAdd.length > 0) {
        try {
          const result = await bulkEnrollMutation.mutateAsync({
            classId,
            studentIds: studentsToAdd,
            createdById: currentUserId, 
            startDate: new Date()
          });
          console.log(`Successfully enrolled ${result.totalEnrolled} students`);
        } catch (error) {
          console.error('Error during bulk enrollment:', error);
          
          // Fall back to individual enrollments
          for (const studentId of studentsToAdd) {
            try {
              await createEnrollmentMutation.mutateAsync({
                studentId,
                classId,
                createdById: currentUserId,
                startDate: new Date()
              });
            } catch (enrollError) {
              console.error(`Failed to enroll student ${studentId}:`, enrollError);
            }
          }
        }
      }
      
      // Handle removals
      if (studentsToRemove.length > 0) {
        const removePromises = studentsToRemove.map(async (studentId) => {
          const enrollmentId = enrollmentMap.get(studentId);
          if (enrollmentId) {
            try {
              await deleteEnrollmentMutation.mutateAsync({
                id: enrollmentId,
                updatedById: currentUserId
              });
              return { success: true, studentId };
            } catch (error) {
              console.error(`Failed to unenroll student ${studentId}:`, error);
              return { success: false, studentId, error };
            }
          }
          return { success: false, studentId, error: 'No enrollment ID found' };
        });
        
        await Promise.allSettled(removePromises);
      }
      
      // Refresh enrollments data
      await refetchEnrollments();
      
      toast({
        title: 'Success',
        description: 'Student enrollment updated successfully',
        variant: 'success',
      });
      
      router.push(`/admin/campus/classes/${classId}`);
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update student enrollment',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading || isLoadingAllStudents || !classData) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading class details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title={`Enroll Students: ${classData?.name || ''}`}
      description={`Manage student enrollment for this class (${classData?.currentCount || 0}/${classData?.maxCapacity || 0} students)`}
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Enroll Students', href: '#' },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/admin/campus/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Manage Student Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-10"
                placeholder="Search students by name, email, or enrollment number" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="studentIds"
                render={() => (
                  <FormItem>
                    <div className="border rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-b p-3 bg-muted/20">
                        <div className="font-medium">Student Name</div>
                        <div className="font-medium">Enrollment Number</div>
                        <div className="font-medium">Email</div>
                      </div>
                      
                      <div className="max-h-80 overflow-auto">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <div key={student.id} className="grid grid-cols-1 md:grid-cols-3 gap-0 p-3 border-b last:border-0 items-center hover:bg-muted/10">
                              <div className="flex items-center space-x-3">
                                <FormField
                                  control={form.control}
                                  name="studentIds"
                                  render={({ field }) => {
                                    // Safe handling of field value
                                    const fieldValue = Array.isArray(field.value) ? field.value : [];
                                    const isChecked = fieldValue.includes(student.id);
                                    
                                    return (
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                              const newValue = [...fieldValue];
                                              
                                              if (checked) {
                                                // Add student ID if not already included
                                                if (!newValue.includes(student.id)) {
                                                  newValue.push(student.id);
                                                }
                                              } else {
                                                // Remove student ID
                                                const index = newValue.indexOf(student.id);
                                                if (index !== -1) {
                                                  newValue.splice(index, 1);
                                                }
                                              }
                                              
                                              field.onChange(newValue);
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer">
                                          {student.name}
                                          {student.isEnrolled && (
                                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                              Enrolled
                                            </span>
                                          )}
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              </div>
                              <div>{student.enrollmentNumber}</div>
                              <div className="truncate">{student.email}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-muted-foreground">
                            No students found matching your search criteria
                          </div>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between items-center mt-6">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Selected {(form.watch('studentIds') || []).length} of {students.length} students
                  </span>
                </div>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/campus/classes/${classId}`)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Enrollment'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 