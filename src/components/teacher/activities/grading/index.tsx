"use client";

import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { ActivityGradingHeader } from "./ActivityGradingHeader";
import { StudentList, StudentWithSubmission } from "./StudentList";
import { GradingForm, GradingFormValues } from "./GradingForm";
import { BatchGradingTable } from "./BatchGradingTable";
import { SubmissionStatus } from "@/server/api/constants";

// Define the props for the component
interface ActivityGradingProps {
  activityId: string;
  classId: string;
  maxScore?: number;
  isClassTeacher: boolean;
}

export default function ActivityGrading({
  activityId,
  classId,
  maxScore = 100,
  isClassTeacher,
}: ActivityGradingProps) {
  const { toast } = useToast();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [batchGrading, setBatchGrading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch activity data using the API
  const { data: activity, isLoading: isLoadingActivity } = api.activity.getById.useQuery(
    { id: activityId },
    {
      enabled: !!activityId,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to load activity: ${error.message}`,
          variant: "error",
        });
      },
    }
  );

  // Fetch activity grades using the API
  const {
    data: submissions,
    isLoading: isLoadingSubmissions,
    refetch: refetchSubmissions
  } = api.activityGrade.getByActivity.useQuery(
    { activityId },
    {
      enabled: !!activityId,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to load submissions: ${error.message}`,
          variant: "error",
        });
      },
    }
  );

  // Fetch class students using the API
  const { data: classStudents, isLoading: isLoadingStudents } = api.student.getStudentEnrollments.useQuery(
    { classId },
    {
      enabled: !!classId,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to load students: ${error.message}`,
          variant: "error",
        });
      },
    }
  );

  // Create grade mutation
  const createGradeMutation = api.activityGrade.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade saved successfully",
        variant: "success",
      });
      refetchSubmissions();
      setSelectedStudentId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save grade: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Update grade mutation
  const updateGradeMutation = api.activityGrade.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grade updated successfully",
        variant: "success",
      });
      refetchSubmissions();
      setSelectedStudentId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save grade: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Bulk save grades mutation
  const bulkSaveGradesMutation = api.class.bulkSaveActivityGrades.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Grades saved successfully",
        variant: "success",
      });
      refetchSubmissions();
      setBatchGrading(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save grades: ${error.message}`,
        variant: "error",
      });
    },
  });

  // Handle student selection for grading
  const handleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudentId(studentId);
  }, []);

  // Handle form submission for individual grading
  const handleSubmitGrade = useCallback((data: GradingFormValues) => {
    if (!selectedStudentId) return;

    const existingSubmission = submissions?.find(
      (submission) => submission.studentId === selectedStudentId
    );

    // Use the appropriate mutation based on whether a submission already exists
    if (existingSubmission) {
      updateGradeMutation.mutate({
        activityId,
        studentId: selectedStudentId,
        score: data.score,
        feedback: data.feedback,
        status: "GRADED" as SubmissionStatus,
      });
    } else {
      createGradeMutation.mutate({
        activityId,
        studentId: selectedStudentId,
        score: data.score,
        feedback: data.feedback,
        status: "GRADED" as SubmissionStatus,
      });
    }
  }, [selectedStudentId, submissions, updateGradeMutation, createGradeMutation, activityId]);

  // Handle batch grading submission
  const handleBulkSaveGrades = useCallback((grades: Array<{ studentId: string; score: number; feedback?: string }>) => {
    if (grades.length === 0) {
      toast({
        title: "Warning",
        description: "Please select students and provide scores",
        variant: "warning",
      });
      return;
    }

    bulkSaveGradesMutation.mutate({
      activityId,
      grades,
    });
  }, [activityId, bulkSaveGradesMutation, toast]);

  // Toggle batch grading mode
  const toggleBatchGrading = useCallback(() => {
    setBatchGrading((prev) => !prev);
    setSelectedStudentId(null);
  }, []);

  // Prepare student list with submission status
  const studentsWithSubmissions: StudentWithSubmission[] = useMemo(() => {
    if (!classStudents) return [];

    return classStudents.map((student: any) => {
      const submission = submissions?.find((sub) => sub.studentId === student.studentId);
      return {
        id: student.studentId,
        name: student.student.user.name || "Unnamed Student",
        email: student.student.user.email,
        submission,
      };
    });
  }, [classStudents, submissions]);

  // Get default values for the grading form
  const gradingFormDefaultValues = useMemo(() => {
    if (!selectedStudentId) return { score: 0, feedback: "" };

    const existingSubmission = submissions?.find(
      (submission) => submission.studentId === selectedStudentId
    );

    if (existingSubmission) {
      return {
        score: existingSubmission.score || 0,
        feedback: existingSubmission.feedback || "",
      };
    }

    return { score: 0, feedback: "" };
  }, [selectedStudentId, submissions]);

  // Loading state
  if (isLoadingActivity || isLoadingSubmissions || isLoadingStudents) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No activity found
  if (!activity) {
    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ActivityGradingHeader
            title="Activity Not Found"
            description="The requested activity could not be found."
            maxScore={maxScore}
            submissionCount={0}
            totalStudents={0}
            isBatchGrading={false}
            isClassTeacher={isClassTeacher}
            onToggleBatchGrading={() => {
              toast({
                title: "Error",
                description: "Activity not found.",
                variant: "error",
              });
            }}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </Tabs>
      </div>
    );
  }

  // Check if activity is gradable and requires manual grading
  const requiresManualGrading = activity.content?.requiresTeacherReview === true ||
    (activity.content?.hasSubmission === true && activity.content?.hasRealTimeComponents !== true);

  // Activity is not gradable or doesn't require manual grading
  if (!activity.isGradable || !requiresManualGrading) {
    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ActivityGradingHeader
            title={activity.title}
            description={!activity.isGradable
              ? "This activity is not set up for grading."
              : "This activity uses automatic grading and doesn't require manual review."}
            maxScore={activity.maxScore || maxScore}
            submissionCount={0}
            totalStudents={studentsWithSubmissions.length}
            isBatchGrading={false}
            isClassTeacher={isClassTeacher}
            onToggleBatchGrading={() => {
              toast({
                title: "Warning",
                description: !activity.isGradable
                  ? "This activity is not set up for grading."
                  : "This activity uses automatic grading and doesn't require manual review.",
                variant: "warning",
              });
            }}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </Tabs>
      </div>
    );
  }

  // Count graded submissions
  const gradedSubmissionsCount = submissions?.filter(
    (s) => s?.status === SubmissionStatus.GRADED
  ).length || 0;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ActivityGradingHeader
          title={activity.title}
          description={`Grade student submissions for ${activity.title}`}
          maxScore={activity.maxScore || maxScore}
          submissionCount={gradedSubmissionsCount}
          totalStudents={studentsWithSubmissions.length}
          isBatchGrading={batchGrading}
          isClassTeacher={isClassTeacher}
          onToggleBatchGrading={toggleBatchGrading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {batchGrading ? (
          <BatchGradingTable
            students={studentsWithSubmissions}
            maxScore={activity.maxScore || maxScore}
            onSave={handleBulkSaveGrades}
            isSaving={bulkSaveGradesMutation.isLoading}
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
                  maxScore={activity.maxScore || maxScore}
                />
              </TabsContent>

              <TabsContent value="graded" className="mt-0">
                <StudentList
                  students={studentsWithSubmissions}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  filter="graded"
                  maxScore={activity.maxScore || maxScore}
                />
              </TabsContent>

              <TabsContent value="ungraded" className="mt-0">
                <StudentList
                  students={studentsWithSubmissions}
                  selectedStudentId={selectedStudentId}
                  onSelectStudent={handleSelectStudent}
                  filter="ungraded"
                  maxScore={activity.maxScore || maxScore}
                />
              </TabsContent>
            </div>

          <div className="md:col-span-2">
            <GradingForm
              selectedStudentId={selectedStudentId}
              students={studentsWithSubmissions}
              maxScore={activity.maxScore || maxScore}
              onSubmit={handleSubmitGrade}
              onCancel={() => setSelectedStudentId(null)}
              isSubmitting={createGradeMutation.isLoading || updateGradeMutation.isLoading}
              defaultValues={gradingFormDefaultValues}
            />
          </div>
        </div>
      )}
      </Tabs>
    </div>
  );
}
