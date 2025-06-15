"use client";

import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SubmissionStatus } from "@/server/api/constants";
import { StudentWithSubmission } from "./StudentList";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BatchGradingTableProps {
  students: StudentWithSubmission[];
  maxScore: number;
  onSave: (grades: Array<{ studentId: string; score: number; feedback?: string }>) => void;
  isSaving: boolean;
}

interface StudentGrade {
  studentId: string;
  selected: boolean;
  score: number | null;
  feedback: string;
}

function BatchGradingTableComponent({
  students,
  maxScore,
  onSave,
  isSaving,
}: BatchGradingTableProps) {
  // State for batch grading
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Initialize student grades
  useEffect(() => {
    setStudentGrades(
      students.map((student) => ({
        studentId: student.id,
        selected: true,
        score: student.submission?.score ?? null,
        feedback: student.submission?.feedback ?? "",
      }))
    );
  }, [students]);

  // Handle select all toggle
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setStudentGrades((prev) =>
      prev.map((grade) => ({
        ...grade,
        selected: newSelectAll,
      }))
    );
  };

  // Handle individual student selection
  const handleSelectStudent = (studentId: string) => {
    setStudentGrades((prev) =>
      prev.map((grade) =>
        grade.studentId === studentId
          ? { ...grade, selected: !grade.selected }
          : grade
      )
    );
  };

  // Handle score change
  const handleScoreChange = (studentId: string, score: string) => {
    setStudentGrades((prev) =>
      prev.map((grade) =>
        grade.studentId === studentId
          ? { ...grade, score: score === "" ? null : Number(score) }
          : grade
      )
    );
  };

  // Handle feedback change
  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setStudentGrades((prev) =>
      prev.map((grade) =>
        grade.studentId === studentId
          ? { ...grade, feedback }
          : grade
      )
    );
  };

  // Handle save
  const handleSave = () => {
    const gradesToSave = studentGrades
      .filter((grade) => grade.selected && grade.score !== null)
      .map((grade) => {
        // Find the student to check if they have a submission
        const student = students.find((s) => s.id === grade.studentId);

        return {
          studentId: grade.studentId,
          score: grade.score as number,
          feedback: grade.feedback,
          // Add a flag to indicate if this is a new submission
          hasSubmission: !!student?.submission
        };
      });

    onSave(gradesToSave);
  };

  // Count selected students
  const selectedCount = studentGrades.filter(
    (grade) => grade.selected && grade.score !== null
  ).length;

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all students"
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentGrades.map((grade) => {
                const student = students.find((s) => s.id === grade.studentId);
                if (!student) return null;

                return (
                  <TableRow key={grade.studentId}>
                    <TableCell>
                      <Checkbox
                        checked={grade.selected}
                        onCheckedChange={() => handleSelectStudent(grade.studentId)}
                        aria-label={`Select ${student.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={maxScore}
                        value={grade.score === null ? "" : grade.score}
                        onChange={(e) =>
                          handleScoreChange(grade.studentId, e.target.value)
                        }
                        disabled={!grade.selected}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={grade.feedback}
                        onChange={(e) =>
                          handleFeedbackChange(grade.studentId, e.target.value)
                        }
                        disabled={!grade.selected}
                        placeholder="Feedback"
                        className="h-10 min-h-0"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={
          studentGrades.filter((g) => g.selected && g.score !== null).length === 0 ||
          isSaving
        }
        className="w-full"
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          `Grade ${selectedCount} Students`
        )}
      </Button>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const BatchGradingTable = memo(BatchGradingTableComponent);
