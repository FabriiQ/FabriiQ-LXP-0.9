'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  UserPlus,
  BookOpen,
  CalendarClock,
  FileText,
  GraduationCap,
  Calendar,
  Trophy,
  User
} from 'lucide-react';
import { ClassDashboard } from '@/components/class/ClassDashboard';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface CoordinatorClassViewClientProps {
  id: string;
  classData: any;
  courseCampus: any;
  primaryTeacherName: string;
  primaryTeacherId?: string;
  assignedTeachers: any[];
  assessmentsCount: number;
  attendanceRecordsCount: number;
  gradebook: any;
  className: string;
}

export function CoordinatorClassViewClient({
  id,
  classData,
  courseCampus,
  primaryTeacherName,
  primaryTeacherId,
  assignedTeachers,
  assessmentsCount,
  attendanceRecordsCount,
  gradebook,
  className
}: CoordinatorClassViewClientProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
              <p>
                <span className="font-medium">Home Teacher:</span>{' '}
                {primaryTeacherId ? (
                  <Link href={`/admin/coordinator/teachers/${primaryTeacherId}`} className="text-primary hover:underline">
                    {primaryTeacherName || 'Not assigned'}
                  </Link>
                ) : (
                  primaryTeacherName || 'Not assigned'
                )}
              </p>
              <p><span className="font-medium">Total Teachers:</span> {assignedTeachers.length}</p>

              {/* Teacher List */}
              {assignedTeachers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Assigned Teachers</h4>
                  <div className="space-y-2">
                    {assignedTeachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {teacher.user?.name?.charAt(0) || 'T'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{teacher.user?.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/coordinator/teachers/${teacher.teacherId}`}>
                            <User className="h-3 w-3 mr-1" />
                            Profile
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Quick Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/coordinator/classes/${id}/schedule`)}>
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Schedule
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/coordinator/classes/${id}/assessments`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Assessments
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/coordinator/classes/${id}/attendance`)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Attendance
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/coordinator/classes/${id}/gradebook`)}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Gradebook
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/coordinator/classes/${id}/activities`)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Activities
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleNavigation(`/admin/coordinator/classes/${id}/students`)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Students
                </Button>
                <Button variant="outline" className="justify-start col-span-2" onClick={() => handleNavigation(`/admin/coordinator/classes/${id}/leaderboard`)}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
