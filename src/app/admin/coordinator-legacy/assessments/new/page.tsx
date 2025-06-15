'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { AssessmentForm } from '@/components/coordinator/AssessmentForm';
import { api } from '@/trpc/react';
import { LoadingSpinner } from '@/components/ui/loading';
import { SystemStatus } from '@/server/api/constants';

export default function NewAssessmentPage() {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Fetch classes for the form
  const { data: classesData, isLoading: isLoadingClasses } = api.class.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Fetch subjects for the selected class
  const { data: classSubjectsData, isLoading: isLoadingClassSubjects } = api.class.getSubjectsForClass.useQuery(
    { classId: selectedClassId },
    { enabled: !!selectedClassId }
  );

  // Fetch all subjects as a fallback
  const { data: allSubjectsData, isLoading: isLoadingAllSubjects } = api.subject.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  const isLoading = isLoadingClasses || (selectedClassId ? isLoadingClassSubjects : isLoadingAllSubjects);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const classes = classesData?.items || [];

  // Use class-specific subjects if a class is selected, otherwise use all subjects
  let subjects = allSubjectsData?.items || [];

  if (selectedClassId && classSubjectsData) {
    console.log('Class subjects data:', classSubjectsData);
    // Make sure the data structure matches what the form expects
    subjects = Array.isArray(classSubjectsData) ? classSubjectsData : [];
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Create New Assessment"
        description="Create a new assessment for your coordinated programs"
      />

      <AssessmentForm
        classes={classes}
        subjects={subjects}
        onSuccess={() => router.push('/admin/coordinator/assessments')}
        onClassChange={setSelectedClassId}
      />
    </div>
  );
}
