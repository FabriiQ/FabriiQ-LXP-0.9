'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import dynamic from 'next/dynamic';

// Import the new ClassAssessmentCreator from features/assessments
const DynamicClassAssessmentCreator = dynamic(
  () => import('@/features/assessments/components/ClassAssessmentCreator').then(mod => ({ default: mod.ClassAssessmentCreator })),
  {
    loading: () => <div className="animate-pulse p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">Loading assessment creator...</div>,
    ssr: false
  }
);

interface NewAssessmentClientPageProps {
  classId: string;
  classInfo?: any;
  subjects?: any[];
  error?: string;
}

export function NewAssessmentClientPage({
  classId,
  classInfo,
  subjects = [],
  error
}: NewAssessmentClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  console.log('NewAssessmentClientPage - Subjects:', subjects);

  // Handle assessment creation success
  const handleAssessmentSave = async (assessmentData: any) => {
    try {
      // The ClassAssessmentCreator will handle the API call
      // We just need to handle the success navigation
      toast({
        title: 'Success',
        description: 'Assessment created successfully',
        variant: 'success',
      });

      // Navigate back to assessments list
      router.push(`/admin/campus/classes/${classId}/assessments`);
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to create assessment. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleCancel = () => {
    router.push(`/admin/campus/classes/${classId}/assessments`);
  };

  // If there's an error, show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center p-8">
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="text-muted-foreground">
            {error}
          </p>
          <Link href={`/admin/campus/classes/${classId}/assessments`}>
            <Button className="mt-4">
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto max-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/admin/campus/classes/${classId}/assessments`}>
              <Button size="sm" variant="ghost">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Create Assessment</h1>
          </div>
          <p className="text-muted-foreground">
            {classInfo?.code} - {classInfo?.name}
          </p>
        </div>
      </div>

      {/* Use the new ClassAssessmentCreator component */}
      <DynamicClassAssessmentCreator
        initialValues={{
          classId: classId,
          title: '',
          description: '',
          instructions: '',
        }}
        subjects={subjects}
        onSave={handleAssessmentSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
