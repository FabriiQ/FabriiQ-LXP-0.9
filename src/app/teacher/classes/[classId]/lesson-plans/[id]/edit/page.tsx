import React from 'react';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db';
import { PageHeader } from '@/components/ui/page-header';
import { UserType } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';
import { Button } from '@/components/ui/atoms/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LessonPlanForm from '@/components/teacher/lesson-plans/LessonPlanForm';

export default async function EditLessonPlanPage({
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

    // Get lesson plan details with subjects
    const lessonPlan = await prisma.lessonPlan.findUnique({
      where: {
        id: lessonPlanId,
      },
      include: {
        class: {
          include: {
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: {
                      where: { status: 'ACTIVE' },
                      orderBy: { name: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!lessonPlan) {
      return redirect(`/teacher/classes/${classId}/lesson-plans`);
    }

    // Check if the lesson plan belongs to this teacher
    if (lessonPlan.teacherId !== user.teacherProfile.id) {
      return redirect(`/teacher/classes/${classId}/lesson-plans`);
    }

    // Check if the lesson plan is in draft status
    if (lessonPlan.status !== 'DRAFT') {
      return redirect(`/teacher/classes/${classId}/lesson-plans/${lessonPlanId}`);
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <PageHeader
            title="Edit Lesson Plan"
            description={`Edit lesson plan for ${lessonPlan.class.name}`}
          />
          <Button variant="outline" asChild>
            <Link href={`/teacher/classes/${classId}/lesson-plans/${lessonPlanId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Lesson Plan
            </Link>
          </Button>
        </div>

        <LessonPlanForm
          teacherId={user.teacherProfile.id}
          classId={classId}
          subjects={lessonPlan.class.courseCampus?.course?.subjects || []}
          initialData={lessonPlan}
          isEdit={true}
        />
      </div>
    );
  } catch (error) {
    logger.error('Error in edit lesson plan page', { error });
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We couldn't load the lesson plan for editing.
        </p>
      </div>
    );
  }
}
