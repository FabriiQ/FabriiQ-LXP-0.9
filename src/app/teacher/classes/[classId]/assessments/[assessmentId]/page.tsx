"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, CheckCircle, FileText, Edit } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SubmissionStatus, SystemStatus } from "@/server/api/constants";
import { AssessmentAnalyticsDashboard, AssessmentResultsDashboard } from "@/features/assessments/components";
import { BloomsTaxonomyLevel } from "@/features/bloom/types/bloom-taxonomy";

// Define the assessment interface to fix TypeScript errors
interface AssessmentWithDetails {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  status: SystemStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  submissions?: {
    id: string;
    status: SubmissionStatus;
    score: number | null;
    submittedAt: Date | null;
    student?: {
      id: string;
      user: {
        name: string | null;
        email?: string;
      };
    };
  }[];
  _count?: {
    submissions: number;
  };
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const assessmentId = params?.assessmentId as string;

  // Fetch assessment details
  const { data: assessmentData, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({
    assessmentId,
    includeSubmissions: true
  }, {
    enabled: !!assessmentId,
    onError: (error) => {
      console.error("Error fetching assessment:", error);
    }
  });

  // Fetch class details
  const { data: classDetails } = api.class.getById.useQuery({
    classId
  }, {
    enabled: !!classId
  });



  if (isLoadingAssessment) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  // Cast the assessment data to our interface to fix TypeScript errors
  const assessment = assessmentData as unknown as AssessmentWithDetails;

  if (!assessment) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h3 className="text-lg font-medium mb-2">Assessment Not Found</h3>
          <p>The assessment you're looking for doesn't exist or has been removed.</p>
          <Link href={`/teacher/classes/${classId}/assessments`}>
            <Button variant="outline" className="mt-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate submission stats
  const totalSubmissions = assessment.submissions?.length || 0;
  const gradedSubmissions = assessment.submissions?.filter(
    (sub) => sub.status === SubmissionStatus.GRADED
  ).length || 0;
  const pendingSubmissions = totalSubmissions - gradedSubmissions;

  // Mock analytics data (replace with real API calls)
  const mockAnalytics = {
    totalSubmissions,
    gradedSubmissions,
    averageScore: 78.5,
    passingRate: 0.82,
    completionRate: 0.95,
    averageTimeSpent: 45,
    bloomsDistribution: {
      [BloomsTaxonomyLevel.REMEMBER]: { averageScore: 85, maxScore: 100, percentage: 85, studentCount: totalSubmissions },
      [BloomsTaxonomyLevel.UNDERSTAND]: { averageScore: 80, maxScore: 100, percentage: 80, studentCount: totalSubmissions },
      [BloomsTaxonomyLevel.APPLY]: { averageScore: 75, maxScore: 100, percentage: 75, studentCount: totalSubmissions },
      [BloomsTaxonomyLevel.ANALYZE]: { averageScore: 70, maxScore: 100, percentage: 70, studentCount: totalSubmissions },
      [BloomsTaxonomyLevel.EVALUATE]: { averageScore: 65, maxScore: 100, percentage: 65, studentCount: totalSubmissions },
      [BloomsTaxonomyLevel.CREATE]: { averageScore: 60, maxScore: 100, percentage: 60, studentCount: totalSubmissions },
    },
    topicMasteryImpact: [
      { topicId: '1', topicName: 'Introduction to Concepts', averageImpact: 12.5, studentsAffected: 25 },
      { topicId: '2', topicName: 'Advanced Applications', averageImpact: 8.3, studentsAffected: 22 },
    ],
    learningOutcomeAchievement: [
      { outcomeId: '1', outcomeStatement: 'Students will be able to identify key concepts', achievementRate: 0.85, averageScore: 85 },
      { outcomeId: '2', outcomeStatement: 'Students will be able to apply knowledge in new contexts', achievementRate: 0.72, averageScore: 72 },
    ],
    performanceDistribution: [
      { range: '90-100%', count: 8, percentage: 32 },
      { range: '80-89%', count: 10, percentage: 40 },
      { range: '70-79%', count: 5, percentage: 20 },
      { range: '60-69%', count: 2, percentage: 8 },
      { range: 'Below 60%', count: 0, percentage: 0 },
    ],
    strugglingStudents: [
      { studentId: '1', studentName: 'John Doe', score: 58, weakAreas: [BloomsTaxonomyLevel.ANALYZE, BloomsTaxonomyLevel.EVALUATE] },
    ],
    topPerformers: [
      { studentId: '2', studentName: 'Jane Smith', score: 95, strongAreas: [BloomsTaxonomyLevel.CREATE, BloomsTaxonomyLevel.EVALUATE] },
      { studentId: '3', studentName: 'Bob Johnson', score: 92, strongAreas: [BloomsTaxonomyLevel.APPLY, BloomsTaxonomyLevel.ANALYZE] },
    ],
  };

  // Mock results data
  const mockResults = assessment.submissions?.map((sub, index) => ({
    studentId: sub.student?.id || `student-${index}`,
    studentName: sub.student?.user?.name || `Student ${index + 1}`,
    studentEmail: sub.student?.user?.email || `student${index + 1}@example.com`,
    score: sub.score || Math.floor(Math.random() * 40) + 60,
    percentage: sub.score ? (sub.score / (assessment.maxScore || 100)) * 100 : Math.floor(Math.random() * 40) + 60,
    grade: sub.score && sub.score >= 90 ? 'A' : sub.score && sub.score >= 80 ? 'B' : sub.score && sub.score >= 70 ? 'C' : sub.score && sub.score >= 60 ? 'D' : 'F',
    submittedAt: sub.submittedAt || new Date(),
    timeSpent: Math.floor(Math.random() * 30) + 30,
    bloomsLevelScores: {
      [BloomsTaxonomyLevel.REMEMBER]: Math.floor(Math.random() * 20) + 80,
      [BloomsTaxonomyLevel.UNDERSTAND]: Math.floor(Math.random() * 20) + 75,
      [BloomsTaxonomyLevel.APPLY]: Math.floor(Math.random() * 20) + 70,
      [BloomsTaxonomyLevel.ANALYZE]: Math.floor(Math.random() * 20) + 65,
      [BloomsTaxonomyLevel.EVALUATE]: Math.floor(Math.random() * 20) + 60,
      [BloomsTaxonomyLevel.CREATE]: Math.floor(Math.random() * 20) + 55,
    },
    topicMasteryChanges: [],
    learningOutcomeAchievements: [],
  })) || [];

  const mockBloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 85,
    [BloomsTaxonomyLevel.UNDERSTAND]: 80,
    [BloomsTaxonomyLevel.APPLY]: 75,
    [BloomsTaxonomyLevel.ANALYZE]: 70,
    [BloomsTaxonomyLevel.EVALUATE]: 65,
    [BloomsTaxonomyLevel.CREATE]: 60,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/classes/${classId}`}>
              {classDetails?.name || "Class"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/classes/${classId}/assessments`}>
              Assessments
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{assessment.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/teacher/classes/${classId}/assessments`}>
              <Button size="sm" variant="ghost">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <Badge variant={assessment.status === 'ACTIVE' ? "success" : "secondary"}>
              {assessment.status === 'ACTIVE' ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {assessment.subject?.name || "No subject"} • Max Score: {assessment.maxScore || 100}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/classes/${classId}/assessments/${assessmentId}/grade`}>
            <Button variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Grade Submissions
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="results">Results Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {assessment.description ?? "No description provided"}
                  </p>
                </div>
                <div className="border-b my-4"></div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Instructions</h3>
                  <p className="text-sm text-muted-foreground">
                    {assessment.instructions ?? "No instructions provided"}
                  </p>
                </div>
                <div className="border-b my-4"></div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Due Date</h3>
                  <p className="text-sm">
                    {assessment.dueDate
                      ? new Date(assessment.dueDate).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submission Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <p className="text-2xl font-bold">{totalSubmissions}</p>
                  </div>
                  <div className="border-b my-4"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Graded</p>
                    <p className="text-2xl font-bold">{gradedSubmissions}</p>
                  </div>
                  <div className="border-b my-4"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{pendingSubmissions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
              <CardDescription>
                View and grade student submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment.submissions && assessment.submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Student</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Submitted</th>
                        <th className="text-left py-2 px-4">Score</th>
                        <th className="text-right py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.submissions.map((submission) => (
                        <tr key={submission.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">
                            <div>
                              <p className="font-medium">{submission.student?.user?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{submission.student?.user?.email ?? ""}</p>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <Badge
                              variant={
                                submission.status === SubmissionStatus.GRADED
                                  ? "success"
                                  : submission.status === SubmissionStatus.LATE
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">
                            {submission.submittedAt
                              ? new Date(submission.submittedAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="py-2 px-4">
                            {submission.score !== null
                              ? `${submission.score}/${assessment.maxScore || 100}`
                              : "Not graded"}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/teacher/classes/${classId}/assessments/${assessmentId}/grade`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Grade
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    There are no submissions for this assessment yet. Check back later.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AssessmentAnalyticsDashboard
            assessmentId={assessmentId}
            assessmentTitle={assessment.title}
            maxScore={assessment.maxScore || 100}
            passingScore={assessment.passingScore || 60}
            analytics={mockAnalytics}
            onRefresh={() => {
              // Refresh analytics data
              console.log('Refreshing analytics...');
            }}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <AssessmentResultsDashboard
            assessmentId={assessmentId}
            assessmentTitle={assessment.title}
            maxScore={assessment.maxScore || 100}
            passingScore={assessment.passingScore || 60}
            results={mockResults}
            bloomsDistribution={mockBloomsDistribution}
            onExportResults={() => {
              // Export results functionality
              console.log('Exporting results...');
            }}
            onViewStudentDetail={(studentId) => {
              // Navigate to student detail view
              console.log('Viewing student detail:', studentId);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
