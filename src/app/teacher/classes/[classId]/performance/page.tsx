import React from 'react';
import { TeacherClassPerformanceDetail } from '@/components/teacher/performance/TeacherClassPerformanceDetail';
import { TeacherLayout } from '@/components/teacher/layout/TeacherLayout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';

interface TeacherClassPerformancePageProps {
  params: {
    classId: string;
  };
}

export default async function TeacherClassPerformancePage({ params }: TeacherClassPerformancePageProps) {
  const { classId } = params;
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/signin');
  }

  // Check if the user is a teacher
  if (session.user.userType !== 'TEACHER' && session.user.userType !== 'CAMPUS_TEACHER') {
    redirect('/dashboard');
  }

  // Check if the teacher is assigned to this class
  const teacherProfile = await prisma.teacherProfile.findFirst({
    where: {
      userId: session.user.id,
    },
  });

  if (!teacherProfile) {
    redirect('/dashboard');
  }

  const teacherAssignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacherProfile.id,
      classId: classId,
    },
  });

  if (!teacherAssignment) {
    redirect('/teacher/classes');
  }

  // Get class details for the page title
  const classDetails = await prisma.class.findUnique({
    where: {
      id: classId,
    },
    select: {
      name: true,
    },
  });

  return (
    <TeacherLayout
      teacherId={teacherProfile.id}
      userName={session.user.name || "Teacher"}
      userEmail={session.user.email || ""}
      currentClassId={classId}
      title={`${classDetails?.name || 'Class'} Performance`}
    >
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">
          {classDetails?.name || 'Class'} Performance
        </h1>
        <TeacherClassPerformanceDetail classId={classId} />
      </div>
    </TeacherLayout>
  );
}
