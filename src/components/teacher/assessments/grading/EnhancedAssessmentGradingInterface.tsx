"use client";

import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AssessmentGradingHeader } from "./AssessmentGradingHeader";
import { StudentList } from "./StudentList";
import type { StudentWithSubmission } from "./StudentList";
import { EnhancedGradingInterface } from "@/features/assessments/components/grading/EnhancedGradingInterface";
import { BatchGrading } from "@/features/assessments/components/grading/BatchGrading";
import { SubmissionStatus } from "@/server/api/constants";
import { BloomsTaxonomyLevel } from "@/features/bloom/types/bloom-taxonomy";

interface EnhancedAssessmentGradingProps {
  assessment: any;
  classId: string;
  isClassTeacher: boolean;
}

export default function EnhancedAssessmentGradingInterface({
  assessment,
  classId,
  isClassTeacher,
}: EnhancedAssessmentGradingProps) {
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [batchGrading, setBatchGrading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch class students
  const { data: classData, isLoading: isLoadingClass, refetch: refetchClass } = api.class.getById.useQuery(
    {
      classId,
      include: {
        students: true,
        teachers: false
      }
    },
    {
      enabled: !!classId,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to load class data: ${error.message}`,
          variant: "error",
        });
      },
    }
  );

  // Fetch submissions for this assessment
  const { data: submissionsData, isLoading: isLoadingSubmissions, refetch: refetchSubmissions } = api.assessment.listSubmissions.useQuery(
    { assessmentId: assessment.id },
    {
      enabled: !!assessment.id,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to load submissions: ${error.message}`,
          variant: "error",
        });
      },
    }
  );

  // Grade submission mutation
  const gradeMutation = api.assessment.grade.useMutation({
    onSuccess: async (data) => {
      console.log('Grade submission successful:', data);
      toast({
        title: "Success",
        description: "Submission graded successfully",
        variant: "success",
      });

      // Refetch both submissions and class data to ensure UI updates
      try {
        await Promise.all([
          refetchSubmissions(),
          refetchClass()
        ]);
        console.log('Data refreshed after grading');
      } catch (error) {
        console.error('Error refreshing data after grading:', error);
      }
    },
    onError: (error: any) => {
      console.error('Grade submission error:', error);
      toast({
        title: "Error",
        description: `Failed to grade submission: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Create manual submission mutation
  const createSubmissionMutation = api.assessment.createSubmission.useMutation({
    onSuccess: () => {
      console.log('Manual submission created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create manual submission:', error);
    },
  });

  // Helper function to create manual submission
  const createManualSubmission = async (assessmentId: string, studentId: string) => {
    return createSubmissionMutation.mutateAsync({
      assessmentId,
      studentId,
      answers: [], // Empty answers for manual assessment
    });
  };

  // Combine students and submissions data
  const studentsWithSubmissions: StudentWithSubmission[] = useMemo(() => {
    if (!classData || !submissionsData) {
      console.log('Missing data for studentsWithSubmissions:', {
        hasClassData: !!classData,
        hasSubmissionsData: !!submissionsData
      });
      return [];
    }

    const students = (classData as any).students || [];
    const submissions = (submissionsData as any).items || [];

    console.log('Building studentsWithSubmissions:', {
      studentsCount: students.length,
      submissionsCount: submissions.length,
      submissions: submissions.map((s: any) => ({
        id: s.id,
        studentId: s.studentId,
        status: s.status,
        score: s.score
      }))
    });

    const result = students.map((enrollment: any): StudentWithSubmission => {
      const studentId = enrollment.studentId || enrollment.student?.id;
      const submission = submissions.find((sub: any) => sub.studentId === studentId);

      const studentWithSubmission = {
        id: studentId,
        name: enrollment.student?.user?.name || "Unknown",
        email: enrollment.student?.user?.email || "",
        submission: submission
          ? {
              id: submission.id,
              status: typeof submission.status === 'string' ? submission.status : String(submission.status),
              score: submission.score || 0,
              feedback: submission.feedback ? String(submission.feedback) : "",
              submittedAt: submission.submittedAt ? new Date(submission.submittedAt) : undefined,
            }
          : undefined,
      };

      if (submission) {
        console.log(`Student ${studentWithSubmission.name} has submission:`, {
          submissionId: submission.id,
          status: submission.status,
          score: submission.score
        });
      }

      return studentWithSubmission;
    });

    console.log('Final studentsWithSubmissions result:', result.length, 'students');
    return result;
  }, [(classData as any)?.students, (submissionsData as any)?.items]);

  // Handle student selection
  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
  }, []);

  // Toggle batch grading mode
  const toggleBatchGrading = useCallback(() => {
    setBatchGrading((prev) => !prev);
  }, []);

  // Determine grading method based on assessment configuration
  const gradingMethod = useMemo(() => {
    const hasRubric = assessment.rubricId && assessment.bloomsRubric;

    // Transform rubric data for debugging
    const transformedCriteria = hasRubric ? (assessment.bloomsRubric.criteria || []).map((criterion: any) => ({
      id: criterion.id,
      name: criterion.name,
      criteriaLevelsCount: criterion.criteriaLevels?.length || 0,
      transformedPerformanceLevels: (criterion.criteriaLevels || []).map((cl: any) => ({
        levelId: cl.performanceLevel?.id,
        score: cl.performanceLevel?.score,
        name: cl.performanceLevel?.name,
      }))
    })) : [];

    console.log('Grading Method Debug:', {
      assessmentId: assessment.id,
      rubricId: assessment.rubricId,
      hasBloomsRubric: !!assessment.bloomsRubric,
      bloomsRubricCriteria: assessment.bloomsRubric?.criteria?.length || 0,
      bloomsRubricPerformanceLevels: assessment.bloomsRubric?.performanceLevels?.length || 0,
      transformedCriteria,
      gradingMethod: hasRubric ? 'RUBRIC_BASED' : 'SCORE_BASED'
    });
    return hasRubric ? 'RUBRIC_BASED' : 'SCORE_BASED';
  }, [assessment.rubricId, assessment.bloomsRubric]);

  // Handle enhanced grading submission
  const handleEnhancedGrading = useCallback(async (result: {
    score: number;
    feedback?: string;
    criteriaGrades?: any[];
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  }) => {
    console.log('handleEnhancedGrading called with:', result);

    if (!selectedStudentId) {
      console.error('No student selected');
      toast({
        title: "Error",
        description: "No student selected for grading",
        variant: "error",
      });
      return;
    }

    const student = studentsWithSubmissions.find(s => s.id === selectedStudentId);
    if (!student) {
      console.error('Student not found');
      toast({
        title: "Error",
        description: "Selected student not found",
        variant: "error",
      });
      return;
    }

    // For manual assessments, create submission if it doesn't exist
    if (!student.submission) {
      console.log('No submission found for student:', student.name, '- creating manual submission');

      // Create a manual submission for this student
      try {
        const newSubmission = await createManualSubmission(assessment.id, student.id);
        console.log('Created manual submission:', newSubmission.id);

        // Update the student object with the new submission
        student.submission = {
          id: newSubmission.id,
          status: 'SUBMITTED',
          score: 0,
          feedback: '',
          submittedAt: new Date(),
        };

        // Refresh submissions data to reflect the new submission
        refetchSubmissions();
      } catch (error) {
        console.error('Failed to create manual submission:', error);
        toast({
          title: "Error",
          description: `Failed to create submission for ${student.name}. Please try again.`,
          variant: "error",
        });
        return;
      }
    }

    console.log('Submitting grade for submission:', student.submission.id);

    // Prepare grading data for API
    const gradingData = {
      submissionId: student.submission.id,
      gradingType: 'RUBRIC' as const,
      score: result.score,
      feedback: result.feedback || "",
      status: SubmissionStatus.GRADED,
      // Add rubric-specific data
      rubricResults: result.criteriaGrades?.map(cg => ({
        criteriaId: cg.criterionId,
        performanceLevelId: cg.levelId,
        score: cg.score,
        feedback: cg.feedback || '',
      })) || [],
      bloomsLevelScores: result.bloomsLevelScores || {},
      updateTopicMastery: true,
    };

    console.log('Final grading data:', gradingData);

    gradeMutation.mutate(gradingData);
  }, [selectedStudentId, studentsWithSubmissions, gradeMutation, createManualSubmission, assessment.id, refetchSubmissions, toast]);

  // Calculate stats
  const gradedSubmissionsCount = useMemo(() => {
    return studentsWithSubmissions.filter(
      (student: StudentWithSubmission) => student.submission?.status === SubmissionStatus.GRADED
    ).length;
  }, [studentsWithSubmissions]);

  // Loading state
  if (isLoadingClass || isLoadingSubmissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading grading interface...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!assessment || !classData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-700">
          Could not load the assessment or class data. Please try again.
        </p>
      </div>
    );
  }

  // Debug logging
  console.log('Enhanced Grading Debug:', {
    assessmentId: assessment.id,
    rubricId: assessment.rubricId,
    hasRubric: !!assessment.rubric,
    gradingMethod,
    studentsCount: studentsWithSubmissions.length
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <AssessmentGradingHeader
          title={assessment.title}
          description={`Grade student submissions for ${assessment.title}`}
          maxScore={assessment.maxScore || 100}
          submissionCount={gradedSubmissionsCount}
          totalStudents={studentsWithSubmissions.length}
          isBatchGrading={batchGrading}
          isClassTeacher={isClassTeacher}
          onToggleBatchGrading={toggleBatchGrading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {batchGrading ? (
          <BatchGrading
            students={studentsWithSubmissions.map(student => ({
              id: student.id,
              name: student.name,
              email: student.email,
              submissionId: student.submission?.id,
              currentScore: student.submission?.score || 0,
              currentFeedback: student.submission?.feedback || '',
              status: student.submission?.status as any || 'NOT_SUBMITTED',
              submittedAt: student.submission?.submittedAt,
            }))}
            maxScore={assessment.maxScore || 100}
            gradingMethod={gradingMethod as 'SCORE_BASED' | 'RUBRIC_BASED'}
            bloomsDistribution={assessment.bloomsDistribution as Record<BloomsTaxonomyLevel, number>}
            onSave={async (grades) => {
              // Handle batch grading save
              console.log('Batch grading save:', grades);
            }}
            isSaving={false}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-1 border rounded-md p-4">
              <TabsContent value="all" className="mt-0">
                <StudentList
                  students={studentsWithSubmissions}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  filter="all"
                  maxScore={assessment.maxScore || 100}
                />
              </TabsContent>

              <TabsContent value="graded" className="mt-0">
                <StudentList
                  students={studentsWithSubmissions}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  filter="graded"
                  maxScore={assessment.maxScore || 100}
                />
              </TabsContent>

              <TabsContent value="ungraded" className="mt-0">
                <StudentList
                  students={studentsWithSubmissions}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  filter="ungraded"
                  maxScore={assessment.maxScore || 100}
                />
              </TabsContent>
            </div>

            <div className="md:col-span-2">
              {selectedStudentId && (
                <EnhancedGradingInterface
                  assessmentId={assessment.id}
                  submissionId={studentsWithSubmissions.find(s => s.id === selectedStudentId)?.submission?.id || ''}
                  maxScore={assessment.maxScore || 100}
                  gradingMethod={gradingMethod as 'SCORE_BASED' | 'RUBRIC_BASED'}
                  rubric={assessment.bloomsRubric ? {
                    id: assessment.bloomsRubric.id,
                    criteria: (assessment.bloomsRubric.criteria || []).map((criterion: any) => ({
                      ...criterion,
                      performanceLevels: (criterion.criteriaLevels || []).map((cl: any) => ({
                        levelId: cl.performanceLevel.id,
                        score: cl.performanceLevel.score || 0,
                        description: cl.performanceLevel.description || '',
                        name: cl.performanceLevel.name || '',
                      }))
                    })),
                    performanceLevels: assessment.bloomsRubric.performanceLevels || [],
                  } : undefined}
                  bloomsDistribution={assessment.bloomsDistribution as Record<BloomsTaxonomyLevel, number>}
                  onGradeSubmit={handleEnhancedGrading}
                  readOnly={false}
                />
              )}
              {!selectedStudentId && (
                <div className="flex flex-col items-center justify-center h-full border rounded-md p-8">
                  <p className="text-gray-500 mb-4">
                    Select a student from the list to grade their submission
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}
