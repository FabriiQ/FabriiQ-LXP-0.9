'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { ArrowLeft, Download, Search, Edit, Plus, Settings, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { Badge } from '@/components/ui/badge';
import { api } from '@/trpc/react';

interface Student {
  id: string;
  name: string;
  enrollmentNumber: string;
  finalGrade?: number | null;
  letterGrade?: string | null;
}

interface Assignment {
  id: string;
  title: string;
  maxScore: number | null;
  weight: number;
}

interface GradeData {
  id: string;
  studentId: string;
  assignmentId: string;
  score: number | null;
  percentage: number | null;
}

export default function ClassGradebookPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Use TRPC to fetch class data
  const { data: classData, isLoading: isClassLoading } = api.class.getById.useQuery({
    classId,
  });
  
  // Use TRPC to fetch gradebook data, which may return a 404 if not initialized
  const { 
    data: gradebookData, 
    isLoading: isGradebookLoading,
    refetch: refetchGradebook,
    isError: isGradebookError,
    error: gradebookError
  } = api.class.getGradebook.useQuery({
    classId,
  }, {
    // Don't show the error toast for 404 errors (gradebook not initialized)
    onError: (error) => {
      if (error.data?.code !== 'NOT_FOUND') {
        console.error('Error fetching gradebook:', error);
        toast({
          title: 'Error',
          description: 'Failed to load gradebook data',
          variant: 'error',
        });
      }
    }
  });
  
  // Use TRPC mutation for initializing the gradebook
  const initializeGradebookMutation = api.class.initializeGradebook.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Gradebook initialized successfully',
        variant: 'success',
      });
      
      // Refresh the gradebook data
      refetchGradebook();
    },
    onError: (error) => {
      console.error('Error initializing gradebook:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize gradebook',
        variant: 'error',
      });
    }
  });
  
  // Determine if gradebook exists
  const gradebookExists = !isGradebookError || gradebookError?.data?.code !== 'NOT_FOUND';
  
  // Extract data from the gradebook
  const students = gradebookData?.students || [];
  const assignments = gradebookData?.assignments || [];
  const grades = gradebookData?.grades || [];
  
  // Filter students based on search query
  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.enrollmentNumber.toLowerCase().includes(query)
    );
  });
  
  // Calculate the grade for a specific student and assignment
  const getGrade = (studentId: string, assignmentId: string) => {
    return grades.find(grade => 
      grade.studentId === studentId && grade.assignmentId === assignmentId
    ) || null;
  };
  
  // Initialize gradebook
  const handleInitializeGradebook = async () => {
    initializeGradebookMutation.mutate({ classId });
  };
  
  // Export gradebook as CSV
  const handleExportGradebook = () => {
    // Create CSV headers
    let csvContent = 'Student Name,Enrollment Number';
    assignments.forEach(assignment => {
      csvContent += `,${assignment.title} (${assignment.maxScore})`;
    });
    csvContent += ',Final Grade,Letter Grade\n';
    
    // Add student data
    students.forEach(student => {
      csvContent += `${student.name},${student.enrollmentNumber}`;
      
      // Add grades for each assignment
      assignments.forEach(assignment => {
        const grade = getGrade(student.id, assignment.id);
        csvContent += `,${grade?.score !== null ? grade?.score : ''}`;
      });
      
      // Add final grade and letter grade
      csvContent += `,${student.finalGrade !== null ? student.finalGrade : ''}`;
      csvContent += `,${student.letterGrade || ''}\n`;
    });
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Class_${classId}_Gradebook.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isClassLoading || isGradebookLoading) {
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title={`Gradebook: ${classData?.name || ''}`}
      description="View and manage student grades for this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Gradebook', href: '#' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${classId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
          {gradebookExists && (
            <>
              <Button variant="outline" onClick={handleExportGradebook}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button asChild variant="outline">
                <Link href={`/admin/campus/classes/${classId}/gradebook/settings`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </>
          )}
        </div>
      }
    >
      {!gradebookExists ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="bg-primary/10 rounded-full p-4 inline-block mb-4">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Gradebook Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                This class doesn't have a gradebook set up yet. Initialize a new gradebook to start tracking student grades.
              </p>
              <Button 
                onClick={handleInitializeGradebook} 
                disabled={initializeGradebookMutation.isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {initializeGradebookMutation.isLoading ? 'Initializing...' : 'Initialize Gradebook'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex justify-between items-center">
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
          
          <Card>
            <CardHeader>
              <CardTitle>Student Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="bg-muted/20 border-b">
                        <th className="text-left p-3 font-medium">Student</th>
                        {assignments.map(assignment => (
                          <th key={assignment.id} className="text-center p-3 font-medium">
                            <div className="max-w-[120px] truncate">{assignment.title}</div>
                            <div className="text-xs text-muted-foreground">Max: {assignment.maxScore || 'N/A'}</div>
                          </th>
                        ))}
                        <th className="text-center p-3 font-medium">Final Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map(student => (
                          <tr key={student.id} className="border-b hover:bg-muted/10">
                            <td className="p-3">
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.enrollmentNumber}</div>
                            </td>
                            
                            {assignments.map(assignment => {
                              const grade = getGrade(student.id, assignment.id);
                              return (
                                <td key={assignment.id} className="text-center p-3">
                                  {grade?.score !== null ? (
                                    <div>
                                      <div>{grade?.score}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {grade?.percentage !== null ? `${Math.round(grade?.percentage)}%` : ''}
                                      </div>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="bg-muted/10">Not Graded</Badge>
                                  )}
                                </td>
                              );
                            })}
                            
                            <td className="text-center p-3">
                              {student.finalGrade !== null ? (
                                <div>
                                  <Badge className="px-2 py-1 text-sm font-semibold">
                                    {student.letterGrade || '-'}
                                  </Badge>
                                  <div className="text-sm mt-1">{student.finalGrade}%</div>
                                </div>
                              ) : (
                                <Badge variant="outline" className="bg-muted/10">No Grade</Badge>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={assignments.length + 2} className="text-center p-6 text-muted-foreground">
                            No students found matching your search criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </PageLayout>
  );
} 