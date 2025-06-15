"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { format } from "date-fns";
import { SystemStatus } from "@prisma/client";

enum SubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  LATE = "LATE",
  GRADED = "GRADED"
}

interface FieldProps {
  field: {
    value: any;
    onChange: (value: any) => void;
  };
}

interface Submission {
  id: string;
  studentId: string;
  assessmentId: string;
  content: any;
  submittedAt: Date | string | null;
  status: string;
  score?: number | null;
  feedback?: string;
  student: {
    user: {
      name: string | null;
      email: string;
    }
  };
}

interface GradingInterfaceProps {
  assessmentId: string;
}

interface Assessment {
  id: string;
  title: string;
  status: SystemStatus;
  institutionId: string;
  termId: string;
  subjectId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  subject: {
    id: string;
    code: string;
    name: string;
    course: {
      id: string;
      code: string;
      name: string;
    };
  };
  submissions: {
    id: string;
    score: number | null;
    status: SubmissionStatus;
    submittedAt: Date | null;
    student: {
      id: string;
      user: {
        name: string | null;
        email: string;
      };
    };
  }[];
  _count: {
    submissions: number;
  };
}

const gradingSchema = z.object({
  score: z.coerce.number().min(0, "Score must be at least 0"),
  feedback: z.string().optional(),
});

type GradingFormValues = z.infer<typeof gradingSchema>;

export default function GradingInterface({ assessmentId }: GradingInterfaceProps) {
  const { toast } = useToast();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  
  // Get assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { id: assessmentId },
    {
      select: (data) => {
        if (!data) return null;
        return {
          ...data,
          submissions: data.submissions.map(sub => ({
            id: sub.id,
            score: sub.score,
            status: sub.status as SubmissionStatus,
            submittedAt: sub.submittedAt,
            student: {
              id: sub.student.id,
              user: {
                name: sub.student.user.name,
                email: sub.student.user.email
              }
            }
          }))
        };
      }
    }
  );
  
  // Get submissions for this assessment
  const { data: submissions, isLoading: isLoadingSubmissions } = api.submission.list.useQuery({ 
    assessmentId 
  });
  
  // Grade submission mutation
  const gradeSubmissionMutation = api.submission.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Submission graded",
        description: "The submission has been graded successfully.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grade submission. Please try again.",
        variant: "error",
      });
    },
  });
  
  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      score: 0,
      feedback: "",
    },
  });
  
  const onSubmit = (data: GradingFormValues) => {
    if (!selectedSubmissionId) return;
    
    gradeSubmissionMutation.mutate({
      id: selectedSubmissionId,
      data: {
        score: data.score,
        feedback: data.feedback || "",
      }
    });
  };
  
  // Calculate stats
  const submissionCount = submissions?.items?.length || 0;
  const gradedCount = submissions?.items?.filter((sub: any) => sub.score !== null && sub.score !== undefined).length || 0;
  const averageScore = submissions?.items?.length 
    ? submissions.items.reduce((sum: number, sub: any) => sum + (sub.score || 0), 0) / submissions.items.length 
    : 0;
  
  // Get submission status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "default";
      case "graded":
        return "secondary";
      case "late":
        return "destructive";
      default:
        return "outline";
    }
  };
  
  if (isLoadingAssessment || isLoadingSubmissions) {
    return <GradingInterfaceSkeleton />;
  }
  
  if (!assessment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Assessment not found.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{assessment.subject.name}</CardTitle>
          <CardDescription>
            Course: {assessment.subject.course.name} • 
            Code: {assessment.subject.code}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-md">
              <p className="text-sm text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold">{assessment._count.submissions}</p>
            </div>
            <div className="p-4 border rounded-md">
              <p className="text-sm text-gray-500">Graded</p>
              <p className="text-2xl font-bold">{gradedCount} / {submissionCount}</p>
            </div>
            <div className="p-4 border rounded-md">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
            </div>
          </div>
          
          <Tabs defaultValue="submissions">
            <TabsList>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="grading">Grading</TabsTrigger>
            </TabsList>
            
            <TabsContent value="submissions" className="mt-6">
              {!submissions || submissions.items.length === 0 ? (
                <p className="text-gray-500">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {submissions.items.map((submission: any) => (
                    <div 
                      key={submission.id} 
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${
                        selectedSubmissionId === submission.id ? 'border-primary-500 bg-primary-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedSubmissionId(submission.id);
                        form.setValue('score', submission.score || 0);
                        form.setValue('feedback', submission.feedback || '');
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{submission.student.user.name || 'Unnamed Student'}</p>
                          <p className="text-sm text-gray-500">{submission.student.user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(submission.status)}>
                            {submission.status}
                          </Badge>
                          {submission.score !== null && submission.score !== undefined && (
                            <span className="text-sm font-medium">{submission.score} / {assessment.maxScore}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Submitted: {submission.submittedAt ? format(new Date(submission.submittedAt), "PPP") : "Not submitted"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="grading" className="mt-6">
              {!selectedSubmissionId ? (
                <p className="text-gray-500">Select a submission to grade.</p>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Submission Details</h3>
                    <p className="text-sm text-gray-500">
                      Student: {submissions?.items?.find((s: any) => s.id === selectedSubmissionId)?.student.user.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Submitted: {format(new Date(submissions?.items?.find((s: any) => s.id === selectedSubmissionId)?.submittedAt || new Date()), "PPP")}
                    </p>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="score"
                        render={({ field }: FieldProps) => (
                          <FormItem>
                            <FormLabel>Score</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                max={assessment.maxScore || undefined} 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum score: {assessment.maxScore}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="feedback"
                        render={({ field }: FieldProps) => (
                          <FormItem>
                            <FormLabel>Feedback</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide feedback to the student" 
                                className="min-h-[120px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={gradeSubmissionMutation.isLoading}
                      >
                        {gradeSubmissionMutation.isLoading ? "Saving..." : "Save Grade"}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function GradingInterfaceSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-md">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          
          <Skeleton className="h-10 w-48 mb-6" />
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 