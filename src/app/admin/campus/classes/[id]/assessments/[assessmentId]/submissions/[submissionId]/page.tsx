import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/server/db';
import { ClassLayout } from '@/app/admin/campus/classes/[id]/components/ClassLayout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  FileText,
  CheckCircle2,
  Download,
  Clock,
  User,
  CalendarClock
} from 'lucide-react';
import { Badge } from '@/components/ui/data-display/badge';
import { Separator } from '@/components/ui/atoms/separator';
import { SubmissionStatus } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Submission Details',
  description: 'View student assessment submission details',
};

function getSubmissionStatusBadge(status: SubmissionStatus) {
  let variant: 'default' | 'success' | 'destructive' | 'warning' | 'outline' = 'default';
  
  switch (status) {
    case SubmissionStatus.GRADED:
      variant = 'success';
      break;
    case SubmissionStatus.SUBMITTED:
      variant = 'default';
      break;
    case SubmissionStatus.LATE:
      variant = 'warning';
      break;
    case SubmissionStatus.REJECTED:
      variant = 'destructive';
      break;
    case SubmissionStatus.RESUBMITTED:
      variant = 'outline';
      break;
  }
  
  return (
    <Badge variant={variant} className="capitalize">
      {status.toLowerCase().replace('_', ' ')}
    </Badge>
  );
}

// Types to handle assessment data
type AssessmentQuestion = {
  id: string;
  text: string;
  type: string;
  points?: number;
  choices?: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }>;
};

// Types to handle submission data
type SubmissionAnswer = {
  questionId: string;
  value?: string;
  choiceId?: string;
  score?: number;
  feedback?: string;
};

export default async function SubmissionDetailPage({
  params
}: {
  params: Promise<{ id: string; assessmentId: string; submissionId: string }>;
}) {
  const { id: classId, assessmentId, submissionId } = await params;
  
  try {
    // Fetch class details
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: false,
        teachers: false
      }
    });
    
    // Fetch assessment details 
    const assessment = await prisma.assessment.findUnique({ 
      where: { id: assessmentId }
    });
    
    // Fetch submission details
    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    if (!classInfo || !assessment || !submission) {
      throw new Error('Required data not found');
    }
    
    // Parse questions and answers from JSON content
    const questions = assessment.gradingConfig 
      ? (JSON.parse(assessment.gradingConfig.toString()).questions as AssessmentQuestion[]) || []
      : [];
      
    const answers = submission.content 
      ? (JSON.parse(submission.content.toString()).answers as SubmissionAnswer[]) || []
      : [];
    
    const submissionDate = submission.submittedAt 
      ? new Date(submission.submittedAt)
      : null;
    
    const isDueDatePassed = assessment.dueDate && submissionDate 
      ? submissionDate > new Date(assessment.dueDate) 
      : false;
    
    return (
      <ClassLayout 
        classId={classId} 
        activeTab="assessments"
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
              <Button size="sm" variant="ghost">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Submissions
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Submission Details</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{assessment.title}</CardTitle>
                      <CardDescription>
                        Submitted by {submission.student.user.name}
                      </CardDescription>
                    </div>
                    <div>
                      {getSubmissionStatusBadge(submission.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-8 text-sm">
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{submission.student.user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          Submitted: {submissionDate?.toLocaleString() || 'N/A'}
                          {isDueDatePassed && (
                            <span className="text-destructive ml-1">(Late)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Due: {assessment.dueDate 
                          ? new Date(assessment.dueDate).toLocaleString() 
                          : 'No due date'}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {submission.status === SubmissionStatus.GRADED && (
                      <div className="bg-muted p-4 rounded-md">
                        <h3 className="font-medium mb-2">Grading Information</h3>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-2xl font-bold">
                            {submission.score ?? 0}/{assessment.maxScore ?? 100}
                          </div>
                          <div className="text-muted-foreground">
                            {Math.round(((submission.score ?? 0) / (assessment.maxScore ?? 100)) * 100)}%
                          </div>
                        </div>
                        
                        {submission.feedback && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Feedback</h4>
                            <p className="text-sm">{String(submission.feedback)}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-medium mb-4">Student Answers</h3>
                      
                      {answers && answers.length > 0 ? (
                        <div className="space-y-6">
                          {answers.map((answer, index) => {
                            const question = questions.find(
                              (q) => q.id === answer.questionId
                            );
                            
                            return (
                              <div key={index} className="border p-4 rounded-md">
                                <div className="mb-2">
                                  <h4 className="font-medium">
                                    Question {index + 1}: {question?.text || 'Unknown Question'}
                                  </h4>
                                  {question?.type && (
                                    <div className="text-xs text-muted-foreground mb-2">
                                      {question.type}
                                    </div>
                                  )}
                                </div>
                                
                                <Separator className="mb-3" />
                                
                                <div>
                                  <h5 className="text-sm font-medium mb-1">Student Response:</h5>
                                  {answer.value ? (
                                    <p className="text-sm bg-muted p-2 rounded-md">
                                      {answer.value}
                                    </p>
                                  ) : answer.choiceId ? (
                                    <p className="text-sm bg-muted p-2 rounded-md">
                                      {question?.choices?.find((c) => c.id === answer.choiceId)?.text || 'Selected Choice'}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">
                                      No answer provided
                                    </p>
                                  )}
                                </div>
                                
                                {submission.status === SubmissionStatus.GRADED && answer.score !== undefined && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex justify-between items-center">
                                      <h5 className="text-sm font-medium">Score:</h5>
                                      <div className="font-medium">
                                        {answer.score}/{question?.points || '?'}
                                      </div>
                                    </div>
                                    {answer.feedback && (
                                      <div className="mt-2">
                                        <h5 className="text-sm font-medium mb-1">Feedback:</h5>
                                        <p className="text-sm text-muted-foreground">
                                          {answer.feedback}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-medium mb-2">No answers found</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            This submission doesn't contain any answers.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  {submission.status !== SubmissionStatus.GRADED && (
                    <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/grade`}>
                      <Button>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Grade Submission
                      </Button>
                    </Link>
                  )}
                  
                  {submission.status === SubmissionStatus.GRADED && (
                    <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions/${submissionId}/grade`}>
                      <Button variant="outline">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Edit Grading
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-1">Title</h3>
                      <p>{assessment.title}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-1">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {assessment.gradingConfig 
                          ? JSON.parse(assessment.gradingConfig.toString()).description 
                          : 'No description provided'}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-1">Max Score</h3>
                      <p>{assessment.maxScore ?? 100} points</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-1">Questions</h3>
                      <p>{questions ? questions.length : 0} questions</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-1">Due Date</h3>
                      <p>
                        {assessment.dueDate 
                          ? new Date(assessment.dueDate).toLocaleDateString() 
                          : 'No due date'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ClassLayout>
    );
  } catch (error) {
    console.error('Error loading submission details:', error);
    return (
      <ClassLayout classId={classId} activeTab="assessments">
        <div className="p-6">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              We encountered an error while loading the submission details.
            </p>
            <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
              <Button>
                Back to Submissions
              </Button>
            </Link>
          </div>
        </div>
      </ClassLayout>
    );
  }
} 
