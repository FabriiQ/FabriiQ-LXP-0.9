'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { Edit, Trash, BarChart2, Users, ClipboardCheck } from 'lucide-react';
import { api } from '@/trpc/react';
import { formatDate } from '@/utils/format';
import { useToast } from '@/components/ui/feedback/toast';
import { SystemStatus } from '@prisma/client';

interface AssessmentTemplateDetailProps {
  templateId: string;
}

export function AssessmentTemplateDetail({ templateId }: AssessmentTemplateDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Fetch template data
  const { data: template, isLoading } = api.assessment.getById.useQuery({ id: templateId });

  // Fetch template stats
  const { data: stats } = api.assessment.getStats.useQuery({ id: templateId });

  // Delete mutation
  const deleteMutation = api.assessment.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      router.push('/admin/academic/assessments');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete template',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{template.title}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center text-sm">
                  <ClipboardCheck className="h-4 w-4 mr-1" />
                  {template.category}
                </div>
                {template.description && (
                  <p className="mt-2">{template.description}</p>
                )}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Badge variant={
                template.status === SystemStatus.ACTIVE ? 'success' :
                template.status === SystemStatus.INACTIVE ? 'warning' : 'secondary'
              }>
                {template.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Maximum Score</p>
              <p className="text-2xl">{template.maxScore}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Weightage</p>
              <p className="text-2xl">{template.weightage}%</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <div className="text-sm text-muted-foreground">
            Created {formatDate(template.createdAt)}
            {template.updatedAt !== template.createdAt && (
              <> · Updated {formatDate(template.updatedAt)}</>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/academic/assessments/${template.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this template?')) {
                  deleteMutation.mutate({ id: template.id });
                }
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Tabs defaultValue="rubric">
        <TabsList>
          <TabsTrigger value="rubric">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Rubric
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Users className="h-4 w-4 mr-2" />
            Submissions ({template._count?.submissions || 0})
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart2 className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rubric" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Rubric</CardTitle>
              <CardDescription>Criteria and scoring levels for assessment</CardDescription>
            </CardHeader>
            <CardContent>
              {template.rubric && (template.rubric as any[]).length > 0 ? (
                <div className="space-y-6">
                  {(template.rubric as any[]).map((criteria, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">{criteria.criteria}</h4>
                          <p className="text-sm text-muted-foreground">Weight: {criteria.weight}%</p>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        {criteria.levels.map((level: any, levelIndex: number) => (
                          <div key={levelIndex} className="flex justify-between items-center border-t pt-2">
                            <div>
                              <p className="font-medium">Level {level.score}</p>
                              <p className="text-sm">{level.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No rubric defined for this template
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>List of student submissions for this assessment</CardDescription>
            </CardHeader>
            <CardContent>
              {template.submissions && template.submissions.length > 0 ? (
                <div className="space-y-4">
                  {template.submissions.map((submission: any) => (
                    <div key={submission.id} className="flex justify-between items-center border-b pb-4">
                      <div>
                        <p className="font-medium">{submission.student.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Badge variant={
                          submission.status === 'GRADED' ? 'success' :
                          submission.status === 'SUBMITTED' ? 'warning' : 'secondary'
                        }>
                          {submission.status}
                        </Badge>
                        {submission.score !== null && (
                          <p className="ml-4 font-medium">{submission.score} / {template.maxScore}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No submissions yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Statistics</CardTitle>
              <CardDescription>Overview of submission and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Submission Status</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.submissionStatusDistribution).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center">
                          <span>{status}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {stats.scoreStats && (
                    <div>
                      <h4 className="font-medium mb-2">Score Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Average Score</span>
                          <span>{stats.scoreStats.average.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Highest Score</span>
                          <span>{stats.scoreStats.max}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Lowest Score</span>
                          <span>{stats.scoreStats.min}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Median Score</span>
                          <span>{stats.scoreStats.median}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No statistics available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 