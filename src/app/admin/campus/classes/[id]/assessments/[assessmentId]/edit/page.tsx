import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/server';
import { ClassLayout } from '../../../components/ClassLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import the new ClassAssessmentCreator from features/assessments
const DynamicClassAssessmentCreator = dynamic(
  () => import('@/features/assessments/components/ClassAssessmentCreator').then(mod => ({ default: mod.ClassAssessmentCreator })),
  {
    loading: () => <div className="animate-pulse p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">Loading assessment editor...</div>
  }
);

export const metadata: Metadata = {
  title: 'Edit Assessment',
  description: 'Edit assessment details',
};

export default async function EditAssessmentPage({
  params
}: {
  params: Promise<{ id: string; assessmentId: string }>
}) {
  const { id: classId, assessmentId } = await params;
  
  try {
    // Fetch class details
    const classInfo = await api.class.getById({
      classId,
      include: {
        students: false,
        teachers: true
      }
    });
    
    // Fetch assessment details
    const assessment = await api.assessment.getById({ 
      assessmentId,
      includeQuestions: true 
    });
    
    if (!assessment) {
      return notFound();
    }
    
    // Fetch subjects for this class for the form dropdown
    const subjects = await api.subject.list({
      filters: { classId },
      pagination: { page: 1, pageSize: 100 },
    });
    
    return (
      <ClassLayout 
        classId={classId} 
        activeTab="assessments"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}`}>
                  <Button size="sm" variant="ghost">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">Edit Assessment</h1>
              </div>
              <p className="text-muted-foreground">
                {assessment.title}
              </p>
            </div>
          </div>
          
          {/* Use the new ClassAssessmentCreator component for editing */}
          <DynamicClassAssessmentCreator
            initialValues={{
              classId: classId,
              title: assessment.title,
              description: assessment.description || '',
              instructions: assessment.instructions || '',
              category: assessment.category,
              subjectId: assessment.subjectId,
              topicId: assessment.topicId || '',
              maxScore: assessment.maxScore,
              passingScore: assessment.passingScore,
              weightage: assessment.weightage,
              rubricId: assessment.rubricId || '',
              dueDate: assessment.dueDate ? new Date(assessment.dueDate) : undefined,
            }}
            subjects={subjects.items}
            onSave={async (assessmentData: any) => {
              // Handle assessment update
              try {
                await api.assessment.update({
                  id: assessmentId,
                  ...assessmentData,
                });
                // Redirect back to assessment detail page
                window.location.href = `/admin/campus/classes/${classId}/assessments/${assessmentId}`;
              } catch (error) {
                console.error('Error updating assessment:', error);
                alert('Failed to update assessment. Please try again.');
              }
            }}
            onCancel={() => {
              window.location.href = `/admin/campus/classes/${classId}/assessments/${assessmentId}`;
            }}
          />
        </div>
      </ClassLayout>
    );
  } catch (error) {
    console.error('Error loading assessment edit page:', error);
    return (
      <ClassLayout classId={classId} activeTab="assessments">
        <div className="p-6">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              We encountered an error while loading the assessment edit form.
            </p>
            <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}`}>
              <Button>
                Back to Assessment
              </Button>
            </Link>
          </div>
        </div>
      </ClassLayout>
    );
  }
} 