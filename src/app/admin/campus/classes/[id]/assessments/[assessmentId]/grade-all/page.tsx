'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { ClassLayout } from '../../../components/ClassLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/atoms/separator';
import { BulkGradingForm } from './components/BulkGradingForm';
import { SubmissionStatus } from '@/server/api/constants';

export default function BulkGradePage({
  params
}: {
  params: { id: string; assessmentId: string };
}) {
  const { id: classId, assessmentId } = params;

  const { data: assessment } = api.assessment.getById.useQuery({
    assessmentId,
    includeQuestions: true,
    includeSubmissions: false
  });

  const { data: submissionsData } = api.assessment.listSubmissions.useQuery({
    assessmentId,
    status: SubmissionStatus.SUBMITTED,
  });

  const submissions = submissionsData?.items || [];

  if (!assessment) {
    return (
      <ClassLayout classId={classId} activeTab="assessments">
        <div className="p-6">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Assessment not found</h3>
            <Link href={`/admin/campus/classes/${classId}/assessments`}>
              <Button>
                Back to Assessments
              </Button>
            </Link>
          </div>
        </div>
      </ClassLayout>
    );
  }

  return (
    <ClassLayout classId={classId} activeTab="assessments">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
            <Button size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Submissions
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Bulk Grade Assessment</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{assessment.subject.name}</CardTitle>
                <CardDescription>
                  {submissions.length} submissions awaiting grading
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <BulkGradingForm
                    classId={classId}
                    assessmentId={assessmentId}
                    submissions={submissions.map(sub => ({
                      id: sub.id,
                      studentId: sub.student.id,
                      student: {
                        id: sub.student.id,
                        user: {
                          id: sub.student.user.id,
                          name: sub.student.user.name || '',
                          email: sub.student.user.email || '',
                        }
                      },
                      status: sub.status,
                      submittedAt: sub.submittedAt || undefined
                    }))}
                    assessment={{
                      id: assessment.id,
                      title: assessment.subject.name,
                      maxScore: assessment.maxScore || 0,
                      description: assessment.subject.code || '',
                      questions: [],
                      dueDate: assessment.dueDate || undefined
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      There are no submissions awaiting grading for this assessment.
                    </p>
                    <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}`}>
                      <Button>
                        Back to Assessment
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ClassLayout>
  );
}
