'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle,
  X,
  FileText,
  MessageSquare,
  Download,
  Printer
} from 'lucide-react';
import { ArrowLeft, Share2 } from './icons';
import { Grade } from './StudentGradesList';

export interface Question {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'matching' | 'fill-in-blank';
  userAnswer: string;
  correctAnswer: string;
  score: number;
  maxScore: number;
  feedback?: string;
  isCorrect: boolean;
}

export interface StudentGradeDetailProps {
  grade: Grade;
  questions?: Question[];
  onBack?: () => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

/**
 * StudentGradeDetail component with mobile-first design
 *
 * Features:
 * - Detailed grade information
 * - Question-by-question breakdown
 * - Feedback display
 * - Loading and error states
 *
 * @example
 * ```tsx
 * <StudentGradeDetail
 *   grade={grade}
 *   questions={questions}
 *   onBack={() => router.back()}
 * />
 * ```
 */
export const StudentGradeDetail: React.FC<StudentGradeDetailProps> = ({
  grade,
  questions = [],
  onBack,
  isLoading = false,
  error,
  className,
}) => {
  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get grade badge variant
  const getGradeVariant = (grade: string) => {
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'secondary';
    if (grade.startsWith('C')) return 'warning';
    if (grade.startsWith('D')) return 'warning';
    if (grade.startsWith('F')) return 'destructive';
    return 'outline';
  };

  // Get percentage from score and totalScore
  const getPercentage = (score: number, totalScore: number) => {
    return Math.round((score / totalScore) * 100);
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium">Error Loading Grade</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with back button */}
      <div className="flex items-center gap-2 mb-6">
        {onBack && (
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{grade.title}</h1>
          <p className="text-muted-foreground">{grade.className} • {grade.type}</p>
        </div>
      </div>

      {/* Grade summary card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score */}
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <div className="text-4xl font-bold mb-2">{grade.score}/{grade.totalScore}</div>
              <p className="text-lg font-medium">{getPercentage(grade.score, grade.totalScore)}%</p>
              <Badge variant={getGradeVariant(grade.grade)} className="mt-2 text-base px-3 py-1">
                {grade.grade}
              </Badge>
            </div>

            {/* Details */}
            <div className="flex flex-col p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="font-medium">{grade.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{formatDate(grade.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{grade.type}</span>
                </div>
                {grade.term && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Term:</span>
                    <span className="font-medium">{grade.term}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Feedback
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback card */}
      {grade.feedback && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p>{grade.feedback}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions breakdown */}
      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Breakdown</CardTitle>
            <CardDescription>
              Detailed analysis of your answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">Question {index + 1}</h3>
                        <p className="text-sm text-muted-foreground">{question.type}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">{question.score}/{question.maxScore}</span>
                        {question.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <X className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="font-medium mb-2">{question.question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                          <p className={`text-sm p-2 border rounded ${question.isCorrect ? 'border-success bg-success/10' : 'border-destructive bg-destructive/10'}`}>
                            {question.userAnswer}
                          </p>
                        </div>
                        {!question.isCorrect && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                            <p className="text-sm p-2 border border-success bg-success/10 rounded">
                              {question.correctAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {question.feedback && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Feedback:</p>
                        <p className="text-sm">{question.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentGradeDetail;
