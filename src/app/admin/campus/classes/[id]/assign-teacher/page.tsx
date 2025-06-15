'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { ArrowLeft, Trash, UserPlus, User } from 'lucide-react';
import { BackToClassButton } from './components/ClientNavigation';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { JsonValue } from 'type-fest';
import { SystemStatus } from '@prisma/client';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '@/server/api/root';

// Define proper interfaces based on your Prisma schema
interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface Teacher {
  id: string;
  userId: string;
  user: User;
  specialization: string | null;
  qualifications: JsonValue[];
  achievements: JsonValue[];
  attendanceRate: number | null;
}

// Update the TeacherAssignment interface to match what comes from the API
interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  status: SystemStatus;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  teacher?: {
    id: string;
    user?: User;
    qualifications?: JsonValue[];
    specialization?: string | null;
  };
}

interface ClassData {
  id: string;
  name: string;
  status: SystemStatus;
  courseCampusId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  campusId: string;
  code: string;
  programCampusId: string | null;
  teachers: TeacherAssignment[];
}

export default function AssignTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const classId = params?.id as string;

  // Check if we have a teacherId from the URL (in case we're coming from the teacher's profile)
  const preselectedTeacherId = searchParams.get('teacherId');

  const [selectedTeacher, setSelectedTeacher] = useState<string>(preselectedTeacherId || '');
  const [assignmentType, setAssignmentType] = useState<'PRIMARY' | 'ASSISTANT'>('PRIMARY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update query to include proper types
  const { data: classData, isLoading: isLoadingClass, error: classError, refetch: refetchClass } = api.class.getById.useQuery({
    classId,
    include: {
      students: false,
      teachers: true,
      classTeacher: {
        include: {
          user: true
        }
      }
    }
  }, {
    onSuccess: (data) => {
      console.log('Class data loaded:', data?.id, 'Campus ID:', data?.campusId);
      if (!data?.campusId) {
        console.error('No campus ID available in class data');
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error('Error loading class data:', error);
    }
  });

  // Fetch teacher assignments for this class
  const { data: teacherAssignments, isLoading: isLoadingAssignments, refetch: refetchAssignments } = api.class.getTeacherAssignments.useQuery({
    classId,
  }, {
    enabled: !!classId,
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error('Error loading teacher assignments:', error);
    }
  });

  // Update teachers query to include user data and filter by campus
  const { data: teachers, isLoading: isLoadingTeachers } = api.teacher.getAllTeachers.useQuery({
    campusId: classData?.campusId || '',
  }, {
    enabled: !!classData?.campusId,
    onSuccess: (data) => {
      console.log('Teachers loaded:', data?.length || 0);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error('Error loading teachers:', error);
      toast({
        title: 'Error',
        description: `Failed to load teachers: ${error.message}`,
        variant: 'error',
      });
    }
  });

  // Update mutation with proper types
  const assignTeacherMutation = api.class.assignTeacher.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Teacher assigned successfully',
        variant: 'success',
      });
      void refetchClass();
      void refetchAssignments();

      // If we came from a teacher's profile, go back there
      if (preselectedTeacherId) {
        router.push(`/admin/campus/teachers/${preselectedTeacherId}/classes`);
      } else {
        router.push(`/admin/campus/classes/${classId}`);
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast({
        title: 'Error',
        description: `Failed to assign teacher: ${error.message}`,
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });

  // Remove teacher mutation
  const removeTeacherMutation = api.class.removeTeacher.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Teacher removed successfully',
        variant: 'success',
      });
      void refetchClass();
      void refetchAssignments();
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast({
        title: 'Error',
        description: `Failed to remove teacher: ${error.message}`,
        variant: 'error',
      });
    },
  });

  useEffect(() => {
    // If we have a preselected teacher, let's set it
    if (preselectedTeacherId) {
      setSelectedTeacher(preselectedTeacherId);
    } else {
      // Otherwise, check for current assignments
      const teachersArray = teacherAssignments || [];

      // Find a primary teacher assignment
      const currentTeacher = teachersArray.find((t) =>
        t.status === 'ACTIVE'
      );

      if (currentTeacher?.teacherId) {
        setSelectedTeacher(currentTeacher.teacherId);
        setAssignmentType('PRIMARY');
      }
    }
  }, [teacherAssignments, preselectedTeacherId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacher) {
      toast({
        title: 'Error',
        description: 'Please select a teacher',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    assignTeacherMutation.mutate({
      classId,
      teacherId: selectedTeacher,
      assignmentType
    });
  };

  const handleRemoveTeacher = (teacherId: string) => {
    removeTeacherMutation.mutate({
      classId,
      teacherId
    });
  };

  // Loading state
  if (isLoadingClass || isLoadingTeachers || isLoadingAssignments) {
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

  // Error state
  if (classError) {
    return (
      <PageLayout
        title="Error"
        description="Failed to load class details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Error', href: '#' },
        ]}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Error Loading Class</h3>
              <p className="text-muted-foreground mb-6">
                There was an error loading the class details: {classError.message}
              </p>
              <Button onClick={() => router.push('/admin/campus/classes')}>
                Back to Classes
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Back button URL depends on where we came from
  const backUrl = preselectedTeacherId
    ? `/admin/campus/teachers/${preselectedTeacherId}/classes`
    : `/admin/campus/classes/${classId}`;

  return (
    <PageLayout
      title={`Assign Teacher to ${classData?.name || ''}`}
      description="Assign a teacher to this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Assign Teacher', href: '#' },
      ]}
      actions={
        <BackToClassButton classId={classId} />
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assign Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="teacher" className="text-sm font-medium">Select Teacher</label>
                <Select
                  value={selectedTeacher}
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a teacher (${teachers?.length || 0} available)`} />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers && teachers.length > 0 ? (
                      teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.user?.name || 'Unnamed'} - {teacher.user?.email || 'No email'}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-teachers" disabled>
                        No teachers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="assignmentType" className="text-sm font-medium">Assignment Type</label>
                <Select
                  value={assignmentType}
                  onValueChange={(value: 'PRIMARY' | 'ASSISTANT') => setAssignmentType(value)}
                >
                  <SelectTrigger id="assignmentType">
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIMARY">Home Teacher</SelectItem>
                    <SelectItem value="ASSISTANT">Subject Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Assigning...' : 'Assign Teacher'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Teacher Assignment Cards */}
        {teacherAssignments?.map((teacherAssignment) => {
          // Find the corresponding teacher from the teachers array
          const teacherDetails = teachers?.find(t => t.id === teacherAssignment.teacherId);

          return (
            <Card key={teacherAssignment.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Teacher</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveTeacher(teacherAssignment.teacherId)}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-md">
                    <p className="font-medium text-lg">{teacherDetails?.user?.name || 'Unnamed Teacher'}</p>
                    <p className="text-sm text-muted-foreground">{teacherDetails?.user?.email || 'No email'}</p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Status:</span> {teacherAssignment.status || 'Unknown'}
                    </p>
                    {teacherDetails?.qualifications && Array.isArray(teacherDetails.qualifications) && teacherDetails.qualifications.length > 0 && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Qualifications:</span> {JSON.stringify(teacherDetails.qualifications)}
                      </p>
                    )}
                    {teacherDetails?.specialization && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Specialization:</span> {teacherDetails.specialization}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Debug information - only visible during development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="col-span-2 bg-slate-50">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <p>Class ID: {classId}</p>
                  <p>Campus ID: {classData?.campusId || 'Not available'}</p>
                  <p>Teachers loaded: {teachers?.length || 0}</p>
                  <p>Teachers assigned: {teacherAssignments?.length || 0}</p>
                  {preselectedTeacherId && <p>Preselected Teacher ID: {preselectedTeacherId}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
