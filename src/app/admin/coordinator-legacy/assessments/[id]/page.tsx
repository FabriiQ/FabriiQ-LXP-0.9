'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-display/data-table';
import { LoadingSpinner } from '@/components/ui/loading';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle, Users, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SubmissionStatus, AssessmentCategory } from '@/server/api/constants';

export default function AssessmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  // In Next.js 15+, params is a Promise that needs to be unwrapped with use()
  // We need to cast it to avoid TypeScript errors
  const { id: assessmentId } = params;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch assessment details
  const { data: assessmentData, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { assessmentId, includeQuestions: true },
    { enabled: !!assessmentId }
  );

  // Create a safe assessment object with default values for missing properties
  const assessment = assessmentData ? {
    ...assessmentData,
    title: assessmentData.title || 'Untitled Assessment',
    description: 'No description provided',
    category: AssessmentCategory.ASSIGNMENT,
    instructions: '',
    questions: [],
    class: { name: assessmentData.classId ? 'Class ' + assessmentData.classId : 'Unknown Class' },
    weightage: assessmentData.weightage || 0,
    passingScore: assessmentData.passingScore || 0,
  } as any : null;

  // We don't need this type anymore since we're using 'as any'
  // Keeping the type definition commented for reference
  /*
  type AssessmentWithAllProps = typeof assessmentData & {
    title: string;
    description: string;
    category: AssessmentCategory;
    instructions: string;
    questions: any[];
    class: { name: string };
    weightage: number;
    passingScore: number;
  };
  */

  // Fetch submissions for this assessment
  const { data: submissionsData, isLoading: isLoadingSubmissions } = api.assessment.getSubmissions.useQuery(
    { assessmentId },
    { enabled: !!assessmentId }
  );

  const isLoading = isLoadingAssessment || isLoadingSubmissions;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!assessment) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <p className="text-muted-foreground">Assessment not found</p>
              <Button
                className="mt-4"
                onClick={() => router.push('/admin/coordinator/assessments')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assessments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submissions = submissionsData?.submissions || [];

  // Calculate submission statistics
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(
    (sub: any) => sub.status === SubmissionStatus.GRADED
  ).length;
  const pendingSubmissions = totalSubmissions - gradedSubmissions;
  const averageScore = submissions.length > 0
    ? submissions.reduce((sum: number, sub: any) => sum + (sub.score || 0), 0) / totalSubmissions
    : 0;

  // Define columns for the submissions table
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
            ? `${row.original.score}/${assessment.maxScore || 100}`
            : 'Not graded'}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}/submissions/${row.original.id}`)}
        >
          <FileText className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
    },
  ];

  const getCategoryBadge = (category: AssessmentCategory) => {
    switch (category) {
      case AssessmentCategory.QUIZ:
        return <Badge variant="outline">Quiz</Badge>;
      case AssessmentCategory.ASSIGNMENT:
        return <Badge variant="outline">Assignment</Badge>;
      case AssessmentCategory.PROJECT:
        return <Badge variant="outline">Project</Badge>;
      case AssessmentCategory.EXAM:
        return <Badge variant="outline">Exam</Badge>;
      // LAB category not available in current enum
      // case AssessmentCategory.LAB:
      //   return <Badge variant="outline">Lab</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            className="mb-2"
            onClick={() => router.push('/admin/coordinator/assessments')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
          <PageHeader
            title={assessment.title}
            description={assessment.description || 'No description provided'}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Assessment
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}/submissions`)}
          >
            <Users className="mr-2 h-4 w-4" />
            All Submissions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageScore.toFixed(1)} / {assessment.maxScore || 100}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Recent Submissions</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                  <div>{getCategoryBadge(assessment.category as AssessmentCategory)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div>
                    <Badge variant={assessment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {assessment.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Class</h3>
                  <div>{assessment.class?.name || 'Unknown'}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Subject</h3>
                  <div>{assessment.subject?.name || 'Unknown'}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Due Date</h3>
                  <div>
                    {assessment.dueDate
                      ? formatDate(new Date(assessment.dueDate))
                      : 'No due date'}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Max Score</h3>
                  <div>{assessment.maxScore || 100}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Passing Score</h3>
                  <div>{assessment.passingScore || 'Not specified'}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Weightage</h3>
                  <div>{assessment.weightage || 0}%</div>
                </div>
              </div>

              {assessment.instructions && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Instructions</h3>
                  <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
                    {assessment.instructions}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                Showing the most recent submissions for this assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length > 0 ? (
                <DataTable
                  columns={submissionColumns}
                  data={submissions.slice(0, 5)}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions received yet
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/coordinator/assessments/${assessmentId}/submissions`)}
              >
                View All Submissions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {assessment.questions && assessment.questions.length > 0 ? (
                assessment.questions.map((question: any, index: number) => (
                  <div key={question.id || index} className="border rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <Badge variant="outline">{question.type}</Badge>
                    </div>
                    <p className="mb-4">{question.text}</p>

                    {question.type === 'MULTIPLE_CHOICE' && question.options && (
                      <div className="space-y-2 ml-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Options:</h4>
                        <ul className="list-disc ml-4">
                          {question.options.map((option: any, optIndex: number) => (
                            <li key={option.id || optIndex} className="flex items-center">
                              <span>{option.text}</span>
                              {option.isCorrect && (
                                <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-2 text-sm text-muted-foreground">
                      Points: {question.maxScore || 10}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No questions available for this assessment
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
