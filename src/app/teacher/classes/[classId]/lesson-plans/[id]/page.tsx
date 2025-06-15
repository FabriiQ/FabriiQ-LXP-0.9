import React from 'react';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/page-header';
import { UserType } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { Button } from '@/components/ui/atoms/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import LessonPlanView from '@/components/teacher/lesson-plans/LessonPlanView';
import { DatabaseConnectionError } from '@/components/ui/error-handling/DatabaseConnectionError';

export default async function ViewLessonPlanPage({
  params,
}: {
  params: { classId: string; id: string };
}) {
  // First await something to ensure params are resolved
  const session = await getSessionCache();
  await Promise.resolve();

  // Now it's safe to use params
  const { classId, id: lessonPlanId } = params;

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

    // Get lesson plan details
    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: {
        id: lessonPlanId,
      },
      include: {
        class: true,
      },
    });

    if (!lessonPlan) {
      return redirect(`/teacher/classes/${classId}/lesson-plans`);
    }

    // Check if the lesson plan belongs to this teacher
    if (lessonPlan.teacherId !== user.teacherProfile.id) {
      return redirect(`/teacher/classes/${classId}/lesson-plans`);
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title={lessonPlan.title}
            description={`Lesson plan for ${lessonPlan.class.name}`}
          />
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/teacher/classes/${classId}/lesson-plans`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lesson Plans
              </Link>
            </Button>
            {lessonPlan.status === 'DRAFT' && (
              <Button asChild>
                <Link href={`/teacher/classes/${classId}/lesson-plans/${lessonPlanId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </div>

        <LessonPlanView id={lessonPlanId} />
      </div>
    );
  } catch (error) {
    logger.error('Error in view lesson plan page', { error });

    // Check if it's a database connection error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("Can't reach database server") ||
        errorMessage.includes("database server is running") ||
        errorMessage.includes("ECONNREFUSED")) {

      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <PageHeader
              title="Database Connection Error"
              description="Unable to connect to the database"
            />
            <Button variant="outline" asChild>
              <Link href={`/teacher/classes/${classId}/lesson-plans`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lesson Plans
              </Link>
            </Button>
          </div>

          <DatabaseConnectionError
            backPath={`/teacher/classes/${classId}/lesson-plans`}
            message="Unable to connect to the database. This is likely a local development environment issue."
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn't load the lesson plan details.
        </p>
      </div>
    );
  }
}
