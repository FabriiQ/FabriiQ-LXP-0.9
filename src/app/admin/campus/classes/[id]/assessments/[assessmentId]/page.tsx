'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { PageLayout } from '@/components/layout/page-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import {
  Edit2,
  FileText,
  ArrowLeft,
  UserCheck,
  BarChart,
  Eye,
  EyeOff,
  Trash
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/data-display/badge';
import { Separator } from '@/components/ui/atoms/separator';
import { SystemStatus } from '@prisma/client';

// Define interfaces for type safety
interface AssessmentStats {
  totalSubmissions: number;
  scoreStats?: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  submissionStatusDistribution?: Record<string, number>;
  submissionTimeline?: Record<string, number>;
}

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const assessmentId = params.assessmentId as string;
  
  // Use tRPC hooks for data fetching
  const { data: classInfo } = api.class.getById.useQuery({
    classId,
    include: {
      students: false,
      teachers: true
    }
  }, {
    enabled: !!classId,
    retry: 1
  });
  
  const { data: assessment, isLoading: isAssessmentLoading, error: assessmentError } = api.assessment.getById.useQuery({
    assessmentId,
    includeSubmissions: true
  }, {
    enabled: !!assessmentId,
    retry: 1,
    onError: (err) => {
      console.error('Error fetching assessment:', err);
    }
  });
  
  const { data: stats, isLoading: isStatsLoading } = api.assessment.getStats.useQuery({
    id: assessmentId
  }, {
    enabled: !!assessmentId && !!assessment,
    retry: 1
  }) as { data: AssessmentStats | undefined, isLoading: boolean };
  
  // Mutations
  const publishMutation = api.assessment.publishAssessment.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
    onError: (err) => {
      console.error('Error publishing assessment:', err);
      alert('Failed to publish assessment');
    }
  });
  
  const unpublishMutation = api.assessment.unpublishAssessment.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
    onError: (err) => {
      console.error('Error unpublishing assessment:', err);
      alert('Failed to unpublish assessment');
    }
  });
  
  const deleteMutation = api.assessment.delete.useMutation({
    onSuccess: () => {
      router.push(`/admin/campus/classes/${classId}/assessments`);
    },
    onError: (err) => {
      console.error('Error deleting assessment:', err);
      alert('Failed to delete assessment');
    }
  });
  
  // Loading state
  const loading = isAssessmentLoading || isStatsLoading;
  const error = assessmentError ? 'Failed to load assessment data' : null;
  
  if (loading) {
    return (
      <PageLayout
        title="Loading Assessment"
        description="Please wait while we load the assessment details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assessment details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (error) {
    return (
      <PageLayout
        title="Error"
        description="There was a problem loading the assessment"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Error', href: '#' },
        ]}
      >
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
          <Link href={`/admin/campus/classes/${classId}/assessments`}>
            <button className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors">
              Back to Assessments
            </button>
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  if (!assessment) {
    return (
      <PageLayout
        title="Assessment Not Found"
        description="The requested assessment could not be found"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Not Found', href: '#' },
        ]}
      >
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
          <h3 className="text-lg font-medium mb-2">Assessment Not Found</h3>
          <p>The assessment you're looking for doesn't exist or has been removed.</p>
          <Link href={`/admin/campus/classes/${classId}/assessments`}>
            <button className="mt-4 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors">
              Back to Assessments
            </button>
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  // Get assessment properties safely
  const assessmentType = assessment.gradingConfig?.type || 'Unknown';
  const assessmentDescription = assessment.gradingConfig?.description || '';
  const assessmentInstructions = assessment.gradingConfig?.instructions || '';
  const gradingScale = assessment.gradingScaleId ? 'Custom Scale' : 'Default';
  
  return (
    <PageLayout
      title={assessment.title}
      description="Assessment details"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
        { label: assessment.title, href: '#' },
      ]}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/admin/campus/classes/${classId}/assessments`}>
              <Button size="sm" variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <Badge variant={assessment.status === SystemStatus.ACTIVE ? "success" : "secondary"}>
              {assessment.status === SystemStatus.ACTIVE ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {assessmentType} • {assessment.subject.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          {assessment.status === SystemStatus.ACTIVE ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (unpublishMutation && typeof unpublishMutation.mutate === 'function') {
                  unpublishMutation.mutate(assessmentId);
                }
              }}
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (publishMutation && typeof publishMutation.mutate === 'function') {
                  publishMutation.mutate(assessmentId);
                }
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          )}

          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Submissions
            </Button>
          </Link>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
                if (deleteMutation && typeof deleteMutation.mutate === 'function') {
                  deleteMutation.mutate(assessmentId);
                }
              }
            }}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assessmentDescription && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">{assessmentDescription}</p>
                  </div>
                )}

                {assessmentInstructions && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Instructions</h3>
                    <p className="text-sm text-muted-foreground">{assessmentInstructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Max Score</h3>
                    <p className="text-sm">{assessment.maxScore}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Passing Score</h3>
                    <p className="text-sm">{assessment.passingScore || 'Not set'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Weightage</h3>
                    <p className="text-sm">{assessment.weightage}%</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Grading Type</h3>
                    <p className="text-sm">{assessment.gradingType || 'Not set'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Grading Scale</h3>
                    <p className="text-sm">{gradingScale}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Due Date</h3>
                    <p className="text-sm">
                      {assessment.dueDate
                        ? format(new Date(assessment.dueDate), 'PPP')
                        : 'No due date'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submission Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Submissions</span>
                  <span className="text-sm">{stats?.totalSubmissions || 0}</span>
                </div>

                <Separator />

                {stats?.scoreStats && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Score Distribution</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Highest</span>
                          <span className="text-xs font-medium">{stats.scoreStats.max}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Average</span>
                          <span className="text-xs font-medium">
                            {stats.scoreStats.average.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Lowest</span>
                          <span className="text-xs font-medium">{stats.scoreStats.min}</span>
                        </div>
                      </div>
                    </div>

                    <Separator />
                  </>
                )}

                <div>
                  <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
                    <Button className="w-full">
                      <UserCheck className="h-4 w-4 mr-2" />
                      View All Submissions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Statistics</CardTitle>
              <CardDescription>
                Performance analytics for this assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.totalSubmissions > 0 ? (
                <div className="space-y-6">
                  {/* Score Distribution */}
                  {stats.scoreStats && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Score Distribution</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Average Score</p>
                              <p className="text-2xl font-bold">
                                {stats.scoreStats.average.toFixed(1)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Median Score</p>
                              <p className="text-2xl font-bold">{stats.scoreStats.median}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Highest Score</p>
                              <p className="text-2xl font-bold">{stats.scoreStats.max}</p>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Lowest Score</p>
                              <p className="text-2xl font-bold">{stats.scoreStats.min}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Submission Status Distribution */}
                  {stats.submissionStatusDistribution && Object.keys(stats.submissionStatusDistribution).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Submission Status</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(stats.submissionStatusDistribution).map(([status, count]) => (
                          <Card key={status}>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">{status}</p>
                                <p className="text-2xl font-bold">{String(count)}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submission Timeline */}
                  {stats.submissionTimeline && Object.keys(stats.submissionTimeline).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Submission Timeline</h3>
                      <div className="h-60 border rounded-md p-4">
                        <p className="text-center text-muted-foreground">
                          Submission timeline visualization would go here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Statistics will be available once students start submitting their assessments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
