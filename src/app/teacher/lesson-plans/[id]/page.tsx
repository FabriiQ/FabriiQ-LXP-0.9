import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import LessonPlanView from '@/components/teacher/lesson-plans/LessonPlanView';

export const metadata: Metadata = {
  title: 'View Lesson Plan | Teacher Portal',
  description: 'View lesson plan details',
};

export default async function LessonPlanViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a teacher
  if (!session?.user || session.user.userType !== UserType.CAMPUS_TEACHER) {
    redirect('/auth/signin?callbackUrl=/teacher/lesson-plans');
  }

  return <LessonPlanView id={params.id} />;
}
