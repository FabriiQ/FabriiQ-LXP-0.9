'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus as PlusIcon } from 'lucide-react';
import { AssessmentsList } from './AssessmentsList';
import { Assessment } from '@/types';
import { useSearchParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { AssessmentLessonPlanFilter } from '@/components/shared/entities/assessments/AssessmentLessonPlanFilter';

interface AssessmentsClientPageProps {
  classId: string;
  classInfo?: any;
  initialAssessments?: any[];
  error?: string;
}

export function AssessmentsClientPage({
  classId,
  classInfo,
  initialAssessments = [],
  error
}: AssessmentsClientPageProps) {
  const searchParams = useSearchParams();
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(searchParams.get('lessonPlanId'));

  // Fetch assessments with the lesson plan filter
  const { data: assessmentsData, isLoading } = api.assessment.listByClass.useQuery({
    classId,
    lessonPlanId: lessonPlanId || undefined,
    page: 1,
    pageSize: 100
  }, {
    enabled: !!classId,
    initialData: {
      items: initialAssessments,
      total: initialAssessments.length,
      page: 1,
      pageSize: 100,
      hasMore: false
    }
  });

  // Transform assessment data to match the expected Assessment type
  const assessments: Assessment[] = (assessmentsData?.items || []).map((item: any) => ({
    id: item.id,
    title: item.title,
    description: item.description || '',
    category: item.category || 'OTHER',
    maxScore: item.maxScore,
    dueDate: item.dueDate,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    _count: item._count,
    subject: item.subject,
    isPublished: item.status === 'ACTIVE'
  }));

  // If there's an error, show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center p-8">
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="text-muted-foreground">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Assessments</h1>
          <p className="text-muted-foreground">
            Manage assessments for {classInfo?.code} - {classInfo?.name}
          </p>
        </div>

        <Link href={`/admin/campus/classes/${classId}/assessments/new`}>
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Create Assessment
          </Button>
        </Link>
      </div>

      <div className="mb-6 w-64">
        <AssessmentLessonPlanFilter
          classId={classId}
          onFilterChange={(value) => setLessonPlanId(value)}
        />
      </div>

      {/* No assessments view */}
      {assessments.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <h3 className="font-medium text-lg mb-2">No assessments yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first assessment to evaluate student progress.
          </p>
          <Link href={`/admin/campus/classes/${classId}/assessments/new`}>
            <Button>
              Create Assessment
            </Button>
          </Link>
        </div>
      ) : (
        <AssessmentsList
          assessments={assessments}
          classId={classId}
        />
      )}
    </div>
  );
}
