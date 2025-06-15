'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/atoms/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function StudentGradesPage() {
  const params = useParams<{ classId: string; studentId: string }>();
  const classId = params?.classId || '';
  const studentId = params?.studentId || '';

  // Fetch student details
  const { data: student, isLoading: isLoadingStudent } = api.student.getById.useQuery({
    id: studentId
  });

  // Fetch class details
  const { data: classDetails, isLoading: isLoadingClass } = api.class.getById.useQuery({
    classId
  });

  // Fetch student's activity grades
  const { data: activityGrades, isLoading: isLoadingGrades } = api.activityGrade.getStudentGrades.useQuery({
    studentId,
    classId
  });

  // Loading state
  if (isLoadingStudent || isLoadingClass || isLoadingGrades) {
    return (
      <div className="container mx-auto py-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  // Error state
  if (!student || !classDetails) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Failed to load student or class details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/teacher/classes/${classId}/grades`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Class Grades
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${student.user?.name || 'Student'}'s Grades`}
        description={`View and manage grades for ${student.user?.name || 'Student'} in ${classDetails.name}`}
      />

      <Tabs defaultValue="activities" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="summary">Grade Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activity Grades</CardTitle>
            </CardHeader>
            <CardContent>
              {!activityGrades || activityGrades.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No activity grades found for this student.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Activity</th>
                        <th className="text-left py-3 px-4 font-medium">Subject</th>
                        <th className="text-left py-3 px-4 font-medium">Score</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Submitted</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityGrades.map((grade) => (
                        <tr key={grade.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Link
                              href={`/teacher/classes/${classId}/activities/${grade.activityId}`}
                              className="text-primary hover:underline font-medium"
                            >
                              {grade.activity?.title || 'Unknown Activity'}
                            </Link>
                          </td>
                          <td className="py-3 px-4">{grade.activity?.subject?.name || '-'}</td>
                          <td className="py-3 px-4">{grade.score !== null ? grade.score : '-'}</td>
                          <td className="py-3 px-4">{grade.status}</td>
                          <td className="py-3 px-4">
                            {grade.submittedAt ? new Date(grade.submittedAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <Link
                              href={`/teacher/classes/${classId}/activities/${grade.activityId}/grade?student=${studentId}`}
                              className="text-primary hover:underline"
                            >
                              Grade
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">Assessment grades will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Grade Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">Grade summary will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
