'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Edit,
  UserPlus,
  BookOpen,
  Calendar as CalendarIcon,
  FileText,
  GraduationCap,
  Calendar,
  Award
} from 'lucide-react';
import { TopStudentsLeaderboard } from './TopStudentsLeaderboard';
import { ClassDashboard } from '@/components/class/ClassDashboard';

interface ClassViewClientProps {
  id: string;
  classData: any;
  courseCampus: any;
  primaryTeacherName: string;
  assignedTeachers: any[];
  assessmentsCount: number;
  attendanceRecordsCount: number;
  gradebook: any;
  className: string;
}

export function ClassViewClient({
  id,
  classData,
  courseCampus,
  primaryTeacherName,
  assignedTeachers,
  assessmentsCount,
  attendanceRecordsCount,
  gradebook,
  className
}: ClassViewClientProps) {
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="space-y-6">
      {/* Class Dashboard */}
      <ClassDashboard
        classId={id}
        className={className}
        initialData={{
          studentsCount: classData.students.length,
          assessmentsCount: assessmentsCount,
          activitiesCount: 0, // We'll need to fetch this from the API
          attendanceRecordsCount: attendanceRecordsCount
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
              <p><span className="font-medium">Course:</span> {courseCampus?.course?.name || 'Not assigned'}</p>
              <p><span className="font-medium">Campus:</span> {courseCampus?.campus?.name || 'Not assigned'}</p>
              <p><span className="font-medium">Current Enrollment:</span> {classData.students.length} students</p>
              <p><span className="font-medium">Max Capacity:</span> {classData.maxCapacity || 'Unlimited'}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Academic Information</h3>
              <p><span className="font-medium">Term:</span>
                <Link href={`/admin/campus/terms/${classData.termId}`} className="ml-1 text-primary hover:underline">
                  View Term
                </Link>
              </p>
              <p><span className="font-medium">Home Teacher:</span> {primaryTeacherName || 'Not assigned'}</p>
              <p><span className="font-medium">Total Teachers:</span> {assignedTeachers.length}</p>
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link href={`/admin/campus/classes/${id}/assign-teacher`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Teachers
                </Link>
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Quick Links</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/campus/classes/${id}/schedule`)}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/campus/classes/${id}/assessments`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Assessments
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/campus/classes/${id}/attendance`)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Attendance
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/campus/classes/${id}/gradebook`)}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Gradebook
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/campus/classes/${id}/activities`)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Activities
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/campus/classes/${id}/students`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Students
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
