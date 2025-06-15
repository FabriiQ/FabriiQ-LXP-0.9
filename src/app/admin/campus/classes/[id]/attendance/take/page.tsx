'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, CheckCircle, Save, XCircle, Loader2 } from 'lucide-react';
import { api } from "@/trpc/react";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from '@/components/ui/feedback/toast';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { AttendanceStatusType } from '@/server/api/constants';
import { Textarea } from '@/components/ui/textarea';

interface EnrollmentWithStudent {
  id: string;
  studentId: string;
  student?: {
    id: string;
    enrollmentNumber: string;
    user?: {
      id: string;
      name: string | null;
    };
  };
}

export default function TakeAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  
  const [title, setTitle] = useState(`Attendance - ${format(new Date(), 'MMMM d, yyyy')}`);
  const [date, setDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<{
    studentId: string;
    studentName: string;
    enrollmentNumber: string;
    status: AttendanceStatusType;
    notes: string;
  }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch class data with correct parameter name
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery({
    classId
  }, { enabled: !!classId });
  
  // Fetch enrolled students with the correct endpoint
  const { data: enrolledStudents, isLoading: isLoadingStudents } = 
    api.student.getStudentEnrollments.useQuery({
      classId
    }, { enabled: !!classId });
  
  // Get the attendance hook for creating records
  const { bulkCreateAttendance } = useAttendance();
  
  // Initialize attendance records when students are loaded
  useEffect(() => {
    if (enrolledStudents && enrolledStudents.length > 0) {
      const initialRecords = enrolledStudents.map((enrollment: EnrollmentWithStudent) => ({
        studentId: enrollment.studentId,
        studentName: enrollment.student?.user?.name || 'Unknown',
        enrollmentNumber: enrollment.student?.enrollmentNumber || '',
        status: AttendanceStatusType.PRESENT,
        notes: '',
      }));
      
      setAttendanceRecords(initialRecords);
    }
  }, [enrolledStudents]);
  
  // Update status for a specific student
  const updateStudentStatus = (studentId: string, status: AttendanceStatusType) => {
    setAttendanceRecords(current =>
      current.map(record =>
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };
  
  // Update notes for a specific student
  const updateStudentNotes = (studentId: string, notes: string) => {
    setAttendanceRecords(current =>
      current.map(record =>
        record.studentId === studentId ? { ...record, notes } : record
      )
    );
  };
  
  // Mark all students as present
  const markAllPresent = () => {
    setAttendanceRecords(current =>
      current.map(record => ({ ...record, status: AttendanceStatusType.PRESENT }))
    );
  };
  
  // Mark all students as absent
  const markAllAbsent = () => {
    setAttendanceRecords(current =>
      current.map(record => ({ ...record, status: AttendanceStatusType.ABSENT }))
    );
  };
  
  // Submit attendance records
  const handleSubmit = async () => {
    if (attendanceRecords.length === 0) {
      toast({
        title: 'Error',
        description: 'No students to record attendance for',
        variant: 'error',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await bulkCreateAttendance({
        classId,
        date,
        records: attendanceRecords.map(record => ({
          studentId: record.studentId,
          status: record.status,
          remarks: record.notes,
        })),
      });
      
      toast({
        title: 'Success',
        description: 'Attendance has been recorded successfully',
        variant: 'success',
      });
      
      // Navigate back to attendance page
      router.push(`/admin/campus/classes/${classId}/attendance`);
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to record attendance',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'ABSENT':
        return 'destructive';
      case 'EXCUSED':
        return 'warning';
      case 'LATE':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  if (isLoadingClass || isLoadingStudents) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <PageLayout
      title={`Take Attendance: ${classData?.name || ''}`}
      description="Record attendance for students in this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Attendance', href: `/admin/campus/classes/${classId}/attendance` },
        { label: 'Take Attendance', href: '#' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${classId}/attendance`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Attendance
          </Button>
        </div>
      }
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Attendance Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Attendance title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <div className="flex gap-2">
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="h-4 w-4 mr-2" />
                      {date ? format(date, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={(date) => {
                        if (date) {
                          setDate(date);
                          setIsDatePickerOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Student Attendance ({attendanceRecords.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={markAllPresent}>
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={markAllAbsent}>
                <XCircle className="h-4 w-4 mr-1 text-red-500" />
                Mark All Absent
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium">Student</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.studentId} className="border-t">
                      <td className="py-3 px-4">
                        <div className="font-medium">{record.studentName}</div>
                        <div className="text-xs text-muted-foreground">{record.enrollmentNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              record.status === AttendanceStatusType.PRESENT 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}
                            onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.PRESENT)}
                          >
                            Present
                          </button>
                          <button
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              record.status === AttendanceStatusType.ABSENT 
                                ? 'bg-red-100 text-red-800 border border-red-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}
                            onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.ABSENT)}
                          >
                            Absent
                          </button>
                          <button
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              record.status === AttendanceStatusType.EXCUSED 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}
                            onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.EXCUSED)}
                          >
                            Excused
                          </button>
                          <button
                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                              record.status === AttendanceStatusType.LATE 
                                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}
                            onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.LATE)}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Textarea
                          placeholder="Add notes (optional)"
                          value={record.notes}
                          onChange={(e) => updateStudentNotes(record.studentId, e.target.value)}
                          className="min-h-[60px] resize-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No students enrolled in this class.</p>
              <Button asChild>
                <Link href={`/admin/campus/classes/${classId}/enroll-students`}>
                  Enroll Students
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
} 