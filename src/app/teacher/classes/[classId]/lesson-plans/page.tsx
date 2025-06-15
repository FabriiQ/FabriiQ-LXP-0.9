import React from 'react';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/page-header';
import { UserType } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { Button } from '@/components/ui/atoms/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { ClassLessonPlanDashboard } from '@/components/teacher/lesson-plans/ClassLessonPlanDashboard';

export default async function ClassLessonPlansPage({
  params,
}: {
  params: { classId: string };
}) {
  // First await something to ensure params are resolved
  const session = await getSessionCache();
  await Promise.resolve();

  // Now it's safe to use params
  const classId = params.classId;

  // Redirect if not authenticated or not a teacher
  if (!session?.user || session.user.userType !== UserType.CAMPUS_TEACHER) {
    return redirect('/auth/signin?callbackUrl=/teacher/classes');
  }

  try {
    // Get user with teacher profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true,
      },
    });

    if (!user?.teacherProfile) {
      logger.error('Teacher profile not found', { userId: session.user.id });
      return redirect('/teacher/dashboard');
    }

    // Get class details
    const classDetails = await prisma.class.findUnique({
      where: {
        id: classId,
      },
    });

    if (!classDetails) {
      return redirect('/teacher/classes');
    }

    // Check if the teacher is assigned to this class
    const isTeacherAssigned = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: user.teacherProfile.id,
        classId: classId,
      },
    });

    if (!isTeacherAssigned) {
      return redirect('/teacher/classes');
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Lesson Plans"
            description={`Manage lesson plans for ${classDetails.name}`}
          />
          <Button asChild>
            <Link href={`/teacher/classes/${classId}/lesson-plans/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Lesson Plan
            </Link>
          </Button>
        </div>

        <ClassLessonPlanDashboard
          classId={classId}
          teacherId={user.teacherProfile.id}
        />
      </div>
    );
  } catch (error) {
    logger.error('Error in class lesson plans page', { error });
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn't load the lesson plans for this class.
        </p>
      </div>
    );
  }
}
