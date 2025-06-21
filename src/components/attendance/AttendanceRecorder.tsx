"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Calendar, Search, Save, Check, X, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AttendanceStatus } from "@/types/attendance";
import { useAttendance } from "@/hooks/useAttendance";

interface AttendanceRecorderProps {
  defaultClassId?: string;
  defaultDate?: Date;
  className?: string;
  campusId: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
}

interface AttendanceRecord {
  id?: string;
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
  date?: Date;
}

export function AttendanceRecorder({
  defaultClassId,
  defaultDate = new Date(),
  className = "",
  campusId,
}: AttendanceRecorderProps) {
  const [classId, setClassId] = useState(defaultClassId || "");
  const [date, setDate] = useState(defaultDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize attendance records state
  const [attendanceRecords, setAttendanceRecords] = useState<{
    [studentId: string]: {
      status: AttendanceStatus;
      remarks: string;
      id?: string;
    };
  }>({});

  // Get attendance hook functions
  const { 
    createAttendance, 
    bulkCreateAttendance, 
    updateAttendance, 
    deleteAttendance 
  } = useAttendance();

  // Fetch classes for the dropdown
  const { data: classes, isLoading: isLoadingClasses } = api.class.list.useQuery({
    take: 100,
    status: "ACTIVE",
  });

  // Fetch students in the class
  const { data: students, isLoading: isLoadingStudents } = api.student.getClassEnrollments.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Fetch existing attendance records for the selected class and date
  const { data: existingRecords, isLoading: isLoadingRecords } = api.attendance.getRecords.useQuery(
    {
      classId,
      date,
    },
    { enabled: !!classId }
  );

  // Initialize attendance records with existing data
  useEffect(() => {
    if (existingRecords && existingRecords.length > 0) {
      const recordsMap: {
        [studentId: string]: {
          status: AttendanceStatus;
          remarks: string;
          id?: string;
        };
      } = {};
      
      existingRecords.forEach((record: AttendanceRecord) => {
        if (record.studentId) {
          recordsMap[record.studentId] = {
            status: record.status as AttendanceStatus,
            remarks: record.remarks || "",
            id: record.id,
          };
        }
      });
      
      setAttendanceRecords(recordsMap);
    } else {
      // Reset attendance records when class or date changes
      setAttendanceRecords({});
    }
  }, [existingRecords, classId, date]);

  // Filter students based on search term
  const filteredStudents = students?.filter((student: Student) => {
    if (!searchTerm) return true;
    return student.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle status change for a student
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  // Handle remarks change for a student
  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  // Set status for all students
  const setAllStatus = (status: AttendanceStatus) => {
    if (!students) return;
    
    const newRecords: {
      [studentId: string]: {
        status: AttendanceStatus;
        remarks: string;
        id?: string;
      };
    } = {};
    
    students.forEach((student: Student) => {
      newRecords[student.id] = {
        status,
        remarks: attendanceRecords[student.id]?.remarks || "",
        id: attendanceRecords[student.id]?.id,
      };
    });
    
    setAttendanceRecords(newRecords);
  };

  // Submit attendance records
  const handleSubmit = async () => {
    if (!classId) {
      toast.error("Please select a class");
      return;
    }

    if (!students || students.length === 0) {
      toast.error("No students found in this class");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare records for bulk submission
      const records = Object.entries(attendanceRecords).map(([studentId, record]) => ({
        studentId,
        status: record.status,
        remarks: record.remarks,
      }));

      // Submit attendance records in bulk
      await bulkCreateAttendance({
        classId,
        date,
        records,
      });

      toast.success("Attendance records saved successfully");
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to save attendance records");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Recorder</h2>
          <p className="text-muted-foreground">
            Record and manage student attendance
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <Select
            value={classId}
            onValueChange={(value: string) => setClassId(value)}
            disabled={isLoadingClasses}
          >
            <SelectTrigger id="class-recorder" className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingClasses ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading classes...</span>
                </div>
              ) : (
                classes?.items?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(date, "MMMM d, yyyy")}</span>
          </div>
        </div>
      </div>
      
      {!classId ? (
        <div className="flex h-[400px] items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-medium">Select a class to record attendance</h3>
            <p className="text-sm text-muted-foreground">
              Choose a class from the dropdown above to get started
            </p>
          </div>
        </div>
      ) : isLoadingStudents || isLoadingRecords ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading students...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                <CardTitle>Student Attendance</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllStatus("PRESENT")}
                  >
                    <Check className="mr-1 h-4 w-4 text-green-500" />
                    Mark All Present
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllStatus("ABSENT")}
                  >
                    <X className="mr-1 h-4 w-4 text-red-500" />
                    Mark All Absent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAllStatus("LATE")}
                  >
                    <Clock className="mr-1 h-4 w-4 text-amber-500" />
                    Mark All Late
                  </Button>
                </div>
              </div>
              <CardDescription>
                Record attendance for {format(date, "MMMM d, yyyy")}
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {!filteredStudents || filteredStudents.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">No students found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm
                        ? "Try adjusting your search term"
                        : "There are no students in this class"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student: Student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={attendanceRecords[student.id]?.status || "PRESENT"}
                              onValueChange={(value) => 
                                handleStatusChange(student.id, value as AttendanceStatus)
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PRESENT">
                                  <div className="flex items-center">
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    Present
                                  </div>
                                </SelectItem>
                                <SelectItem value="ABSENT">
                                  <div className="flex items-center">
                                    <X className="mr-2 h-4 w-4 text-red-500" />
                                    Absent
                                  </div>
                                </SelectItem>
                                <SelectItem value="LATE">
                                  <div className="flex items-center">
                                    <Clock className="mr-2 h-4 w-4 text-amber-500" />
                                    Late
                                  </div>
                                </SelectItem>
                                <SelectItem value="EXCUSED">
                                  <div className="flex items-center">
                                    <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                                    Excused
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Textarea
                              placeholder="Add remarks (optional)"
                              className="min-h-[80px]"
                              value={attendanceRecords[student.id]?.remarks || ""}
                              onChange={(e) => 
                                handleRemarksChange(student.id, e.target.value)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !filteredStudents || filteredStudents.length === 0}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 