'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SubmissionStatus } from '@/server/api/constants';

export default function AssessmentSubmissionsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  // In Next.js 15+, params is a Promise that needs to be unwrapped with use()
  // We need to cast it to avoid TypeScript errors
  const { id: assessmentId } = params;

  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { assessmentId },
    { enabled: !!assessmentId }
  );

  // Fetch submissions for this assessment
  const { data: submissionsData, isLoading: isLoadingSubmissions } = api.assessment.getSubmissions.useQuery(
    { assessmentId },
    { enabled: !!assessmentId }
  );

  const isLoading = isLoadingAssessment || isLoadingSubmissions;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const submissions = submissionsData?.submissions || [];

  // Define columns for the data table
  const submissionColumns = [
    {
      accessorKey: "student",
      header: "Student",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.student?.user?.name || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground">{row.original.student?.user?.email || ''}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => {
        const status = row.original.status as SubmissionStatus;
        let badgeVariant = "outline";
        let icon = null;

        switch (status) {
          case SubmissionStatus.SUBMITTED:
            badgeVariant = "outline";
            icon = <Clock className="h-3 w-3 mr-1" />;
            break;
          case SubmissionStatus.LATE:
            badgeVariant = "warning";
            icon = <AlertCircle className="h-3 w-3 mr-1" />;
            break;
          case SubmissionStatus.GRADED:
            badgeVariant = "success";
            icon = <CheckCircle className="h-3 w-3 mr-1" />;
            break;
          // RESUBMIT status not available in current enum
          // case SubmissionStatus.RESUBMIT:
          //   badgeVariant = "error";
          //   icon = <AlertCircle className="h-3 w-3 mr-1" />;
          //   break;
        }

        return (
          <Badge variant={badgeVariant as any} className="flex items-center">
            {icon}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }: any) => (
        <div>
          {row.original.score !== null
            ? `${row.original.score}/${assessment?.maxScore || 100}`
            : 'Not graded'}
        </div>
      ),
    },
    {
      accessorKey: "submittedAt",
      header: "Submitted At",
      cell: ({ row }: any) => (
        <div>
          {row.original.submittedAt
            ? formatDate(new Date(row.original.submittedAt))
            : 'Unknown'}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}/submissions/${row.original.id}`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            View
          </Button>
          {row.original.status !== SubmissionStatus.GRADED && (
            <Button
              size="sm"
              onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}/submissions/${row.original.id}`)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Grade
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Assessment Submissions"
          description={`Submissions for ${assessment?.title || 'Assessment'}`}
        />
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>
            {submissions.length} submissions received
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={submissionColumns}
            data={submissions}
            pagination
          />
        </CardContent>
      </Card>
    </div>
  );
}
