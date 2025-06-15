'use client';

import { useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft } from 'lucide-react';
import { SystemStatus } from '@prisma/client';
import { ScheduleForm } from '@/components/coordinator/ScheduleForm';

export default function NewSchedulePage({
  searchParams,
}: {
  searchParams: { classId?: string; termId?: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch current term
  const { data: currentTermData, isLoading: isLoadingCurrentTerm } = api.term.getCurrent.useQuery();
  
  // Fetch terms
  const { data: termsData, isLoading: isLoadingTerms } = api.term.list.useQuery({
    status: SystemStatus.ACTIVE,
  });
  
  // Fetch classes for coordinator
  const { data: classesData, isLoading: isLoadingClasses } = api.class.getTeacherClasses.useQuery({
    status: SystemStatus.ACTIVE,
  });
  
  // Fetch teachers
  const { data: teachersData, isLoading: isLoadingTeachers } = api.teacher.list.useQuery({
    status: SystemStatus.ACTIVE,
  });
  
  // Fetch facilities
  const { data: facilitiesData, isLoading: isLoadingFacilities } = api.facility.list.useQuery({
    status: SystemStatus.ACTIVE,
  });
  
  // Fetch schedule patterns
  const { data: patternsData, isLoading: isLoadingPatterns } = api.schedulePattern.list.useQuery({
    page: 1,
    pageSize: 100,
  });
  
  const isLoading = 
    isLoadingCurrentTerm || 
    isLoadingTerms || 
    isLoadingClasses || 
    isLoadingTeachers || 
    isLoadingFacilities || 
    isLoadingPatterns;
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  const terms = termsData?.items || [];
  const classes = classesData?.items || [];
  const teachers = teachersData?.items || [];
  const facilities = facilitiesData?.items || [];
  const patterns = patternsData?.items || [];
  
  // Default to current term if available
  const defaultTermId = searchParams.termId || currentTermData?.id;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/coordinator/schedules')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Schedules
          </Button>
          <PageHeader
            title="Create New Schedule"
            description="Create a new class schedule or timetable"
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Schedule Details</CardTitle>
          <CardDescription>
            Fill in the details to create a new class schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleForm
            terms={terms}
            classes={classes}
            teachers={teachers}
            facilities={facilities}
            patterns={patterns}
            defaultTermId={defaultTermId}
            defaultClassId={searchparams.id}
            onSuccess={() => router.push('/admin/coordinator/schedules')}
            isSubmitting={isSubmitting}
            setIsSubmitting={setIsSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}

