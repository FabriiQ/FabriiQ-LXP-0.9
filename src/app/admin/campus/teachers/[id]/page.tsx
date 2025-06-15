'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { PageLayout } from '@/components/layout/page-layout';
import { ChevronLeft, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';

// Import custom components
import { TeacherProfileCard } from '@/components/teachers/teacher-profile-card';
import { TeacherOverviewTab } from '@/components/teachers/teacher-overview-tab';
import { TeacherClassesTab } from '@/components/teachers/teacher-classes-tab';
import { TeacherSubjectsTab } from '@/components/teachers/teacher-subjects-tab';

export default function TeacherProfilePage() {
  const params = useParams();
  const { toast } = useToast();

  const teacherId = params?.id as string;

  // State for dialogs - must be declared at the top level
  const [isAssignClassDialogOpen, setIsAssignClassDialogOpen] = useState(false);
  const [isAssignSubjectDialogOpen, setIsAssignSubjectDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Fetch teacher details
  const { data: teacher, isLoading, error, refetch: refetchTeacher } = api.teacher.getTeacherById.useQuery(
    { id: teacherId },
    {
      enabled: !!teacherId,
      onError: (error) => {
        console.error('Error loading teacher:', error);
        toast({
          title: 'Error',
          description: `Failed to load teacher: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Fetch available classes for assignment
  const { data: availableClasses = [] } = api.class.getAvailableClassesForTeacher.useQuery(
    {
      teacherId,
      // Ensure we only pass string or undefined, not null
      campusId: teacher?.user?.primaryCampusId as string | undefined
    },
    { enabled: !!teacherId && !!teacher?.user?.primaryCampusId }
  );

  // Fetch subjects for qualification
  const { data: subjects = [] } = api.subject.getAll.useQuery(
    {
      // Ensure we only pass string or undefined, not null
      campusId: teacher?.user?.primaryCampusId as string | undefined
    },
    { enabled: !!teacher?.user?.primaryCampusId }
  );

  // Mutations for assignments - MUST be declared before any conditional returns
  const assignClassMutation = api.class.assignTeacher.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Teacher assigned to class successfully',
        variant: 'success',
      });
      setIsAssignClassDialogOpen(false);
      setSelectedClass('');
      void refetchTeacher();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to assign teacher to class: ${error.message}`,
        variant: 'error',
      });
    }
  });

  const assignSubjectMutation = api.teacher.assignSubject.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Subject qualification added successfully',
        variant: 'success',
      });
      setIsAssignSubjectDialogOpen(false);
      setSelectedSubject('');
      void refetchTeacher();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add subject qualification: ${error.message}`,
        variant: 'error',
      });
    }
  });

  // Handle class assignment
  const handleAssignClass = () => {
    if (!selectedClass) return;

    assignClassMutation.mutate({
      classId: selectedClass,
      teacherId,
      assignmentType: 'PRIMARY' // Still using PRIMARY in the backend, but displayed as Home Teacher in UI
    });
  };

  // Handle subject assignment
  const handleAssignSubject = () => {
    if (!selectedSubject) return;

    assignSubjectMutation.mutate({
      teacherId,
      subjectId: selectedSubject
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading teacher profile"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
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
  if (error || !teacher) {
    return (
      <PageLayout
        title="Error"
        description="Failed to load teacher profile"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'Error', href: '#' },
        ]}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Error Loading Profile</h3>
              <p className="text-muted-foreground mb-6">
                {error?.message || 'Teacher not found'}
              </p>
              <Button asChild>
                <Link href="/admin/campus/teachers">Back to Teachers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Teacher: ${teacher.user?.name || 'Unnamed'}`}
      description={teacher.user?.email || 'No email provided'}
      breadcrumbs={[
        { label: 'Teachers', href: '/admin/campus/teachers' },
        { label: teacher.user?.name || 'Teacher', href: '#' },
      ]}
      actions={
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/campus/teachers">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Teachers
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/campus/teachers/${teacherId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <TeacherProfileCard teacher={teacher} />

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="classes">Classes</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <TeacherOverviewTab teacher={teacher} />
            </TabsContent>

            <TabsContent value="classes">
              <TeacherClassesTab
                teacher={teacher}
                availableClasses={availableClasses}
                isAssignClassDialogOpen={isAssignClassDialogOpen}
                setIsAssignClassDialogOpen={setIsAssignClassDialogOpen}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                handleAssignClass={handleAssignClass}
              />
            </TabsContent>

            <TabsContent value="subjects">
              <TeacherSubjectsTab
                teacher={teacher}
                subjects={subjects}
                isAssignSubjectDialogOpen={isAssignSubjectDialogOpen}
                setIsAssignSubjectDialogOpen={setIsAssignSubjectDialogOpen}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                handleAssignSubject={handleAssignSubject}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
}