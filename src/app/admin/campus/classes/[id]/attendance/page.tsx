'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Download, 
  Loader2, 
  Pencil, 
  Plus, 
  Search, 
  XCircle 
} from 'lucide-react';
import { api } from "@/trpc/react";
import { useAttendance } from "@/hooks/useAttendance";
import { useToast } from '@/components/ui/feedback/toast';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  name: string;
  enrollmentNumber: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  title: string;
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  totalStudents: number;
}

interface AttendanceDetail {
  studentId: string;
  studentName: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
  notes?: string;
}

export default function ClassAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [recordDetails, setRecordDetails] = useState<AttendanceDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Use the attendance and class hooks correctly
  const { getAttendanceRecords, getClassStats } = useAttendance();
  
  // Fetch class data using tRPC with correct parameter name
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery({
    classId
  }, { enabled: !!classId });
  
  // Get attendance records using the hook
  const { data: attendanceData, isLoading: isLoadingAttendance } = getAttendanceRecords(classId);

  // Query attendance details for selected date
  const { data: attendanceDetails } = api.attendance.getByQuery.useQuery(
    {
      classId,
      date: selectedDate ?? undefined,
    }, 
    { 
      enabled: !!selectedDate && !!classId,
    }
  );

  // Query student enrollments
  const { data: studentEnrollments } = api.student.getStudentEnrollments.useQuery({
    classId,
  }, { 
    enabled: !!classId && !!selectedDate,
  });
  
  // Transform attendance data into the required format
  const attendanceRecords: AttendanceRecord[] = [];
  
  // Process attendance data if available
  if (attendanceData?.attendanceRecords) {
    // Group by date to create attendance records
    const recordsByDate: Record<string, AttendanceRecord> = {};
    
    attendanceData.attendanceRecords.forEach(record => {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      
      if (!recordsByDate[dateStr]) {
        recordsByDate[dateStr] = {
          id: dateStr,
          date: new Date(record.date).toISOString(),
          title: record.remarks || format(new Date(record.date), 'MMMM d, yyyy'),
          totalPresent: 0,
          totalAbsent: 0,
          totalExcused: 0,
          totalStudents: 0,
        };
      }
      
      if (record.status === 'PRESENT') recordsByDate[dateStr].totalPresent++;
      else if (record.status === 'ABSENT') recordsByDate[dateStr].totalAbsent++;
      else if (record.status === 'EXCUSED') recordsByDate[dateStr].totalExcused++;
      
      recordsByDate[dateStr].totalStudents++;
    });
    
    // Convert to array
    Object.values(recordsByDate).forEach(record => {
      attendanceRecords.push(record);
    });
  }
  
  // Update selectedDate when selectedRecord changes
  useEffect(() => {
    if (selectedRecord) {
      setSelectedDate(new Date(selectedRecord));
    } else {
      setSelectedDate(null);
    }
  }, [selectedRecord]);
  
  // Process attendance details and enrollments when data is available
  useEffect(() => {
    if (!attendanceDetails || !studentEnrollments || !selectedDate) {
      setRecordDetails([]);
      return;
    }
    
    try {
      setIsLoadingDetails(true);
      
      // Combine the data to create attendance details
      const details: AttendanceDetail[] = [];
      
      // Create a map of student IDs to names
      const studentMap = new Map();
      studentEnrollments.forEach((enrollment: any) => {
        if (enrollment.student?.user?.name) {
          studentMap.set(enrollment.student.id, enrollment.student.user.name);
        }
      });
      
      // Check if attendanceDetails has the expected structure and access attendanceRecords
      if (attendanceDetails.attendanceRecords && Array.isArray(attendanceDetails.attendanceRecords)) {
        attendanceDetails.attendanceRecords.forEach((record: any) => {
          details.push({
            studentId: record.studentId,
            studentName: studentMap.get(record.studentId) || 'Unknown',
            status: record.status,
            notes: record.remarks,
          });
        });
      }
      
      setRecordDetails(details);
    } catch (error) {
      console.error('Error processing record details:', error);
      toast({
        title: 'Error',
        description: 'Failed to process attendance record details',
        variant: 'error',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  }, [attendanceDetails, studentEnrollments, selectedDate, toast]);
  
  // Export attendance record as CSV
  const handleExportAttendance = (recordId: string) => {
    // Create headers
    let csvContent = 'Student Name,Enrollment Number,Status,Notes\n';
    
    // Add student data
    recordDetails.forEach(detail => {
      csvContent += `${detail.studentName},${detail.studentId},${detail.status},${detail.notes || ''}\n`;
    });
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${recordId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter attendance records based on search query and active tab
  const filteredRecords = attendanceRecords.filter(record => {
    // Filter by search query
    if (searchQuery && 
        !record.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !format(new Date(record.date), 'PP').toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by active tab
    if (activeTab === 'all') return true;
    if (activeTab === 'thisMonth') {
      const recordDate = new Date(record.date);
      const today = new Date();
      return recordDate.getMonth() === today.getMonth() && 
             recordDate.getFullYear() === today.getFullYear();
    }
    if (activeTab === 'lastMonth') {
      const recordDate = new Date(record.date);
      const today = new Date();
      const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      return recordDate.getMonth() === lastMonth && 
             recordDate.getFullYear() === lastMonthYear;
    }
    return false;
  });
  
  // Get badge variant based on attendance status
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
  
  if (isLoadingClass || isLoadingAttendance) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <PageLayout
      title={`Attendance: ${classData?.name || ''}`}
      description="View and manage attendance records for this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Attendance', href: '#' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${classId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/campus/classes/${classId}/attendance/take`}>
              <Plus className="h-4 w-4 mr-2" />
              Take Attendance
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10"
              placeholder="Search records" 
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="thisMonth">This Month</TabsTrigger>
              <TabsTrigger value="lastMonth">Last Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRecords.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`p-3 rounded-md cursor-pointer border border-border hover:bg-muted/20 transition-colors ${
                        selectedRecord === record.id ? 'bg-muted/30 border-primary' : ''
                      }`}
                      onClick={() => setSelectedRecord(record.id)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{record.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="bg-primary/5">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          {record.totalPresent}
                        </Badge>
                        <Badge variant="outline" className="bg-destructive/5">
                          <XCircle className="h-3 w-3 mr-1 text-red-500" />
                          {record.totalAbsent}
                        </Badge>
                        <Badge variant="outline">
                          Total: {record.totalStudents}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-primary/10 rounded-full p-3 inline-block mb-3">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">
                    No attendance records found
                  </p>
                  <Button asChild size="sm">
                    <Link href={`/admin/campus/classes/${classId}/attendance/take`}>
                      Take Attendance
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Attendance Details</CardTitle>
              {selectedRecord && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleExportAttendance(selectedRecord)}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/campus/classes/${classId}/attendance/${selectedRecord}/edit`}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedRecord ? (
                isLoadingDetails ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  recordDetails.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border">
                        <thead>
                          <tr className="bg-muted/20">
                            <th className="py-2 px-4 text-left border-b">Student</th>
                            <th className="py-2 px-4 text-left border-b">Status</th>
                            <th className="py-2 px-4 text-left border-b">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recordDetails.map((detail) => (
                            <tr key={detail.studentId} className="hover:bg-muted/10">
                              <td className="py-3 px-4 border-b">
                                <div className="font-medium">{detail.studentName}</div>
                              </td>
                              <td className="py-3 px-4 border-b">
                                <Badge variant={getStatusBadgeVariant(detail.status)}>
                                  {detail.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 border-b">
                                {detail.notes || <span className="text-muted-foreground text-sm">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No details available for this record</p>
                    </div>
                  )
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Select an attendance record to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {selectedRecord && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center">
                    {recordDetails.filter(d => d.status === 'PRESENT').length}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({Math.round((recordDetails.filter(d => d.status === 'PRESENT').length / recordDetails.length) * 100)}%)
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center">
                    {recordDetails.filter(d => d.status === 'ABSENT').length}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({Math.round((recordDetails.filter(d => d.status === 'ABSENT').length / recordDetails.length) * 100)}%)
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Excused/Late</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center">
                    {recordDetails.filter(d => d.status === 'EXCUSED' || d.status === 'LATE').length}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({Math.round((recordDetails.filter(d => d.status === 'EXCUSED' || d.status === 'LATE').length / recordDetails.length) * 100)}%)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
} 
