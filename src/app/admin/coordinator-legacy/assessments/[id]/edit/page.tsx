'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { AssessmentForm } from '@/components/coordinator/AssessmentForm';
import { api } from '@/trpc/react';
import { LoadingSpinner } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SystemStatus } from '@/server/api/constants';

export default function EditAssessmentPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  // In Next.js 15+, params is a Promise that needs to be unwrapped with use()
  // We need to cast it to avoid TypeScript errors
  const { id: assessmentId } = params;
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Fetch assessment details
  const { data: assessmentData, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );

  // Fetch classes for the form
  const { data: classesData, isLoading: isLoadingClasses } = api.class.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  // Set the selected class ID when assessment data is loaded
  useEffect(() => {
    if (assessmentData && assessmentData.classId) {
      setSelectedClassId(assessmentData.classId);
    }
  }, [assessmentData]);

  // Fetch subjects for the selected class
  const { data: classSubjectsData, isLoading: isLoadingClassSubjects } = api.class.getSubjectsForClass.useQuery(
    { classId: selectedClassId },
    { enabled: !!selectedClassId }
  );

  // Fetch all subjects as a fallback
  const { data: allSubjectsData, isLoading: isLoadingAllSubjects } = api.subject.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  const isLoading = isLoadingAssessment || isLoadingClasses || (selectedClassId ? isLoadingClassSubjects : isLoadingAllSubjects);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!assessmentData) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">Assessment not found</h2>
          <p className="text-muted-foreground mb-4">The assessment you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/admin/coordinator/assessments')}>
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const classes = classesData?.items || [];

  // Use class-specific subjects if a class is selected, otherwise use all subjects
  let subjects = allSubjectsData?.items || [];

  if (selectedClassId && classSubjectsData) {
    console.log('Class subjects data:', classSubjectsData);
    // Make sure the data structure matches what the form expects
    subjects = Array.isArray(classSubjectsData) ? classSubjectsData : [];
  }

  // Prepare initial data for the form
  const initialData = {
    id: assessmentData.id,
    title: assessmentData.title,
    description: assessmentData.description,
    classId: assessmentData.classId,
    subjectId: assessmentData.subjectId,
    topicId: assessmentData.topicId,
    category: assessmentData.category,
    instructions: assessmentData.instructions,
    maxScore: assessmentData.maxScore,
    passingScore: assessmentData.passingScore,
    weightage: assessmentData.weightage,
    dueDate: assessmentData.dueDate ? new Date(assessmentData.dueDate) : undefined,
    gradingType: assessmentData.gradingType,
    allowLateSubmissions: assessmentData.allowLateSubmissions,
    questions: assessmentData.questions || [],
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center mb-4">
        <Button
          variant="outline"
          size="sm"
          className="mr-2"
          onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PageHeader
          title="Edit Assessment"
          description="Update assessment details"
        />
      </div>

      <AssessmentForm
        classes={classes}
        subjects={subjects}
        initialData={initialData}
        isEditing={true}
        onSuccess={() => router.push(`/admin/coordinator/assessments/${assessmentId}`)}
        onClassChange={setSelectedClassId}
      />
    </div>
  );
}
