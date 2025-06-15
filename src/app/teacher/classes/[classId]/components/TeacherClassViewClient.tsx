'use client';

import React from 'react';
import { ClassDashboard } from '@/components/class/ClassDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

interface TeacherClassViewClientProps {
  classId: string;
  className: string;
  classData: any;
  studentsCount: number;
  assessmentsCount: number;
  activitiesCount: number;
  attendanceRecordsCount: number;
}

export function TeacherClassViewClient({
  classId,
  className,
  classData,
  studentsCount,
  assessmentsCount,
  activitiesCount,
  attendanceRecordsCount
}: TeacherClassViewClientProps) {
  return (
    <div className="space-y-6">
      {/* Class Dashboard */}
      <ClassDashboard 
        classId={classId}
        className={className}
        initialData={{
          studentsCount,
          assessmentsCount,
          activitiesCount,
          attendanceRecordsCount
        }}
      />
      
      {/* Class Information Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold">Basic Information</h3>
              <p><span className="font-medium">Class Code:</span> {classData.code}</p>
              <p><span className="font-medium">Course:</span> {classData.courseCampus?.course?.name || 'Not assigned'}</p>
              <p><span className="font-medium">Subject:</span> {classData.courseCampus?.course?.subjects?.[0]?.name || 'Not assigned'}</p>
              <p><span className="font-medium">Current Enrollment:</span> {studentsCount} students</p>
              <p><span className="font-medium">Max Capacity:</span> {classData.maxCapacity || 'Unlimited'}</p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold">Academic Information</h3>
              <p><span className="font-medium">Term:</span> {classData.term?.name || 'Not assigned'}</p>
              <p><span className="font-medium">Total Teachers:</span> {classData.teachers?.length || 0}</p>
              <Link href={`/teacher/classes/${classId}/leaderboard`}>
                <Button variant="outline" size="sm" className="mt-2">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold">Quick Links</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/teacher/classes/${classId}/schedule`}>
                    Schedule
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/teacher/classes/${classId}/assessments`}>
                    Assessments
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/teacher/classes/${classId}/attendance`}>
                    Attendance
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/teacher/classes/${classId}/gradebook`}>
                    Gradebook
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/teacher/classes/${classId}/activities`}>
                    Activities
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href={`/teacher/classes/${classId}/students`}>
                    Students
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
