import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import LessonPlanForm from '@/components/teacher/lesson-plans/LessonPlanForm';

export const metadata: Metadata = {
  title: 'Create Lesson Plan | Teacher Portal',
  description: 'Create a new weekly or monthly lesson plan',
};

export default async function NewLessonPlanPage() {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a teacher
  if (!session?.user || session.user.userType !== UserType.CAMPUS_TEACHER) {
    redirect('/auth/signin?callbackUrl=/teacher/lesson-plans/new');
  }

  return <LessonPlanForm />;
}
