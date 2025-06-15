import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import LessonPlanDashboard from '@/components/teacher/lesson-plans/LessonPlanDashboard';

export const metadata: Metadata = {
  title: 'Lesson Plans | Teacher Portal',
  description: 'Create and manage your weekly and monthly lesson plans',
};

export default async function LessonPlansPage() {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a teacher
  if (!session?.user || session.user.userType !== UserType.CAMPUS_TEACHER) {
    redirect('/auth/signin?callbackUrl=/teacher/lesson-plans');
  }

  return <LessonPlanDashboard />;
}
