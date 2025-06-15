'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Loader2, Plus, Search, UserPlus, X } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from "@/trpc/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

// Define types for your data structures
interface Student {
  id: string;
  enrollmentNumber: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface Enrollment {
  id: string;
  student: Student;
  status: string;
  startDate: string | Date;
  classId: string;
}

export default function ClassStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmUnenrollStudentId, setConfirmUnenrollStudentId] = useState<string | null>(null);
  
  // Updated query to match your API structure
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery(
    { classId },
    { enabled: !!classId }
  );
  
  // Updated query name to match your API
  const { data: enrolledStudents, isLoading: isLoadingStudents, refetch: refetchStudents } = 
    api.student.getStudentEnrollments.useQuery(
      { classId },
      { enabled: !!classId }
    );
  
  // Updated mutation name to match your API
  const unenrollStudentMutation = api.enrollment.deleteEnrollment.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student has been unenrolled from the class',
        variant: 'success'
      });
      setConfirmUnenrollStudentId(null);
      refetchStudents();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unenroll student',
        variant: 'error'
      });
    },
  });
  
  const handleUnenrollStudent = async () => {
    if (!confirmUnenrollStudentId) return;
    
    try {
      await unenrollStudentMutation.mutateAsync({
        id: confirmUnenrollStudentId,
        updatedById: classId, // Use a valid current user ID
      });
    } catch (error: unknown) {
      console.error('Error unenrolling student:', error);
      toast({
        title: 'Error',
        description: 'Failed to unenroll student',
        variant: 'error'
      });
    }
  };
  
  const filteredStudents = enrolledStudents?.filter((enrollment: Enrollment) => {
    if (!searchQuery) return true;
    
    const student = enrollment.student;
    if (!student) return false;
    
    const studentName = student.user?.name?.toLowerCase() || '';
    const enrollmentNumber = student.enrollmentNumber?.toLowerCase() || '';
    
    return (
      studentName.includes(searchQuery.toLowerCase()) ||
      enrollmentNumber.includes(searchQuery.toLowerCase())
    );
  });
  
  if (isLoadingClass || isLoadingStudents) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading class details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }
  
  const handleExport = () => {
    const headers = ['Name', 'Enrollment No.', 'Status', 'Enrolled Date'];
    const rows = filteredStudents?.map((enrollment: Enrollment) => [
      enrollment.student?.user?.name || '',
      enrollment.student?.enrollmentNumber || '',
      enrollment.status || '',
      enrollment.startDate ? format(new Date(enrollment.startDate), 'yyyy-MM-dd') : '',
    ]) || [];
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach((row: string[]) => {
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Students_${classData?.code || classId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageLayout
      title={`Students: ${classData?.name || ''}`}
      description="View and manage students enrolled in this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Students', href: '#' },
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
            <Link href={`/admin/campus/classes/${classId}/enroll-students`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Enroll Students
            </Link>
          </Button>
        </div>
      }
    >
      {/* Search and filter bar */}
      <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              className="pl-10"
              placeholder="Search students" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export List
          </Button>
        </div>
      </div>
      
      {/* Students list */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students ({filteredStudents?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents && filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Enrollment No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((enrollment: Enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.student?.user?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>{enrollment.student?.enrollmentNumber || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enrollment.startDate ? format(new Date(enrollment.startDate), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmUnenrollStudentId(enrollment.id)}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No students enrolled in this class.</p>
              <Button asChild>
                <Link href={`/admin/campus/classes/${classId}/enroll-students`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enroll Students
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Confirmation dialog for unenrolling a student */}
      <Dialog 
        open={!!confirmUnenrollStudentId} 
        onOpenChange={(open) => !open && setConfirmUnenrollStudentId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unenroll</DialogTitle>
            <DialogDescription>
              Are you sure you want to unenroll this student from the class? This action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmUnenrollStudentId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnenrollStudent} disabled={unenrollStudentMutation.isLoading}>
              {unenrollStudentMutation.isLoading ? <Loader2 className="h-4 w-4 mr-2" /> : null}
              Unenroll Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
} 
