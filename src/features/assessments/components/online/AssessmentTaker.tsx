'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/trpc/react';
import { Question, SubmissionStatus } from '../../types';
import { QuestionRenderer } from './QuestionRenderer';
import { ProgressTracker } from './ProgressTracker';
import { SubmissionConfirmDialog } from './SubmissionConfirmDialog';
import { formatTimeRemaining } from '../../utils/time-utils';

interface AssessmentTakerProps {
  assessmentId: string;
  studentId: string;
  className?: string;
}

export function AssessmentTaker({
  assessmentId,
  studentId,
  className = '',
}: AssessmentTakerProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State for the assessment taking experience
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  // Fetch assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { enabled: !!assessmentId }
  );
  
  // Submit assessment mutation
  const submitMutation = api.assessment.submit.useMutation({
    onSuccess: () => {
      toast({
        title: 'Assessment Submitted',
        description: 'Your assessment has been submitted successfully.',
        variant: 'success',
      });
      router.push(`/student/assessments/${assessmentId}/confirmation`);
    },
    onError: (error) => {
      toast({
        title: 'Submission Error',
        description: error.message || 'Failed to submit assessment. Please try again.',
        variant: 'error',
      });
    },
  });
  
  // Handle timer if assessment has time limit
  useEffect(() => {
    if (assessment?.timeLimit) {
      // Initialize timer based on time limit (in minutes)
      const initialTime = assessment.timeLimit * 60;
      setTimeRemaining(initialTime);
      
      // Set up timer
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) {
            clearInterval(timer);
            // Auto-submit when time is up
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [assessment]);
  
  // Handle answer change
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    
    // Mark question as answered
    if (assessment?.questions) {
      const questionIndex = assessment.questions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1) {
        setAnsweredQuestions((prev) => {
          const updated = new Set(prev);
          updated.add(questionIndex);
          return updated;
        });
      }
    }
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (assessment?.questions && currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Jump to specific question
  const handleJumpToQuestion = (index: number) => {
    if (assessment?.questions && index >= 0 && index < assessment.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  
  // Handle assessment submission
  const handleSubmit = () => {
    if (!assessment?.questions) return;
    
    // Format answers for submission
    const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
    
    // Submit assessment
    submitMutation.mutate({
      id: assessmentId,
      answers: formattedAnswers,
    });
  };
  
  // Calculate progress percentage
  const progressPercentage = assessment?.questions
    ? (answeredQuestions.size / assessment.questions.length) * 100
    : 0;
  
  // Get current question
  const currentQuestion = assessment?.questions?.[currentQuestionIndex];
  
  if (isLoadingAssessment) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p>Loading assessment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!assessment) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p>Assessment not found or not available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{assessment.title}</CardTitle>
            <CardDescription>
              {assessment.description}
            </CardDescription>
          </div>
          
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              <span>{formatTimeRemaining(timeRemaining)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progress: {answeredQuestions.size} of {assessment.questions?.length || 0} questions answered
            </span>
            <span className="text-sm font-medium">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
        
        {/* Question display */}
        {currentQuestion && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                Question {currentQuestionIndex + 1} of {assessment.questions?.length || 0}
              </h3>
              <div className="text-sm text-muted-foreground">
                {currentQuestion.points || 1} point{(currentQuestion.points || 1) !== 1 ? 's' : ''}
              </div>
            </div>
            
            <QuestionRenderer
              question={currentQuestion}
              value={answers[currentQuestion.id || '']}
              onChange={(value) => handleAnswerChange(currentQuestion.id || '', value)}
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between border-t p-6">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handlePrevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={handleNextQuestion}
            disabled={!assessment.questions || currentQuestionIndex === assessment.questions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            onClick={() => setIsSubmitDialogOpen(true)}
            disabled={submitMutation.isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Submit Assessment
          </Button>
        </div>
      </CardFooter>
      
      {/* Question navigation sidebar */}
      <div className="fixed top-1/2 right-4 transform -translate-y-1/2">
        <ProgressTracker
          totalQuestions={assessment.questions?.length || 0}
          answeredQuestions={answeredQuestions}
          currentIndex={currentQuestionIndex}
          onSelectQuestion={handleJumpToQuestion}
        />
      </div>
      
      {/* Submission confirmation dialog */}
      <SubmissionConfirmDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onConfirm={handleSubmit}
        totalQuestions={assessment.questions?.length || 0}
        answeredQuestions={answeredQuestions.size}
        isSubmitting={submitMutation.isLoading}
      />
    </Card>
  );
}
