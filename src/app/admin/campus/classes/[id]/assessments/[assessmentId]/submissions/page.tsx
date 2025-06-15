'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { PageLayout } from '@/components/layout/page-layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/data-display/badge';
import { SubmissionStatus } from "@/server/api/constants";

// Helper functions for submission status display
function getSubmissionStatusIcon(status: SubmissionStatus) {
  switch (status) {
    case 'GRADED':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'SUBMITTED':
      return <Clock className="h-4 w-4 text-primary" />;
    case 'LATE':
      return <AlertCircle className="h-4 w-4 text-warning" />;
    case 'REJECTED':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'RESUBMITTED':
      return <RotateCcw className="h-4 w-4 text-info" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function getSubmissionStatusBadge(status: SubmissionStatus) {
  let variant: 'default' | 'success' | 'destructive' | 'warning' | 'outline' = 'default';

  switch (status) {
    case 'GRADED':
      variant = 'success';
      break;
    case 'SUBMITTED':
      variant = 'default';
      break;
    case 'LATE':
      variant = 'warning';
      break;
    case 'REJECTED':
      variant = 'destructive';
      break;
    case 'RESUBMITTED':
      variant = 'outline';
      break;
  }

  return (
    <Badge variant={variant} className="capitalize">
      {status.toLowerCase().replace('_', ' ')}
    </Badge>
  );
}

export default function AssessmentSubmissionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const classId = params.id as string;
  const assessmentId = params.assessmentId as string;
  const statusParam = searchParams.get('status');
  const status = statusParam ? statusParam as SubmissionStatus : null;
  const pageParam = searchParams.get('page');
  const page = pageParam ? Number(pageParam) : 1;
  const pageSize = 20;

  // State for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch class details
  const { data: classInfo } = api.class.getById.useQuery({
    classId
  }, {
    enabled: !!classId,
    retry: 1
  });

  // Fetch assessment details
  const { data: assessment } = api.assessment.getById.useQuery({
    assessmentId,
    includeSubmissions: false
  }, {
    enabled: !!assessmentId,
    retry: 1
  });

  // Fetch submissions
  const { data: submissionsData, isLoading: isSubmissionsLoading } = api.assessment.listSubmissions.useQuery({
    assessmentId,
    status: statusParam ? statusParam as SubmissionStatus : undefined,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }, {
    enabled: !!assessmentId,
    retry: 1,
    onError: (err) => {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    }
  });

  // Update loading state
  useEffect(() => {
    setLoading(isSubmissionsLoading || !assessment || !classInfo);
    if (assessment && classInfo && submissionsData) {
      setError(null);
    }
  }, [isSubmissionsLoading, assessment, classInfo, submissionsData]);

  // Handle loading state
  if (loading) {
    return (
      <PageLayout
        title="Loading Submissions"
        description="Please wait while we load the submissions"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Assessment', href: `/admin/campus/classes/${classId}/assessments/${assessmentId}` },
          { label: 'Submissions', href: '#' },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading submissions...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Handle error state
  if (error || !assessment || !submissionsData) {
    return (
      <PageLayout
        title="Error"
        description="There was a problem loading the submissions"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Assessment', href: `/admin/campus/classes/${classId}/assessments/${assessmentId}` },
          { label: 'Error', href: '#' },
        ]}
      >
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p>{error || 'We encountered an error while loading the submissions.'}</p>
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}`}>
            <button className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors">
              Back to Assessment
            </button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  const submissions = submissionsData.items || [];
  const total = submissionsData.total || 0;

  return (
    <PageLayout
      title="Assessment Submissions"
      description={`Submissions for ${assessment.title}`}
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
        { label: assessment.title, href: `/admin/campus/classes/${classId}/assessments/${assessmentId}` },
        { label: 'Submissions', href: '#' },
      ]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}`}>
              <Button size="sm" variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Submissions</h1>
          </div>
          <p className="text-muted-foreground">
            {assessment.title} • {total} submissions
          </p>
        </div>

        <div className="flex gap-2">
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/grade-all`}>
            <Button>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Bulk Grade
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
            <Button
              variant={!statusParam ? "default" : "outline"}
              size="sm"
            >
              All
            </Button>
          </Link>
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions?status=SUBMITTED`}>
            <Button
              variant={statusParam === 'SUBMITTED' ? "default" : "outline"}
              size="sm"
            >
              Submitted
            </Button>
          </Link>
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions?status=GRADED`}>
            <Button
              variant={statusParam === 'GRADED' ? "default" : "outline"}
              size="sm"
            >
              Graded
            </Button>
          </Link>
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions?status=LATE`}>
            <Button
              variant={statusParam === 'LATE' ? "default" : "outline"}
              size="sm"
            >
              Late
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length > 0 ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission: any) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="font-medium">
                          {submission.student.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {submission.student.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.submittedAt
                          ? new Date(submission.submittedAt).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSubmissionStatusIcon(submission.status as SubmissionStatus)}
                          {getSubmissionStatusBadge(submission.status as SubmissionStatus)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.score !== null
                          ? `${submission.score}/${assessment.maxScore || 0}`
                          : 'Not graded'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions/${submission.id}`}>
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions/${submission.id}/grade`}>
                            <Button size="sm">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Grade
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {total > pageSize && (
                <div className="flex justify-center gap-2 mt-6">
                  {page > 1 && (
                    <Link
                      href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions?page=${page - 1}${statusParam ? `&status=${statusParam}` : ''}`}
                    >
                      <Button variant="outline" size="sm">Previous</Button>
                    </Link>
                  )}

                  <div className="flex items-center px-4">
                    <span className="text-sm">
                      Page {page} of {Math.ceil(total / pageSize)}
                    </span>
                  </div>

                  {page < Math.ceil(total / pageSize) && (
                    <Link
                      href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions?page=${page + 1}${statusParam ? `&status=${statusParam}` : ''}`}
                    >
                      <Button variant="outline" size="sm">Next</Button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                {statusParam
                  ? `There are no submissions with the status "${statusParam.toLowerCase()}".`
                  : 'No students have submitted this assessment yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
