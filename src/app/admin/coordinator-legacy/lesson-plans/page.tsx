import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import CoordinatorLessonPlanDashboard from '@/components/coordinator/lesson-plans/CoordinatorLessonPlanDashboard';

export const metadata: Metadata = {
  title: 'Lesson Plan Review | Coordinator Portal',
  description: 'Review and approve teacher lesson plans',
};

export default async function CoordinatorLessonPlansPage() {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a coordinator
  if (!session?.user || session.user.userType !== UserType.CAMPUS_COORDINATOR) {
    redirect('/auth/signin?callbackUrl=/admin/coordinator/lesson-plans');
  }

  return <CoordinatorLessonPlanDashboard />;
}
