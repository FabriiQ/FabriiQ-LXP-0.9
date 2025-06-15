'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/atoms/button';
import { Card } from '~/components/ui/atoms/card';
import { Badge } from '~/components/ui/atoms/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/atoms/tabs';
import { DataTable } from '~/components/ui/data-display/data-table';
import { formatDate } from '~/lib/utils';
import { api } from '~/trpc/react';
import { useToast } from '~/components/ui/feedback/toast';
import { FileEdit, ArrowLeft, FileText, BarChart2, Users, Download } from 'lucide-react';
import { SystemStatus, SubmissionStatus, AssessmentCategory } from '~/server/api/constants';

// Define extended assessment type to handle missing properties
interface ExtendedAssessment {
  id: string;
  title: string;
  category?: AssessmentCategory;
  description?: string;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  status: SystemStatus;
  createdAt: Date;
  updatedAt: Date;
  subjectId: string;
  classId: string;
  termId: string;
  topicId?: string;
  createdById: string;
  gradingType?: string;
  gradingScaleId?: string;
  templateId?: string;
  policyId?: string;
  instructions?: string;
  rubric?: any;
  subject?: {
    id: string;
    code: string;
    name: string;
    course?: {
      id: string;
      code: string;
      name: string;
    };
  };
  class?: {
    id: string;
    name: string;
  };
  term?: {
    id: string;
    name: string;
  };
  topic?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  gradingScale?: {
    id: string;
    name: string;
  };
  policy?: {
    id: string;
    name: string;
  };
  template?: {
    id: string;
    title: string;
  };
  _count?: {
    submissions: number;
  };
  submissions?: any[];
}

// Define extended stats type to handle missing properties
interface ExtendedStats {
  totalSubmissions: number;
  submissionStatusDistribution: Record<string, number>;
  scoreStats: {
    min: number;
    max: number;
    average: number;
    median: number;
  } | null;
  submissionTimeline: Record<string, number>;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  passRate?: number;
  distributionData?: any;
}

interface AssessmentDetailProps {
  assessmentId: string;
}

