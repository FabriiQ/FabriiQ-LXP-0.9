'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/feedback/toast';
import { EditTeacherForm } from '../edit-teacher-form';

// Define the debug info type
type DebugInfo = {
  teacher?: any;
  campus?: any;
  subjects?: any;
};

export default function EditTeacherPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const teacherId = params?.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [campusId, setCampusId] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  // Get session data
  const { data: sessionData } = api.auth.getSession.useQuery(undefined, {
    retry: 1,
    onError: (error) => {
      console.error('Error loading session:', error);
      toast({
        title: 'Error',
        description: `Failed to load session: ${error.message}`,
        variant: 'error',
      });
    }
  });

  // Fetch teacher details
  const { data: teacher, isLoading: isLoadingTeacher, error: teacherError } = api.teacher.getTeacherById.useQuery(
    { id: teacherId },
    { 
      enabled: !!teacherId,
      retry: 1,
      onSuccess: (data) => {
        console.log('Teacher data loaded:', data);
        setDebugInfo((prev: DebugInfo) => ({ ...prev, teacher: data }));
        
        // Immediately set campus ID from the teacher data if available
        if (data?.user?.primaryCampusId) {
          setCampusId(data.user.primaryCampusId);
        }
      },
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

  // Set campus ID once teacher data is loaded or use session data as fallback
  useEffect(() => {
    console.log('Teacher data from effect:', teacher);
    console.log('Session data:', sessionData);
    
    if (teacher?.user?.primaryCampusId) {
      console.log('Setting campusId from teacher:', teacher.user.primaryCampusId);
      setCampusId(teacher.user.primaryCampusId);
    } else if (sessionData?.user?.primaryCampusId) {
      console.log('Setting campusId from session:', sessionData.user.primaryCampusId);
      setCampusId(sessionData.user.primaryCampusId);
    } else {
      console.log('No campus ID found in teacher or session');
    }
  }, [teacher, sessionData]);

  // Fetch campus data based on the determined campus ID
  const { data: campusData, isLoading: isLoadingCampus, error: campusError } = api.campus.findById.useQuery(
    { campusId },
    { 
      enabled: !!campusId,
      retry: 1,
      onSuccess: (data) => {
        console.log('Campus data loaded:', data);
        setDebugInfo((prev: DebugInfo) => ({ ...prev, campus: data }));
      },
      onError: (error) => {
        console.error('Error loading campus:', error);
        toast({
          title: 'Error',
          description: `Failed to load campus data: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Fetch subjects for the campus
  const { data: subjects, isLoading: isLoadingSubjects, error: subjectsError } = api.subject.getByCampus.useQuery(
    { campusId },
    { 
      enabled: !!campusId,
      retry: 1,
      onSuccess: (data) => {
        console.log('Subjects loaded:', data?.length || 0, 'subjects');
        setDebugInfo((prev: DebugInfo) => ({ ...prev, subjects: data }));
      },
      onError: (error) => {
        console.error('Error loading subjects:', error);
        toast({
          title: 'Error',
          description: `Failed to load subjects: ${error.message}`,
          variant: 'error',
        });
      }
    }
  );

  // Force loading to false after a timeout as a fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && teacher && campusId) {
        console.log('Forcing loading to false after timeout');
        setIsLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isLoading, teacher, campusId]);

  // Update loading state when all data is available
  useEffect(() => {
    if (teacher && campusData && campusId) {
      console.log('All data loaded, ready to render form');
      setIsLoading(false);
    }
  }, [teacher, campusData, campusId]);

  // Show loading state
  if (isLoading && (isLoadingTeacher || isLoadingCampus || !campusId)) {
    return (
      <PageLayout
        title="Loading"
        description="Loading teacher data"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: teacher?.user?.name || 'Teacher', href: `/admin/campus/teachers/${teacherId}` },
          { label: 'Edit', href: '#' },
        ]}
      >
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <div className="text-sm text-gray-500">
            Loading status: {JSON.stringify({
              teacher: !!teacher,
              teacherLoading: isLoadingTeacher,
              campusId: campusId,
              campusData: !!campusData,
              campusLoading: isLoadingCampus
            })}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (teacherError || (campusError && campusId) || !teacher) {
    return (
      <PageLayout
        title="Error"
        description="Failed to load required data"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'Error', href: '#' },
        ]}
      >
        <div className="p-4">
          <p className="text-red-500">
            {teacherError?.message || campusError?.message || 'Failed to load required data'}
          </p>
          <Button variant="ghost" size="sm" asChild className="mt-4">
            <Link href={`/admin/campus/teachers/${teacherId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teacher Profile
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Edit Teacher: ${teacher.user?.name || 'Unnamed'}`}
      description={`Edit teacher details for ${campusData?.name || 'your campus'}`}
      breadcrumbs={[
        { label: 'Teachers', href: '/admin/campus/teachers' },
        { label: teacher.user?.name || 'Teacher', href: `/admin/campus/teachers/${teacherId}` },
        { label: 'Edit', href: '#' },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/campus/teachers/${teacherId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teacher Profile
            </Link>
          </Button>
        </div>

        <EditTeacherForm
          teacherId={teacherId}
          campusId={campusId}
          userId={sessionData?.user?.id || ''}
          initialData={teacher}
        />
      </div>
    </PageLayout>
  );
} 