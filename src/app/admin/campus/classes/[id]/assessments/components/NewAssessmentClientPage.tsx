'use client';

import React from 'react';
import { ChunkedAssessmentForm } from './form/ChunkedAssessmentForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';

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
  console.log('NewAssessmentClientPage - Subjects:', subjects);
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

      <ChunkedAssessmentForm
        classId={classId}
        subjects={subjects}
        action="create"
      />
    </div>
  );
}