export function AssessmentDetail({ assessmentId }: AssessmentDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch assessment details
  const { data: assessmentData, isLoading } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );

  // Fetch assessment statistics
  const { data: statsData } = api.assessment.getStats.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );

  // Cast data to extended types
  const assessment = assessmentData as unknown as ExtendedAssessment;
  const stats = statsData as unknown as ExtendedStats;

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>Loading assessment details...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p>Assessment not found.</p>
      </div>
    );
  }

  // Prepare stats data
  if (stats?.scoreStats) {
    stats.averageScore = stats.scoreStats.average;
    stats.highestScore = stats.scoreStats.max;
    stats.lowestScore = stats.scoreStats.min;
    // Calculate pass rate if passingScore is available
    if (assessment.passingScore && stats.totalSubmissions > 0) {
      const passedSubmissions = assessment.submissions?.filter(
        (sub) => (sub.score || 0) >= (assessment.passingScore || 0)
      ).length || 0;
      stats.passRate = passedSubmissions / stats.totalSubmissions;
    }
  }

  // Submission columns for the data table
  const submissionColumns = [
    {
      header: "Student",
      accessorKey: "student.user.name",
      cell: ({ row }: any) => row.original.student?.user?.name || "-",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Badge 
          variant={
            row.original.status === SubmissionStatus.GRADED ? 'success' :
            row.original.status === SubmissionStatus.SUBMITTED ? 'info' :
            row.original.status === SubmissionStatus.LATE ? 'warning' : 'default'
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Score",
      accessorKey: "score",
      cell: ({ row }: any) => row.original.score !== null ? `${row.original.score}/${assessment.maxScore}` : "-",
    },
    {
      header: "Submitted At",
      accessorKey: "submittedAt",
      cell: ({ row }: any) => row.original.submittedAt ? formatDate(row.original.submittedAt) : "-",
    },
    {
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions/${row.original.id}`)}
          >
            <FileText className="mr-1 h-4 w-4" />
            View
          </Button>
          {row.original.status !== SubmissionStatus.GRADED && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions/${row.original.id}/grade`)}
            >
              <BarChart2 className="mr-1 h-4 w-4" />
              Grade
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/system/assessments')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessments
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/system/assessments/${assessmentId}/edit`)}
          >
            <FileEdit className="mr-2 h-4 w-4" />
            Edit Assessment
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/system/assessments/${assessmentId}/submissions`)}
          >
            <Users className="mr-2 h-4 w-4" />
            View All Submissions
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Export functionality would be implemented here
              toast({
                title: "Export initiated",
                description: "Assessment data is being exported",
                variant: "info",
              });
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{assessment.title}</h2>
            <p className="text-muted-foreground">{assessment.category}</p>
          </div>
          <Badge 
            variant={
              assessment.status === SystemStatus.ACTIVE ? 'success' :
              assessment.status === SystemStatus.INACTIVE ? 'warning' : 'default'
            }
          >
            {assessment.status}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-lg font-medium">Details</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Subject:</span>
                    <span>{assessment.subject?.name || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Class:</span>
                    <span>{assessment.class?.name || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Term:</span>
                    <span>{assessment.term?.name || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Topic:</span>
                    <span>{assessment.topic?.name || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Created By:</span>
                    <span>{assessment.createdBy?.name || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Created At:</span>
                    <span>{formatDate(assessment.createdAt)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Last Updated:</span>
                    <span>{formatDate(assessment.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium">Grading Information</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Maximum Score:</span>
                    <span>{assessment.maxScore || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Passing Score:</span>
                    <span>{assessment.passingScore || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Weightage:</span>
                    <span>{assessment.weightage || "-"}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Grading Type:</span>
                    <span>{assessment.gradingType || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Grading Scale:</span>
                    <span>{assessment.gradingScale?.name || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Policy:</span>
                    <span>{assessment.policy?.name || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Template:</span>
                    <span>{assessment.template?.title || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {assessment.description && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Description</h3>
                <p className="whitespace-pre-wrap">{assessment.description}</p>
              </div>
            )}

            {assessment.instructions && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Instructions</h3>
                <p className="whitespace-pre-wrap">{assessment.instructions}</p>
              </div>
            )}

            {assessment.rubric && Array.isArray(assessment.rubric) && assessment.rubric.length > 0 && (
              <div>
                <h3 className="mb-2 text-lg font-medium">Rubric</h3>
                <div className="space-y-4">
                  {assessment.rubric.map((rubricItem: any, index: number) => (
                    <Card key={index} className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-medium">{rubricItem.criteria}</h4>
                        <span className="text-sm text-muted-foreground">Weight: {rubricItem.weight}%</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {rubricItem.levels.map((level: any, levelIndex: number) => (
                          <div key={levelIndex} className="rounded-md border p-2">
                            <div className="mb-1 font-medium">Score: {level.score}</div>
                            <p className="text-sm">{level.description}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="submissions">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Submissions</h3>
                <div className="text-sm text-muted-foreground">
                  Total: {assessment.submissions?.length || 0}
                </div>
              </div>

              {assessment.submissions && assessment.submissions.length > 0 ? (
                <DataTable
                  columns={submissionColumns}
                  data={assessment.submissions}
                  emptyMessage="No submissions found."
                />
              ) : (
                <div className="flex h-40 items-center justify-center">
                  <p>No submissions found.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="statistics">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Assessment Statistics</h3>

              {stats ? (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Average Score</h4>
                    <p className="mt-2 text-2xl font-bold">{stats.averageScore?.toFixed(2) || "-"}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Highest Score</h4>
                    <p className="mt-2 text-2xl font-bold">{stats.highestScore || "-"}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Lowest Score</h4>
                    <p className="mt-2 text-2xl font-bold">{stats.lowestScore || "-"}</p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Pass Rate</h4>
                    <p className="mt-2 text-2xl font-bold">{stats.passRate ? `${(stats.passRate * 100).toFixed(2)}%` : "-"}</p>
                  </Card>
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center">
                  <p>No statistics available.</p>
                </div>
              )}

              {stats && stats.distributionData && (
                <Card className="p-4">
                  <h4 className="mb-4 text-sm font-medium text-muted-foreground">Score Distribution</h4>
                  <div className="h-64">
                    {/* Score distribution chart would be implemented here */}
                    <div className="flex h-full items-center justify-center">
                      <p>Score distribution chart</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 