import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import CoordinatorLessonPlanReview from '@/components/coordinator/lesson-plans/CoordinatorLessonPlanReview';

export const metadata: Metadata = {
  title: 'Review Lesson Plan | Coordinator Portal',
  description: 'Review and approve a teacher lesson plan',
};

export default async function CoordinatorLessonPlanReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a coordinator
  if (!session?.user || session.user.userType !== UserType.CAMPUS_COORDINATOR) {
    redirect('/auth/signin?callbackUrl=/admin/coordinator/lesson-plans');
  }

  return <CoordinatorLessonPlanReview id={params.id} />;
}
