"use client";

import { useState, useEffect } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/feedback/toast";
// Import AttendanceStatusType from constants instead of Prisma
import { AttendanceStatusType } from "@/server/api/constants";

interface Student {
  id: string;
  name: string;
  // Removed email as it's not needed
}

interface AttendanceRecorderProps {
  classId: string;
  students: Student[];
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatusType;
  remarks?: string;
}

export default function AttendanceRecorder({
  classId,
  students,
}: AttendanceRecorderProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, { status: AttendanceStatusType; remarks?: string }>
  >(() => {
    // Initialize with all students present
    const initialRecords: Record<
      string,
      { status: AttendanceStatusType; remarks?: string }
    > = {};
    students.forEach((student) => {
      initialRecords[student.id] = { status: "PRESENT" as AttendanceStatusType };
    });
    return initialRecords;
  });

  const { toast } = useToast();

  // Hide success message after 5 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const recordAttendanceMutation = api.attendance.bulkCreate.useMutation({
    onSuccess: () => {
      // Show toast notification
      toast({
        title: "Attendance recorded",
        description: "Attendance has been successfully recorded.",
      });

      // Show success message in the UI
      setShowSuccessMessage(true);

      // Scroll to top to show the success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance. Please try again.",
        variant: "error",
      });
    },
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNotesChange = (studentId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  const handleSubmit = async () => {
    const records = Object.entries(attendanceRecords).map(
      ([studentId, record]) => ({
        studentId,
        status: record.status,
        remarks: record.remarks,
      })
    );

    try {
      await recordAttendanceMutation.mutateAsync({
        classId,
        date,
        attendanceRecords: records,
      });
    } catch (error) {
      console.error("Error recording attendance:", error);
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      {showSuccessMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded-md mb-4 animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Attendance records saved successfully!
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                {students.length} student records have been updated for {date.toLocaleDateString()}.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setShowSuccessMessage(false)}
                  className="inline-flex bg-green-50 dark:bg-green-900/30 rounded-md p-1.5 text-green-500 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-green-900"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-foreground mb-1">
            Attendance Date
          </label>
          <DatePicker
            value={date}
            onChange={handleDateChange}
            className="w-full sm:w-auto"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={recordAttendanceMutation.isLoading}
          className="w-full sm:w-auto mt-4 sm:mt-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
        >
          {recordAttendanceMutation.isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Recording...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Record Attendance
            </span>
          )}
        </button>
      </div>

      {/* Mobile view - card-based layout */}
      <div className="block sm:hidden space-y-4">
        {students.map((student) => (
          <div key={student.id} className="bg-card rounded-lg shadow p-4 border border-border">
            <div className="font-medium text-card-foreground mb-3">{student.name}</div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                <select
                  value={attendanceRecords[student.id]?.status || "PRESENT"}
                  onChange={(e) =>
                    handleStatusChange(
                      student.id,
                      e.target.value as AttendanceStatusType
                    )
                  }
                  className="block w-full pl-3 pr-10 py-2 text-foreground bg-background border-input focus:outline-none focus:ring-ring focus:border-ring text-sm rounded-md"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                <input
                  type="text"
                  value={attendanceRecords[student.id]?.remarks || ""}
                  onChange={(e) =>
                    handleNotesChange(student.id, e.target.value)
                  }
                  placeholder="Add notes..."
                  className="block w-full bg-background border-input focus:ring-ring focus:border-ring text-sm rounded-md text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - table layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-card-foreground">
                    {student.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={attendanceRecords[student.id]?.status || "PRESENT"}
                    onChange={(e) =>
                      handleStatusChange(
                        student.id,
                        e.target.value as AttendanceStatusType
                      )
                    }
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-foreground bg-background border-input focus:outline-none focus:ring-ring focus:border-ring sm:text-sm rounded-md"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={attendanceRecords[student.id]?.remarks || ""}
                    onChange={(e) =>
                      handleNotesChange(student.id, e.target.value)
                    }
                    placeholder="Add notes..."
                    className="mt-1 block w-full bg-background border-input focus:ring-ring focus:border-ring sm:text-sm rounded-md text-foreground placeholder:text-muted-foreground"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fixed bottom save button - visible on both mobile and desktop */}
      <div className="mt-8 sticky bottom-4 z-10">
        <div className="bg-card p-4 rounded-lg shadow-lg border-2 border-primary/20 max-w-md mx-auto">
          <div className="text-center mb-2">
            <h3 className="text-sm font-medium text-card-foreground">Ready to save?</h3>
            <p className="text-xs text-muted-foreground">Click the button below to record attendance for all students</p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={recordAttendanceMutation.isLoading}
            className="w-full px-6 py-3 bg-primary text-primary-foreground text-lg font-medium rounded-lg shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {recordAttendanceMutation.isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Recording Attendance...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Attendance Records
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
