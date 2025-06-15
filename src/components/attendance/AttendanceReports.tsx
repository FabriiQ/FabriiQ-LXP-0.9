"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Calendar as CalendarIcon, Download, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
// Define AttendanceStatus type since it's not exported from @/types/attendance
type AttendanceStatusType = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

// For backward compatibility with our component
enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EXCUSED = "EXCUSED"
}

interface AttendanceReportsProps {
  defaultClassId?: string;
  className?: string;
  campusId: string;
}

// Define the structure of the student data returned by the API
interface EnrollmentStudent {
  student: {
    id: string;
    user: {
      name: string | null;
      email: string | null;
      id: string;
    };
  };
  id: string;
}

// Define a simpler Student interface for our component
// This is used for the students dropdown
interface Student {
  id: string;
  name: string;
  email?: string;
}

// Define the structure of the attendance record returned by the API
interface ApiAttendanceRecord {
  id: string;
  date: Date | string;
  status: AttendanceStatusType;
  remarks?: string;
  studentId: string;
  student?: {
    id: string;
    user?: {
      name: string | null;
    };
  };
  class?: {
    id: string;
    name: string;
  };
}

// Define a simpler AttendanceRecord interface for our component
interface AttendanceRecord {
  id: string;
  date: Date | string;
  status: AttendanceStatus;
  remarks?: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

export function AttendanceReports({
  defaultClassId,
  className = "",
  campusId,
}: AttendanceReportsProps) {
  const [classId, setClassId] = useState(defaultClassId || "all-classes");
  const [studentId, setStudentId] = useState("all-students");
  const [status, setStatus] = useState<string>("all-statuses");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch classes for the dropdown
  const { data: classes, isLoading: isLoadingClasses } = api.class.list.useQuery({
    take: 100,
    status: "ACTIVE",
  });

  // Fetch students in the class
  const { data: enrollments, isLoading: isLoadingStudents } = api.student.getStudentEnrollments.useQuery(
    { classId: classId !== 'all-classes' ? classId : '' },
    { enabled: classId !== 'all-classes' }
  );

  // Transform the enrollment data into a simpler Student format
  const students = enrollments?.map((enrollment: EnrollmentStudent) => ({
    id: enrollment.student.id,
    name: enrollment.student.user.name || 'Unknown',
    email: enrollment.student.user.email
  }));

  // Fetch attendance records based on filters
  const { data: attendanceRecords, isLoading: isLoadingRecords } = api.attendance.getByQuery.useQuery(
    {
      classId: classId !== 'all-classes' ? classId : '',
      studentId: studentId === 'all-students' ? undefined : studentId,
      // Cast to any to bypass type checking for the status
      status: status === 'all-statuses' ? undefined : status as any,
      startDate,
      endDate,
    },
    { enabled: classId !== 'all-classes' || !!defaultClassId }
  );

  // Filter records by search term
  const attendanceData = attendanceRecords?.attendanceRecords || [];

  // Transform API records to our component format
  const transformedRecords = attendanceData.map((record: any): AttendanceRecord => ({
    id: record.id,
    date: record.date,
    status: record.status as unknown as AttendanceStatus,
    remarks: record.remarks,
    studentId: record.studentId,
    student: {
      id: record.student?.id || '',
      name: record.student?.user?.name || 'Unknown'
    },
    class: record.class
  }));

  const filteredRecords = transformedRecords.filter((record: AttendanceRecord) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      record.student?.name?.toLowerCase().includes(searchLower) ||
      record.class?.name?.toLowerCase().includes(searchLower) ||
      record.remarks?.toLowerCase().includes(searchLower)
    );
  });

  // Export attendance records to CSV
  const exportToCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.error("No records to export");
      return;
    }

    setIsExporting(true);

    try {
      // Create CSV header
      const headers = [
        "Date",
        "Student Name",
        "Class",
        "Status",
        "Remarks",
      ];

      // Create CSV rows
      const rows = filteredRecords.map((record: AttendanceRecord) => [
        format(new Date(record.date), "yyyy-MM-dd"),
        record.student?.name || "Unknown",
        record.class?.name || "Unknown",
        record.status,
        record.remarks || "",
      ]);

      // Combine header and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.join(",")),
      ].join("\n");

      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `attendance_report_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Attendance Reports</h2>
          <p className="text-muted-foreground">
            Generate and export attendance reports
          </p>
        </div>

        <Button
          onClick={exportToCSV}
          disabled={isExporting || !filteredRecords || filteredRecords.length === 0}
          className="w-full md:w-auto"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export to CSV
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>
            Filter attendance records by class, student, date range, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="class-filter" className="text-sm font-medium">
                Class
              </label>
              <Select
                value={classId}
                onValueChange={(value: string) => setClassId(value)}
                disabled={isLoadingClasses}
              >
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-classes">All Classes</SelectItem>
                  {isLoadingClasses ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading classes...</span>
                    </div>
                  ) : (
                    classes?.items?.map((cls: { id: string; name: string }) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="student-filter" className="text-sm font-medium">
                Student
              </label>
              <Select
                value={studentId}
                onValueChange={(value: string) => setStudentId(value)}
                disabled={!classId || isLoadingStudents}
              >
                <SelectTrigger id="student-filter">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-students">All Students</SelectItem>
                  {isLoadingStudents ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading students...</span>
                    </div>
                  ) : (
                    students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status-filter" className="text-sm font-medium">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(value: string) => setStatus(value)}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-statuses">All Statuses</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                  <SelectItem value="EXCUSED">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, class, or remarks..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {filteredRecords?.length || 0} records found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading records...</span>
            </div>
          ) : filteredRecords?.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <Filter className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No records found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters to find what you're looking for
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{record.student?.name || "Unknown"}</TableCell>
                      <TableCell>{record.class?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            record.status === "PRESENT" && "bg-green-100 text-green-800",
                            record.status === "ABSENT" && "bg-red-100 text-red-800",
                            record.status === "LATE" && "bg-yellow-100 text-yellow-800",
                            record.status === "EXCUSED" && "bg-blue-100 text-blue-800"
                          )}
                        >
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.remarks || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}