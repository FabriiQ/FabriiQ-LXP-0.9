'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parse } from 'date-fns';
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

export default function EditAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const dateParam = params?.date as string;
  
  // Parse the date from URL parameter
  const [date, setDate] = useState<Date>(() => {
    try {
      if (dateParam) {
        return new Date(dateParam);
      }
      return new Date();
    } catch (error) {
      console.error('Error parsing date:', error);
      return new Date();
    }
  });
  
  const [title, setTitle] = useState(`Attendance - ${format(date, 'MMMM d, yyyy')}`);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<{
    studentId: string;
    studentName: string;
    enrollmentNumber: string;
    status: AttendanceStatusType;
    notes: string;
    id?: string; // Optional ID for existing records
  }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch class data with correct parameter name
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery({
    classId
  }, { enabled: !!classId });
  
  // Fetch enrolled students to ensure we have all students
  const { data: enrolledStudents, isLoading: isLoadingStudents } =
    api.student.getClassEnrollments.useQuery({
      classId
    }, { enabled: !!classId });
    
  // Fetch existing attendance records for this date and class
  const { data: existingAttendance, isLoading: isLoadingAttendance } = 
    api.attendance.getByQuery.useQuery(
      {
        classId,
        date: date,
      }, 
      { enabled: !!classId && !!date }
    );
  
  // Get the attendance hook for updating records
  const { bulkUpdateAttendance } = useAttendance();
  
  // Initialize attendance records when data is loaded
  useEffect(() => {
    if (enrolledStudents && existingAttendance) {
      setIsLoading(false);
      
      // Create a map of existing attendance records for quick lookup
      const attendanceMap = new Map();
      
      // Check if existingAttendance has the expected structure
      if (existingAttendance.attendanceRecords && Array.isArray(existingAttendance.attendanceRecords)) {
        existingAttendance.attendanceRecords.forEach((record: any) => {
          attendanceMap.set(record.studentId, {
            id: record.id,
            status: record.status,
            notes: record.remarks || ''
          });
        });
      }
      
      // Initialize attendance records with existing data or defaults
      const initialRecords = enrolledStudents.map((enrollment: EnrollmentWithStudent) => {
        const existing = attendanceMap.get(enrollment.studentId);
        
        return {
          studentId: enrollment.studentId,
          studentName: enrollment.student?.user?.name || 'Unknown',
          enrollmentNumber: enrollment.student?.enrollmentNumber || '',
          status: existing ? existing.status : AttendanceStatusType.PRESENT,
          notes: existing ? existing.notes : '',
          id: existing ? existing.id : undefined
        };
      });
      
      setAttendanceRecords(initialRecords);
      
      // Set title if we have a remark from an existing record
      if (existingAttendance.attendanceRecords && 
          existingAttendance.attendanceRecords.length > 0 && 
          existingAttendance.attendanceRecords[0].remarks) {
        setTitle(existingAttendance.attendanceRecords[0].remarks);
      }
    }
  }, [enrolledStudents, existingAttendance]);
  
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
      
      await bulkUpdateAttendance({
        classId,
        date,
        records: attendanceRecords.map(record => ({
          studentId: record.studentId,
          status: record.status,
          remarks: record.notes,
          id: record.id // Include ID for existing records
        })),
      });
      
      toast({
        title: 'Success',
        description: 'Attendance has been updated successfully',
        variant: 'success',
      });
      
      // Navigate back to attendance page
      router.push(`/admin/campus/classes/${classId}/attendance`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to update attendance',
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
  
  if (isLoadingClass || isLoadingStudents || isLoadingAttendance || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <PageLayout
      title={`Edit Attendance: ${classData?.name || ''}`}
      description="Edit attendance records for students in this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Attendance', href: `/admin/campus/classes/${classId}/attendance` },
        { label: 'Edit Attendance', href: '#' },
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
            Update Attendance
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
                      onSelect={(newDate) => {
                        if (newDate) {
                          setDate(newDate);
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Students ({attendanceRecords.length})</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={markAllPresent}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Present
            </Button>
            <Button size="sm" variant="outline" onClick={markAllAbsent}>
              <XCircle className="h-4 w-4 mr-2" />
              Mark All Absent
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <div key={record.studentId} className="p-4 border rounded-md">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{record.studentName}</h3>
                      <p className="text-sm text-muted-foreground">ID: {record.enrollmentNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={record.status === AttendanceStatusType.PRESENT ? 'default' : 'outline'}
                        className={record.status === AttendanceStatusType.PRESENT ? 'bg-green-500 hover:bg-green-600' : ''}
                        onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.PRESENT)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant={record.status === AttendanceStatusType.ABSENT ? 'default' : 'outline'}
                        className={record.status === AttendanceStatusType.ABSENT ? 'bg-red-500 hover:bg-red-600' : ''}
                        onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.ABSENT)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant={record.status === AttendanceStatusType.EXCUSED ? 'default' : 'outline'}
                        className={record.status === AttendanceStatusType.EXCUSED ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                        onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.EXCUSED)}
                      >
                        Excused
                      </Button>
                      <Button
                        size="sm"
                        variant={record.status === AttendanceStatusType.LATE ? 'default' : 'outline'}
                        className={record.status === AttendanceStatusType.LATE ? 'bg-blue-500 hover:bg-blue-600' : ''}
                        onClick={() => updateStudentStatus(record.studentId, AttendanceStatusType.LATE)}
                      >
                        Late
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="text-sm font-medium mb-1 block">Notes</label>
                    <Textarea
                      placeholder="Add notes about this student's attendance"
                      value={record.notes}
                      onChange={(e) => updateStudentNotes(record.studentId, e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No enrolled students found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
} 