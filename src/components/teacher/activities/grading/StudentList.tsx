"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/atoms/badge";
import { SubmissionStatus } from "@/server/api/constants";

export interface StudentWithSubmission {
  id: string;
  name: string;
  email: string;
  submission?: {
    id: string;
    score?: number;
    status: string;
    feedback?: string;
    content?: any;
    submittedAt?: string;
    gradedAt?: string;
    timeSpentMinutes?: number;
    learningStartedAt?: string;
    learningCompletedAt?: string;
  };
}

interface StudentListProps {
  students: StudentWithSubmission[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
  filter: "all" | "graded" | "ungraded";
  maxScore: number;
}

function StudentListComponent({
  students,
  selectedStudentId,
  onSelectStudent,
  filter,
  maxScore,
}: StudentListProps) {
  // Filter students based on the selected tab
  const filteredStudents = students.filter((student) => {
    if (filter === "all") return true;
    if (filter === "graded") return student.submission?.status === SubmissionStatus.GRADED;
    if (filter === "ungraded") return !student.submission || student.submission.status !== SubmissionStatus.GRADED;
    return true;
  });

  return (
    <div className="space-y-2 h-[500px] overflow-y-auto">
      {filteredStudents.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No students found
        </div>
      ) : (
        filteredStudents.map((student) => (
          <div
            key={student.id}
            className={`p-2 border rounded-md cursor-pointer ${
              selectedStudentId === student.id
                ? "border-primary bg-primary/10"
                : ""
            }`}
            onClick={() => onSelectStudent(student.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-xs text-gray-500">{student.email}</p>
              </div>
              {student.submission ? (
                <Badge
                  variant={
                    student.submission.status === SubmissionStatus.GRADED
                      ? "success"
                      : "secondary"
                  }
                >
                  {student.submission.status}
                </Badge>
              ) : (
                <Badge variant="outline">No Submission</Badge>
              )}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {student.submission?.score !== null && student.submission?.score !== undefined && (
                <p className="text-sm">
                  Score: {student.submission.score} / {maxScore}
                </p>
              )}

              {student.submission?.timeSpentMinutes && student.submission.timeSpentMinutes > 0 && (
                <p className="text-xs text-blue-600">
                  <span className="inline-block w-4 h-4 mr-1">⏱️</span>
                  Time spent: {student.submission.timeSpentMinutes > 60
                    ? `${Math.floor(student.submission.timeSpentMinutes / 60)}h ${student.submission.timeSpentMinutes % 60}m`
                    : `${student.submission.timeSpentMinutes}m`}
                </p>
              )}

              {!student.submission?.timeSpentMinutes && student.submission?.content?.timeSpent && (
                <p className="text-xs text-blue-600">
                  <span className="inline-block w-4 h-4 mr-1">⏱️</span>
                  Time spent: {student.submission.content.timeSpent > 60
                    ? `${Math.floor(student.submission.content.timeSpent / 60)}h ${student.submission.content.timeSpent % 60}m`
                    : `${student.submission.content.timeSpent}m`}
                </p>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const StudentList = memo(StudentListComponent);
