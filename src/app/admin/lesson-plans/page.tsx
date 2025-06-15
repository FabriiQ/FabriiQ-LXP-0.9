import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import AdminLessonPlanDashboard from '@/components/admin/lesson-plans/AdminLessonPlanDashboard';

export const metadata: Metadata = {
  title: 'Lesson Plan Approval | Admin Portal',
  description: 'Review and approve coordinator-approved lesson plans',
};

export default async function AdminLessonPlansPage() {
  const session = await getSessionCache();

  // Redirect if not authenticated or not an admin
  if (!session?.user || session.user.userType !== UserType.CAMPUS_ADMIN) {
    redirect('/auth/signin?callbackUrl=/admin/lesson-plans');
  }

  return <AdminLessonPlanDashboard />;
}
