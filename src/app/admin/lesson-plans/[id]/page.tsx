import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import AdminLessonPlanReview from '@/components/admin/lesson-plans/AdminLessonPlanReview';

export const metadata: Metadata = {
  title: 'Review Lesson Plan | Admin Portal',
  description: 'Review and approve a coordinator-approved lesson plan',
};

export default async function AdminLessonPlanReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSessionCache();

  // Redirect if not authenticated or not an admin
  if (!session?.user || session.user.userType !== UserType.CAMPUS_ADMIN) {
    redirect('/auth/signin?callbackUrl=/admin/lesson-plans');
  }

  return <AdminLessonPlanReview id={params.id} />;
}
