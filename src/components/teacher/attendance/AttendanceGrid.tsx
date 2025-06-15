"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { format, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { Calendar, ChevronLeft, ChevronRight, Check, X, Clock, AlertCircle } from "lucide-react";
import { AttendanceStatusType as PrismaAttendanceStatusType } from "@prisma/client";
import { AttendanceStatusType } from "@/server/api/constants";
import type { StudentProfile, AttendanceRecord } from "@/types/attendance";

interface ClassQueryInput {
  classId: string;
  includeEnrollments?: boolean;
  include?: {
    students?: boolean;
    teachers?: boolean;
    [key: string]: boolean | undefined;
  };
}

interface AttendanceGridProps {
  classId: string;
}

export default function AttendanceGrid({ classId }: AttendanceGridProps) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get students in this class
  const { data: classData, isLoading: isLoadingStudents } = api.class.getById.useQuery({
    classId,
    includeEnrollments: true,
    include: {
      students: true
    }
  } as ClassQueryInput);

  // Transform the API response to match our StudentProfile interface
  const students: StudentProfile[] = classData?.students.map((enrollment: any) => ({
    id: enrollment.student.id,
    user: enrollment.student.user,
    enrollmentNumber: enrollment.student.enrollmentNumber,
    currentGrade: enrollment.student.currentGrade,
    attendanceRate: enrollment.student.attendanceRate
  })) || [];

  const { data: attendanceData, isLoading: isLoadingAttendance, refetch: refetchAttendance } =
    api.attendance.getByQuery.useQuery({
      classId,
      startDate: monthStart,
      endDate: monthEnd,
    });

  // Transform the Prisma attendance records to match our AttendanceRecord type
  const attendanceRecords: AttendanceRecord[] = (attendanceData?.attendanceRecords || []).map(record => ({
    id: record.id,
    studentId: record.studentId,
    date: new Date(record.date),
    status: record.status as AttendanceStatusType,
    remarks: record.remarks || undefined
  }));

  // Mark attendance mutation
  const markAttendanceMutation = api.attendance.create.useMutation({
    onSuccess: () => {
      void refetchAttendance();
      toast({
        title: "Success",
        description: "Student attendance has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "error",
      });
    },
  });

  if (isLoadingStudents || isLoadingAttendance) {
    return <AttendanceGridSkeleton />;
  }

  if (!students.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">No students found in this class.</p>
        </CardContent>
      </Card>
    );
  }

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const updateAttendanceStatus = (studentId: string, status: AttendanceStatusType) => {
    markAttendanceMutation.mutate({
      studentId,
      classId,
      date: selectedDate,
      status,
      remarks: "" // Change null to empty string
    });
  };

  const getAttendanceStatus = (studentId: string, date: Date): AttendanceStatusType | null => {
    const record = attendanceRecords.find(
      (record) => record.studentId === studentId && isSameDay(new Date(record.date), date)
    );
    return record?.status as AttendanceStatusType | null;
  };

  // Get status badge variant
  const getStatusVariant = (status: AttendanceStatusType | null): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case AttendanceStatusType.PRESENT:
        return "default";
      case AttendanceStatusType.LATE:
        return "secondary";
      case AttendanceStatusType.ABSENT:
        return "destructive";
      case AttendanceStatusType.EXCUSED:
        return "outline";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getStatusIcon = (status: AttendanceStatusType | null) => {
    switch (status) {
      case AttendanceStatusType.PRESENT:
        return <Check className="h-4 w-4" />;
      case AttendanceStatusType.ABSENT:
        return <X className="h-4 w-4" />;
      case AttendanceStatusType.LATE:
        return <Clock className="h-4 w-4" />;
      case AttendanceStatusType.EXCUSED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Calculate attendance rate for a student
  const calculateAttendanceRate = (studentId: string): number => {
    const studentRecords = attendanceRecords.filter(
      (record) => record.studentId === studentId
    );

    if (!studentRecords.length) return 0;

    const presentCount = studentRecords.filter(
      (record) => record.status === AttendanceStatusType.PRESENT ||
                  record.status === AttendanceStatusType.LATE
    ).length;

    return (presentCount / studentRecords.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Attendance Tracker</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <span className="sr-only">Previous month</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <span className="sr-only">Next month</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          Track and manage student attendance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            {/* Calendar header - days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the start of the month */}
              {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                <div key={`empty-start-${index}`} className="h-10 p-1" />
              ))}

              {/* Days of the month */}
              {daysInMonth.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                return (
                  <Button
                    key={day.toISOString()}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-10 w-full p-0 ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    {format(day, "d")}
                  </Button>
                );
              })}

              {/* Empty cells for days after the end of the month */}
              {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                <div key={`empty-end-${index}`} className="h-10 p-1" />
              ))}
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-3">
                Attendance for {format(selectedDate, "MMMM d, yyyy")}
              </h3>

              <div className="space-y-3">
                {students.map((student: StudentProfile) => {
                  const status = getAttendanceStatus(student.id, selectedDate);
                  return (
                    <div key={student.id} className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{student.user.name}</p>
                        <p className="text-sm text-gray-500">{student.user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={status === AttendanceStatusType.PRESENT ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateAttendanceStatus(student.id, AttendanceStatusType.PRESENT)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        <Button
                          variant={status === AttendanceStatusType.LATE ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => updateAttendanceStatus(student.id, AttendanceStatusType.LATE)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Late
                        </Button>
                        <Button
                          variant={status === AttendanceStatusType.ABSENT ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => updateAttendanceStatus(student.id, AttendanceStatusType.ABSENT)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                        <Button
                          variant={status === AttendanceStatusType.EXCUSED ? "outline" : "ghost"}
                          size="sm"
                          onClick={() => updateAttendanceStatus(student.id, AttendanceStatusType.EXCUSED)}
                        >
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Excused
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <div className="space-y-6">
              {students.map((student) => {
                const attendanceRate = calculateAttendanceRate(student.id);
                return (
                  <Card key={student.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{student.user.name}</CardTitle>
                          <CardDescription>{student.user.email}</CardDescription>
                        </div>
                        <Badge variant={attendanceRate >= 90 ? "default" : attendanceRate >= 75 ? "secondary" : "destructive"}>
                          {attendanceRate.toFixed(0)}% Attendance
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-1">
                        {daysInMonth.map((day) => {
                          const status = getAttendanceStatus(student.id, day);
                          return (
                            <div
                              key={day.toISOString()}
                              className={`h-8 flex items-center justify-center rounded-md ${
                                status ? `bg-${getStatusVariant(status)}-100` : "bg-gray-50"
                              }`}
                              title={`${format(day, "MMM d")} - ${status || "Not marked"}`}
                            >
                              {getStatusIcon(status) || format(day, "d")}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function AttendanceGridSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-6">
            {Array.from({ length: 28 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>

          <Skeleton className="h-6 w-48 mb-6" />

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex space-x-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-9 w-20 rounded-md" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
