'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { DatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Search } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

const enrollmentFormSchema = z.object({
  studentId: z.string({
    required_error: 'Student is required',
  }),
  classId: z.string({
    required_error: 'Class is required',
  }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date().optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'COMPLETED', 'WITHDRAWN'], {
    required_error: 'Status is required',
  }).default('ACTIVE'),
  notes: z.string().optional(),
});

type Campus = {
  id: string;
  name: string;
  code: string;
};

type Student = {
  id: string;
  name: string;
  email: string;
  campusId: string;
};

type Class = {
  id: string;
  name: string;
  campusId: string;
  campusName: string;
  programName: string;
  courseName: string;
  termName: string;
};

type SystemEnrollmentFormProps = {
  campuses: Campus[];
  students: Student[];
  classes: Class[];
};

export function SystemEnrollmentForm({ campuses, students, classes }: SystemEnrollmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>(classes);

  // tRPC mutations
  const createEnrollment = api.enrollment.createEnrollment.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Enrollment created successfully',
      });
      router.push('/admin/system/enrollment');
    },
    onError: (error: any) => {
      setError(error.message || 'An error occurred while creating the enrollment');
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while creating the enrollment',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  });

  const bulkEnroll = api.enrollment.bulkEnroll.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Students enrolled successfully',
      });
      router.push('/admin/system/enrollment');
    },
    onError: (error: any) => {
      setError(error.message || 'An error occurred while creating the enrollments');
      toast({
        title: 'Error',
        description: error.message || 'An error occurred while creating the enrollments',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  });

  const singleForm = useForm({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      studentId: '',
      classId: '',
      startDate: new Date(),
      endDate: undefined,
      status: 'ACTIVE',
      notes: '',
    },
  });

  const bulkForm = useForm({
    resolver: zodResolver(
      z.object({
        campusId: z.string({
          required_error: 'Campus is required',
        }),
        classId: z.string({
          required_error: 'Class is required',
        }),
        startDate: z.date({
          required_error: 'Start date is required',
        }),
        status: z.enum(['ACTIVE', 'PENDING'], {
          required_error: 'Status is required',
        }).default('ACTIVE'),
      })
    ),
    defaultValues: {
      campusId: 'all',
      classId: '',
      startDate: new Date(),
      status: 'ACTIVE',
    },
  });

  // Filter students and classes when campus selection changes
  useEffect(() => {
    if (selectedCampus === 'all') {
      setFilteredStudents(students);
      setFilteredClasses(classes);
    } else {
      setFilteredStudents(students.filter(student => student.campusId === selectedCampus));
      setFilteredClasses(classes.filter(classItem => classItem.campusId === selectedCampus));
    }
  }, [selectedCampus, students, classes]);

  // Filter students based on search term
  useEffect(() => {
    const filtered = students.filter(student => {
      const matchesCampus = selectedCampus === 'all' || student.campusId === selectedCampus;
      const matchesSearch = searchTerm === '' || 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCampus && matchesSearch;
    });
    setFilteredStudents(filtered);
  }, [searchTerm, selectedCampus, students]);

  // Handle select all checkbox
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  }, [selectAll, filteredStudents]);

  // Handle student checkbox change
  const handleStudentCheckboxChange = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  // Handle single enrollment form submission
  async function onSubmitSingle(data: any) {
    setIsSubmitting(true);
    setError('');

    const { session } = await api.auth.getSession.fetch();
    if (!session?.user?.id) {
      setError('User session not found');
      setIsSubmitting(false);
      return;
    }

    createEnrollment.mutate({
      studentId: data.studentId,
      classId: data.classId,
      startDate: data.startDate,
      notes: data.notes,
      createdById: session.user.id,
    });
  }

  // Handle bulk enrollment form submission
  async function onSubmitBulk(data: any) {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      toast({
        title: 'Error',
        description: 'Please select at least one student',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setError('');

    const { session } = await api.auth.getSession.fetch();
    if (!session?.user?.id) {
      setError('User session not found');
      setIsSubmitting(false);
      return;
    }

    bulkEnroll.mutate({
      studentIds: selectedStudents,
      classId: data.classId,
      startDate: data.startDate,
      createdById: session.user.id,
    });
  }

  return (
    <Tabs defaultValue="single" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="single">Single Enrollment</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Enrollment</TabsTrigger>
      </TabsList>

      <TabsContent value="single" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Enrollment</CardTitle>
            <CardDescription>Enroll a student in a class</CardDescription>
          </CardHeader>
          <Form {...singleForm}>
            <form onSubmit={singleForm.handleSubmit(onSubmitSingle)}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
                    {error}
                  </div>
                )}

                <FormField
                  control={singleForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={singleForm.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name} - {classItem.courseName} ({classItem.campusName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={singleForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={singleForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={singleForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes here"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/admin/system/enrollment">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Processing...</span>
                      <span className="animate-spin">⏳</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Create Enrollment
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>

      <TabsContent value="bulk" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Enrollment</CardTitle>
            <CardDescription>Enroll multiple students in a class</CardDescription>
          </CardHeader>
          <Form {...bulkForm}>
            <form onSubmit={bulkForm.handleSubmit(onSubmitBulk)}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
                    {error}
                  </div>
                )}

                <FormField
                  control={bulkForm.control}
                  name="campusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCampus(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Campuses</SelectItem>
                          {campuses.map((campus) => (
                            <SelectItem key={campus.id} value={campus.id}>
                              {campus.name} ({campus.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={bulkForm.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredClasses.map((classItem) => (
                            <SelectItem key={classItem.id} value={classItem.id}>
                              {classItem.name} - {classItem.courseName} ({classItem.campusName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={bulkForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={bulkForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all"
                        checked={selectAll}
                        onCheckedChange={setSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium">
                        Select All Students
                      </label>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <div className="p-2 space-y-2">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => handleStudentCheckboxChange(student.id, checked === true)}
                            />
                            <label htmlFor={`student-${student.id}`}>{student.name} ({student.email})</label>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          No students found matching your search criteria
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {selectedStudents.length} students selected
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/admin/system/enrollment">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Processing...</span>
                      <span className="animate-spin">⏳</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Create Bulk Enrollment
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
