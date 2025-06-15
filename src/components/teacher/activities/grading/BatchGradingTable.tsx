"use client";

import { useState, useEffect, memo } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/atoms/badge";
import { SubmissionStatus } from "@/server/api/constants";
import { StudentWithSubmission } from "./StudentList";
import { Checkbox } from "@/components/ui/forms/checkbox";
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

    // Update selectAll state based on all students being selected
    const updatedGrades = studentGrades.map(grade =>
      grade.studentId === studentId ? { ...grade, selected: !grade.selected } : grade
    );

    setSelectAll(updatedGrades.every(grade => grade.selected));
  };

  // Handle score change for a student
  const handleScoreChange = (studentId: string, score: string) => {
    const numericScore = score === "" ? null : parseFloat(score);
    setStudentGrades((prev) =>
      prev.map((grade) =>
        grade.studentId === studentId
          ? { ...grade, score: numericScore }
          : grade
      )
    );
  };

  // Handle feedback change for a student
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
    const selectedGrades = studentGrades
      .filter((grade) => grade.selected && grade.score !== null)
      .map((grade) => ({
        studentId: grade.studentId,
        score: grade.score as number,
        feedback: grade.feedback || undefined,
      }));

    if (selectedGrades.length > 0) {
      onSave(selectedGrades);
    }
  };

  // Count selected students
  const selectedCount = studentGrades.filter((grade) => grade.selected).length;

  return (
    <div className="space-y-4">

      <div className="border rounded-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Student Grades</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectAll(true);
                setStudentGrades(prev => prev.map(grade => ({ ...grade, selected: true })));
              }}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectAll(false);
                setStudentGrades(prev => prev.map(grade => ({ ...grade, selected: false })));
              }}
            >
              Clear
            </Button>
          </div>
        </div>

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
                <TableHead>Learning Time</TableHead>
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
                      {student.submission?.timeSpentMinutes ? (
                        <span className="text-sm text-blue-600">
                          {student.submission.timeSpentMinutes > 60
                            ? `${Math.floor(student.submission.timeSpentMinutes / 60)}h ${student.submission.timeSpentMinutes % 60}m`
                            : `${student.submission.timeSpentMinutes}m`}
                        </span>
                      ) : student.submission?.content?.timeSpent ? (
                        <span className="text-sm text-blue-600">
                          {student.submission.content.timeSpent > 60
                            ? `${Math.floor(student.submission.content.timeSpent / 60)}h ${student.submission.content.timeSpent % 60}m`
                            : `${student.submission.content.timeSpent}m`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">No data</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={maxScore}
                        value={grade.score === null ? "" : String(grade.score)}
                        onChange={(e) => handleScoreChange(grade.studentId, e.target.value)}
                        className="w-20"
                        disabled={!grade.selected}
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={grade.feedback}
                        onChange={(e) => handleFeedbackChange(grade.studentId, e.target.value)}
                        className="h-20 min-h-0"
                        disabled={!grade.selected}
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
