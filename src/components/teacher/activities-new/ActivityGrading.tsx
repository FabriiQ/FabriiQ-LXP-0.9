'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Search, Save, User, Check, X, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { SubmissionStatus } from '@/server/api/constants';

// Import all activity viewers from the new architecture
import {
  MultipleChoiceViewer,
  TrueFalseViewer,
  MultipleResponseViewer,
  FillInTheBlanksViewer,
  MatchingViewer,
  SequenceViewer,
  DragAndDropViewer,
  DragTheWordsViewer,
  FlashCardsViewer,
  NumericViewer,
  QuizViewer,
  ReadingViewer,
  VideoViewer,
} from '@/features/activties';

interface ActivityGradingProps {
  activityId: string;
  classId: string;
  className?: string;
}

export function ActivityGrading({
  activityId,
  classId,
  className
}: ActivityGradingProps) {
  const { toast } = useToast();

  // State for selected student and grading
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch activity details
  const { data: activity, isLoading: isLoadingActivity } = api.activity.getById.useQuery({
    id: activityId
  });

  // Fetch submissions for this activity
  const { data: submissions, isLoading: isLoadingSubmissions, refetch: refetchSubmissions } = api.activityGrade.getByActivity.useQuery({
    activityId
  });

  // Fetch students for this class
  const { data: students, isLoading: isLoadingStudents } = api.student.getClassEnrollments.useQuery({
    classId
  });

  // Save grade mutation
  const saveGrade = api.activityGrade.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade saved successfully",
      });
      setIsSubmitting(false);
      refetchSubmissions();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save grade: ${error.message}`,
        variant: "error",
      });
      setIsSubmitting(false);
    },
  });

  // Handle save grade
  const handleSaveGrade = () => {
    if (!selectedStudentId || score === null) {
      toast({
        title: "Error",
        description: "Please select a student and enter a score",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);

    saveGrade.mutate({
      activityId,
      studentId: selectedStudentId,
      score,
      feedback,
      status: SubmissionStatus.GRADED
    });
  };

  // Get student submission
  const getStudentSubmission = (studentId: string) => {
    if (!submissions) return null;
    return submissions.find(submission => submission.studentId === studentId);
  };

  // Filter students based on search query
  const filteredStudents = students?.filter(student => {
    if (!searchQuery) return true;

    // Access name from the user object in the student enrollment
    const fullName = student.student.user.name || '';
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Render the appropriate viewer component based on activity type
  const renderViewer = () => {
    if (!activity || !activity.content) return null;

    const submission = selectedStudentId ? getStudentSubmission(selectedStudentId) : null;
    const studentAnswers = submission?.content || {};

    // Cast the content to the appropriate type based on activityType
    const activityContent = activity.content as Record<string, any>;
    const activityType = activityContent.activityType as string;

    const commonProps = {
      activity: activityContent,
      mode: 'teacher' as const,
      studentAnswers,
    };

    switch (activityType) {
      case 'multiple-choice':
        return <MultipleChoiceViewer {...commonProps as any} />;
      case 'true-false':
        return <TrueFalseViewer {...commonProps as any} />;
      case 'multiple-response':
        return <MultipleResponseViewer {...commonProps as any} />;
      case 'fill-in-the-blanks':
        return <FillInTheBlanksViewer {...commonProps as any} />;
      case 'matching':
        return <MatchingViewer {...commonProps as any} />;
      case 'sequence':
        return <SequenceViewer {...commonProps as any} />;
      case 'drag-and-drop':
        return <DragAndDropViewer {...commonProps as any} />;
      case 'drag-the-words':
        return <DragTheWordsViewer {...commonProps as any} />;
      case 'flash-cards':
        return <FlashCardsViewer {...commonProps as any} />;
      case 'numeric':
        return <NumericViewer {...commonProps as any} />;
      case 'quiz':
        return <QuizViewer {...commonProps as any} />;
      case 'reading':
        return <ReadingViewer {...commonProps as any} />;
      case 'video':
        return <VideoViewer {...commonProps as any} />;
      default:
        return <div>No viewer available for this activity type</div>;
    }
  };

  // Loading state
  if (isLoadingActivity || isLoadingSubmissions || isLoadingStudents) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!activity || !students) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="p-6 text-center">
          <p>Failed to load activity or student data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center space-x-2">
        <Link href={`/teacher/classes/${classId}/activities/${activityId}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Activity
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Grade: {activity.title}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No students found
                  </p>
                ) : (
                  filteredStudents.map(student => {
                    const submission = getStudentSubmission(student.id);
                    const hasSubmitted = !!submission;
                    const isGraded = hasSubmitted && submission.score !== null;

                    return (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-md cursor-pointer",
                          selectedStudentId === student.id ? "bg-primary/10" : "hover:bg-muted",
                          isGraded ? "border-l-4 border-green-500" : hasSubmitted ? "border-l-4 border-blue-500" : ""
                        )}
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          const submission = getStudentSubmission(student.id);
                          setScore(submission?.score || null);
                          setFeedback(submission?.feedback || '');
                        }}
                      >
                        <div className="flex items-center">
                          <User className="h-5 w-5 mr-2 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{student.student.user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {hasSubmitted ? (
                                isGraded ? (
                                  <span className="flex items-center text-green-600">
                                    <Check className="h-3 w-3 mr-1" />
                                    Graded: {submission.score}/100
                                  </span>
                                ) : (
                                  <span className="flex items-center text-blue-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Submitted, not graded
                                  </span>
                                )
                              ) : (
                                <span className="flex items-center text-gray-500">
                                  <X className="h-3 w-3 mr-1" />
                                  Not submitted
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {hasSubmitted && (
                          <Badge variant={isGraded ? "success" : "secondary"}>
                            {isGraded ? "Graded" : "Pending"}
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedStudentId ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Submission</CardTitle>
                  <CardDescription>
                    {(() => {
                      const student = students.find(s => s.id === selectedStudentId);
                      const submission = getStudentSubmission(selectedStudentId);

                      if (!student) return "Student not found";

                      return `${student.student.user.name}'s submission ${
                        submission?.submittedAt
                          ? `(submitted on ${format(new Date(submission.submittedAt), 'MMM d, yyyy, h:mm a')})`
                          : '(not submitted)'
                      }`;
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const submission = getStudentSubmission(selectedStudentId);

                    if (!submission) {
                      return (
                        <div className="text-center py-12">
                          <X className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-medium mb-2">No submission</h3>
                          <p className="text-muted-foreground">
                            This student has not submitted this activity yet
                          </p>
                        </div>
                      );
                    }

                    return renderViewer();
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grading</CardTitle>
                  <CardDescription>
                    Provide a score and feedback for this submission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="score">Score (out of 100)</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        value={score === null ? '' : score}
                        onChange={(e) => setScore(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="Enter score"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Feedback</Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Enter feedback for the student"
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    onClick={handleSaveGrade}
                    disabled={isSubmitting || score === null}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Grade
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No student selected</h3>
                <p className="text-muted-foreground">
                  Select a student from the list to view their submission and provide grading
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
