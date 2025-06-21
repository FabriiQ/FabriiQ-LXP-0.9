import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/server/db';
import { ClassLayout } from '../../../../../components/ClassLayout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  User,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/data-display/badge';
import { Separator } from '@/components/ui/separator';
import { SubmissionStatus } from '@prisma/client';
import { GradingForm } from './components/GradingForm';

export const metadata: Metadata = {
  title: 'Grade Submission',
  description: 'Grade a student assessment submission',
};

export default async function GradeSubmissionPage({
  params
}: {
  params: Promise<{ id: string; assessmentId: string; submissionId: string }>
}) {
  const { id: classId, assessmentId, submissionId } = await params;
  
  try {
    // Fetch assessment details
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Fetch submission details
    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!assessment || !submission) {
      return notFound();
    }
    
    // Format submission date
    const submittedAt = submission.submittedAt 
      ? format(new Date(submission.submittedAt), 'PPP, h:mm a')
      : 'Not submitted';
    
    return (
      <ClassLayout 
        classId={classId} 
        activeTab="assessments"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
                  <Button size="sm" variant="ghost">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Submissions
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">Grade Submission</h1>
              </div>
              <p className="text-muted-foreground">
                {assessment.title}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              {/* Student Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Student Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Name</h3>
                      <p>{submission.student.user.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Email</h3>
                      <p>{submission.student.user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Submission Date</h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{submittedAt}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Status</h3>
                      <Badge className="capitalize">
                        {submission.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Assessment Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Assessment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Title</h3>
                      <p>{assessment.title}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Subject</h3>
                      <p>{assessment.subject.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Maximum Score</h3>
                      <p>{assessment.maxScore}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Due Date</h3>
                      <p>
                        {assessment.dueDate 
                          ? format(new Date(assessment.dueDate), 'PPP') 
                          : 'No due date'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              {/* Grading Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Grading
                  </CardTitle>
                  <CardDescription>
                    Evaluate the student's submission and provide feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GradingForm 
                    classId={classId}
                    assessmentId={assessmentId}
                    submissionId={submissionId}
                    assessment={assessment}
                    submission={submission}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ClassLayout>
    );
  } catch (error) {
    console.error('Error loading submission grade page:', error);
    return (
      <ClassLayout classId={classId} activeTab="assessments">
        <div className="p-6">
          <div className="text-center p-8">
            <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">
              We encountered an error while loading the submission grading page.
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