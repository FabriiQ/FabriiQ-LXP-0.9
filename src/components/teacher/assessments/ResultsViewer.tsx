"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ResultsViewerProps {
  assessmentId: string;
}

interface Student {
  id: string;
  user: {
    name: string;
    email: string;
  };
}

interface Submission {
  id: string;
  studentId: string;
  assessmentId: string;
  submittedAt: Date | string;
  status: string;
  score: number | null;
  feedback: string | null;
  student: Student;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  dueDate: Date | string;
  maxScore: number;
  classId: string;
}

export default function ResultsViewer({ assessmentId }: ResultsViewerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({ 
    id: assessmentId 
  });
  
  // Get submissions for this assessment
  const { data: submissionsData, isLoading: isLoadingSubmissions } = api.submission.list.useQuery({ 
    assessmentId,
  });
  
  // Extract submissions from paginated response
  const submissions = submissionsData?.items || [];
  
  // Get class students to check who hasn't submitted
  const { data: classStudents, isLoading: isLoadingStudents } = api.class.list.useQuery(
    { classId: assessment?.classId || "" },
    { enabled: !!assessment?.classId }
  );
  
  const students = classStudents?.items || [];
  
  // Loading state
  if (isLoadingAssessment || isLoadingSubmissions || isLoadingStudents) {
    return <ResultsViewerSkeleton />;
  }
  
  if (!assessment) {
    return <div>Assessment not found</div>;
  }
  
  // Calculate statistics
  const totalStudents = students.length || 0;
  const submittedCount = submissions.length || 0;
  const gradedCount = submissions.filter((sub: any) => sub.score !== null).length || 0;
  const pendingCount = totalStudents - submittedCount;
  const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;
  
  // Calculate score distribution
  const scoreDistribution = calculateScoreDistribution(submissions as unknown as Submission[], assessment.maxScore || 100);
  
  // Calculate average score
  const totalScore = submissions.reduce((sum: number, sub: any) => {
    return sum + (sub.score || 0);
  }, 0);
  const averageScore = gradedCount > 0 ? totalScore / gradedCount : 0;
  const averagePercentage = assessment.maxScore && assessment.maxScore > 0 
    ? (averageScore / assessment.maxScore) * 100 
    : 0;
  
  // Identify students who haven't submitted
  const submittedStudentIds = new Set(submissions.map((sub: any) => sub.studentId));
  const missingSubmissions = students.filter(
    (student: any) => !submittedStudentIds.has(student.id)
  );
  
  // Prepare data for charts
  const chartData = {
    labels: Object.keys(scoreDistribution),
    datasets: [
      {
        data: Object.values(scoreDistribution),
        backgroundColor: ["#4f46e5", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6", "#10b981"],
      },
    ],
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{assessment.title}</CardTitle>
        <CardDescription>
          Due: {format(new Date(assessment.dueDate || new Date()), "PPP")} • Max Score: {assessment.maxScore || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-md">
            <p className="text-sm text-gray-500">Submission Rate</p>
            <p className="text-2xl font-bold">{submissionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-500">
              {submittedCount} of {totalStudents} students
            </p>
          </div>
          
          <div className="p-4 border rounded-md">
            <p className="text-sm text-gray-500">Average Score</p>
            <p className="text-2xl font-bold">
              {averageScore.toFixed(1)} / {assessment.maxScore || 0}
            </p>
            <p className="text-sm text-gray-500">{averagePercentage.toFixed(1)}%</p>
          </div>
          
          <div className="p-4 border rounded-md">
            <p className="text-sm text-gray-500">Highest Score</p>
            <p className="text-2xl font-bold">
              {getHighestScore(submissions)} / {assessment.maxScore || 0}
            </p>
          </div>
          
          <div className="p-4 border rounded-md">
            <p className="text-sm text-gray-500">Lowest Score</p>
            <p className="text-2xl font-bold">
              {getLowestScore(submissions)} / {assessment.maxScore || 0}
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="missing">Missing Submissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* Chart component would go here */}
                    <div className="flex flex-col h-full justify-center items-center">
                      <p className="text-gray-500">Score distribution visualization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Submission Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* Chart component would go here */}
                    <div className="flex flex-col h-full justify-center items-center">
                      <div className="w-full max-w-xs">
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Submitted</span>
                            <span className="text-sm">{submittedCount} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${submissionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Missing</span>
                            <span className="text-sm">{pendingCount} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gray-400 h-2 rounded-full" 
                              style={{ width: `${100 - submissionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="submissions" className="mt-6">
            {!submissions || submissions.length === 0 ? (
              <p className="text-gray-500">No submissions yet.</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission: any) => (
                  <div key={submission.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{submission.student.user.name}</h3>
                        <p className="text-sm text-gray-500">
                          Submitted: {format(new Date(submission.submittedAt), "PPP")}
                        </p>
                      </div>
                      <div>
                        {submission.score !== null ? (
                          <Badge variant="outline">
                            Score: {submission.score} / {assessment.maxScore || 0}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Graded</Badge>
                        )}
                      </div>
                    </div>
                    
                    {submission.feedback && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium">Feedback:</p>
                        <p className="text-sm">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="missing" className="mt-6">
            {missingSubmissions.length === 0 ? (
              <p className="text-gray-500">All students have submitted.</p>
            ) : (
              <div className="space-y-4">
                {missingSubmissions.map((student: any) => (
                  <div key={student.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{student.user.name}</h3>
                        <p className="text-sm text-gray-500">{student.user.email}</p>
                      </div>
                      <Badge variant="outline" className="bg-gray-100">Missing</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function calculateScoreDistribution(submissions: Submission[], maxScore: number) {
  // Create score ranges
  const ranges: Record<string, number> = {
    "90-100%": 0,
    "80-89%": 0,
    "70-79%": 0,
    "60-69%": 0,
    "Below 60%": 0,
  };
  
  // Count submissions in each range
  submissions.forEach((submission: Submission) => {
    if (submission.score === null) return;
    
    const percentage = maxScore > 0 ? (submission.score / maxScore) * 100 : 0;
    
    if (percentage >= 90) ranges["90-100%"]++;
    else if (percentage >= 80) ranges["80-89%"]++;
    else if (percentage >= 70) ranges["70-79%"]++;
    else if (percentage >= 60) ranges["60-69%"]++;
    else ranges["Below 60%"]++;
  });
  
  return ranges;
}

function getHighestScore(submissions: Submission[]): number {
  if (!submissions.length) return 0;
  return Math.max(...submissions.map(s => s.score || 0));
}

function getLowestScore(submissions: Submission[]): number {
  if (!submissions.length) return 0;
  const scores = submissions.filter(s => s.score !== null).map(s => s.score || 0);
  return scores.length ? Math.min(...scores) : 0;
}

function ResultsViewerSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border rounded-md">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
          
          <Skeleton className="h-10 w-64 mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 