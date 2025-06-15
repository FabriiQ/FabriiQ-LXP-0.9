'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { ArrowLeft, Download, Search, Save } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { Input } from '@/components/ui/forms/input';
import { DataTable } from '@/components/ui/data-display/data-table';
import { Badge } from '@/components/ui/data-display/badge';

export default function ActivityGradesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = params?.id as string;
  const activityId = params?.activityId as string;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [grades, setGrades] = useState<Record<string, number | null>>({});
  
  const { data: activity, isLoading: isLoadingActivity } = api.class.getActivity.useQuery({
    id: activityId,
    includeGrades: true
  });
  
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery({
    classId,
    include: {
      students: true
    }
  });

  const saveGradesMutation = api.class.bulkSaveActivityGrades.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Grades saved successfully',
        variant: 'success',
      });
      setIsSaving(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save grades: ${error.message}`,
        variant: 'error',
      });
      setIsSaving(false);
    },
  });

  const exportGradesMutation = api.class.exportClassData.useMutation({
    onSuccess: (data) => {
      // Handle download logic here
      const url = window.URL.createObjectURL(new Blob([data as any]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${classData?.name}_${activity?.title}_grades.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: 'Success',
        description: 'Grades exported successfully',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to export grades: ${error.message}`,
        variant: 'error',
      });
    },
  });

  const handleGradeChange = (studentId: string, grade: string) => {
    const numericGrade = grade === '' ? null : Number(grade);
    setGrades(prev => ({
      ...prev,
      [studentId]: numericGrade
    }));
  };

  const handleSaveGrades = () => {
    if (Object.keys(grades).length === 0) {
      toast({
        title: 'Warning',
        description: 'No grades to save',
        variant: 'warning',
      });
      return;
    }

    setIsSaving(true);
    
    const gradeEntries = Object.entries(grades).map(([studentId, score]) => ({
      studentId,
      score: score as number
    })).filter(entry => entry.score !== null);
    
    saveGradesMutation.mutate({
      activityId,
      grades: gradeEntries
    });
  };

  const handleExportGrades = () => {
    exportGradesMutation.mutate({
      classId,
      type: 'GRADES',
      format: 'CSV',
      startDate: new Date(),
      endDate: new Date()
    });
  };

  const isLoading = isLoadingActivity || isLoadingClass;

  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading activity grades"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Activities', href: `/admin/campus/classes/${classId}/activities` },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (!activity) {
    return (
      <PageLayout
        title="Activity Not Found"
        description="The activity you're looking for does not exist"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Activities', href: `/admin/campus/classes/${classId}/activities` },
          { label: 'Not Found', href: '#' },
        ]}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Activity Not Found</h3>
              <p className="text-muted-foreground mb-6">
                The activity you are looking for does not exist or has been deleted.
              </p>
              <Button asChild>
                <Link href={`/admin/campus/classes/${classId}/activities`}>Back to Activities</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Prepare students data with grades
  const studentsWithGrades = classData?.students?.map(student => {
    const existingGrade = activity.grades?.find(g => g.studentId === student.id);
    return {
      ...student,
      currentGrade: existingGrade?.score || null,
      newGrade: grades[student.id] !== undefined ? grades[student.id] : (existingGrade?.score || null)
    };
  }) || [];

  // Filter students based on search
  const filteredStudents = searchQuery 
    ? studentsWithGrades.filter(student => 
        student.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student?.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ) 
    : studentsWithGrades;

  const columns = [
    {
      header: 'Student',
      accessorKey: 'student',
      cell: ({ row }: any) => (
        <div>
          <p>{row.original.student?.user?.name}</p>
          <p className="text-sm text-muted-foreground">{row.original.student?.user?.email}</p>
        </div>
      ),
    },
    {
      header: 'Current Grade',
      accessorKey: 'currentGrade',
      cell: ({ row }: any) => (
        row.original.currentGrade !== null ? (
          <Badge variant={row.original.currentGrade >= (activity.passingScore || 0) ? 'success' : 'destructive'}>
            {row.original.currentGrade} / {activity.maxScore}
          </Badge>
        ) : (
          <span className="text-muted-foreground">Not graded</span>
        )
      ),
    },
    {
      header: 'New Grade',
      accessorKey: 'newGrade',
      cell: ({ row }: any) => (
        <Input
          type="number"
          min={0}
          max={activity.maxScore || 100}
          value={grades[row.original.id] ?? (row.original.currentGrade ?? '')}
          onChange={(e) => handleGradeChange(row.original.id, e.target.value)}
          className="w-24"
        />
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => {
        const currentGrade = row.original.currentGrade;
        const newGrade = grades[row.original.id];
        
        if (newGrade !== undefined && newGrade !== currentGrade) {
          return <Badge>Changed</Badge>;
        }
        
        if (currentGrade === null) {
          return <span className="text-muted-foreground">Pending</span>;
        }
        
        return <span className="text-muted-foreground">Unchanged</span>;
      }
    },
  ];

  return (
    <PageLayout
      title={`Manage Grades: ${activity.title}`}
      description="Manage student grades for this activity"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Activities', href: `/admin/campus/classes/${classId}/activities` },
        { label: activity.title, href: `/admin/campus/classes/${classId}/activities/${activityId}` },
        { label: 'Grades', href: '#' },
      ]}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${classId}/activities/${activityId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Activity
            </Link>
          </Button>
          <Button variant="outline" onClick={handleExportGrades}>
            <Download className="h-4 w-4 mr-2" />
            Export Grades
          </Button>
          <Button onClick={handleSaveGrades} disabled={isSaving || Object.keys(grades).length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Grades'}
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Student Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-1">Max Score</h4>
                <p>{activity.maxScore}</p>
              </div>
              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-1">Passing Score</h4>
                <p>{activity.passingScore}</p>
              </div>
              <div className="p-4 border rounded-md">
                <h4 className="font-medium mb-1">Weightage</h4>
                <p>{activity.weightage}%</p>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredStudents}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
} 