'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { TeacherForm } from '@/components/teacher/management/TeacherForm';
import { api } from '@/trpc/react';
import { PageLayout } from '@/components/layout/page-layout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Session } from 'next-auth';

export default function NewTeacherPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [campusId, setCampusId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Get session data
  const { data: sessionData, isLoading: isLoadingSession } = api.auth.getSession.useQuery(undefined, {
    retry: 1,
    onError: (error) => {
      console.error('Error loading session:', error);
    }
  });

  // Try to get primary campus data
  const { data: primaryCampusData } = api.campus.getPrimaryCampus.useQuery(undefined, {
    enabled: true,
    retry: 1,
    onError: (error) => {
      console.error('Error loading primary campus:', error);
      // Don't set error message here as we might get the campus ID from query params
    }
  });

  useEffect(() => {
    // First, try to get campusId from query params
    const queryParamCampusId = searchParams.get('campusId');
    console.log("Campus ID from query params:", queryParamCampusId);
    
    if (queryParamCampusId) {
      console.log("Using campusId from query params");
      setCampusId(queryParamCampusId);
      setIsLoading(false);
    } 
    // If not in query params, use the primary campus ID
    else if (primaryCampusData?.id) {
      console.log("Using primary campus ID:", primaryCampusData.id);
      setCampusId(primaryCampusData.id);
      setIsLoading(false);
    }
    // As a last resort, try to get it from the session
    else if (sessionData?.user?.primaryCampusId) {
      console.log("Using primaryCampusId from session:", sessionData.user.primaryCampusId);
      setCampusId(sessionData.user.primaryCampusId);
      setIsLoading(false);
    }
    // If all else fails, show an error
    else if (!isLoadingSession) {
      setErrorMessage("No campus ID found in URL or session. Please select a campus first.");
      setIsLoading(false);
    }
  }, [searchParams, primaryCampusData, sessionData, isLoadingSession]);

  // Add error handling and better loading states
  const { data: campusData, isLoading: isLoadingCampus, error: campusError } = api.campus.findById.useQuery(
    { campusId },
    { 
      enabled: !!campusId,
      retry: 1,
      onError: (error) => {
        console.error('Error loading campus:', error);
        setErrorMessage(error.message || "Failed to load campus data");
      }
    }
  );

  const { data: subjects, isLoading: isLoadingSubjects, error: subjectsError } = api.subject.getByCampus.useQuery(
    { campusId },
    { 
      enabled: !!campusId,
      retry: 1,
      onError: (error) => {
        console.error('Error loading subjects:', error);
      }
    }
  );

  // Show loading state for initial load
  if (isLoading || isLoadingSession) {
    return (
      <PageLayout
        title="Loading"
        description="Loading teacher form"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'New Teacher', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  // Check if campusId is missing
  if (!campusId) {
    return (
      <PageLayout
        title="Error"
        description="Campus ID is missing"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'New Teacher', href: '#' },
        ]}
      >
        <div className="p-4">
          <p className="text-red-500">Error: {errorMessage || "Campus ID is required"}</p>
          <p className="text-sm mt-2">Debug info:</p>
          <ul className="text-sm list-disc pl-5 mt-1">
            <li>Query params: {JSON.stringify(Object.fromEntries(searchParams.entries()))}</li>
            <li>Session user ID: {sessionData?.user?.id || 'Not available'}</li>
            <li>Primary campus ID: {sessionData?.user?.primaryCampusId || 'Not available'}</li>
            <li>Primary campus data: {primaryCampusData ? primaryCampusData.id : 'Not available'}</li>
          </ul>
          <Button variant="ghost" size="sm" asChild className="mt-4">
            <Link href="/admin/campus/teachers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teachers
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Show error state if any of the queries failed
  if (campusError || subjectsError) {
    return (
      <PageLayout
        title="Error"
        description="Failed to load required data"
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'New Teacher', href: '#' },
        ]}
      >
        <div className="p-4">
          <p className="text-red-500">
            {campusError?.message || subjectsError?.message || 'Failed to load required data'}
          </p>
          <p className="text-sm mt-2">Campus ID: {campusId}</p>
          <Button variant="ghost" size="sm" asChild className="mt-4">
            <Link href="/admin/campus/teachers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teachers
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Show loading state for fetching data
  if (isLoadingCampus || isLoadingSubjects) {
    return (
      <PageLayout
        title="New Teacher"
        description="Loading data..."
        breadcrumbs={[
          { label: 'Teachers', href: '/admin/campus/teachers' },
          { label: 'New Teacher', href: '#' },
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
      title="New Teacher"
      description={`Create a new teacher for ${campusData?.name || ''} (Campus ID: ${campusId})`}
      breadcrumbs={[
        { label: 'Teachers', href: '/admin/campus/teachers' },
        { label: 'New Teacher', href: '#' },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/campus/teachers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Teachers
            </Link>
          </Button>
        </div>

        <TeacherForm
          campusId={campusId}
          campusName={campusData?.name || ''}
          subjects={subjects || []}
          userId={sessionData?.user?.id || ''}
        />
      </div>
    </PageLayout>
  );
}


