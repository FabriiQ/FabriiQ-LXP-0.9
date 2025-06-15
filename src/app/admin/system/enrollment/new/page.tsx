'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { SystemEnrollmentForm } from './enrollment-form';

export default function SystemCreateEnrollmentPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all campuses
  const { data: campuses, isLoading: campusesLoading } = api.campus.getAllCampuses.useQuery();

  // Fetch all students
  const { data: students, isLoading: studentsLoading } = api.user.getAllStudents.useQuery();

  // Fetch all classes
  const { data: classes, isLoading: classesLoading } = api.class.getAllClasses.useQuery();

  useEffect(() => {
    setIsLoading(campusesLoading || studentsLoading || classesLoading);
  }, [campusesLoading, studentsLoading, classesLoading]);

  // Format students for the form
  const formattedStudents = students?.map(student => ({
    id: student.id,
    name: student.user.name || 'Unknown',
    email: student.user.email || '',
    campusId: student.user.primaryCampusId || ''
  })) || [];

  // Format classes for the form
  const formattedClasses = classes?.items?.map(classItem => ({
    id: classItem.id,
    name: classItem.name,
    campusId: classItem.campusId,
    campusName: classItem.campus?.name || 'Unknown',
    programName: classItem.programCampus?.program?.name || 'N/A',
    courseName: classItem.courseCampus?.course?.name || 'N/A',
    termName: classItem.term?.name || 'N/A'
  })) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/system/enrollment">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          </Button>
          <PageHeader
            title="New Enrollment"
            description="Create a new student enrollment across any campus"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <SystemEnrollmentForm
          campuses={campuses || []}
          students={formattedStudents}
          classes={formattedClasses}
        />
      )}
    </div>
  );
}
