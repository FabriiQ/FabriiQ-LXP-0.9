import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import LessonPlanForm from '@/components/teacher/lesson-plans/LessonPlanForm';

export const metadata: Metadata = {
  title: 'Edit Lesson Plan | Teacher Portal',
  description: 'Edit your lesson plan',
};

export default async function EditLessonPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a teacher
  if (!session?.user || session.user.userType !== UserType.CAMPUS_TEACHER) {
    redirect('/auth/signin?callbackUrl=/teacher/lesson-plans');
  }

  // For server components, we can't use the client-side API directly
  // The LessonPlanForm component will handle data fetching and validation on the client side
  // The form component expects initialData, but we'll need to fetch that on the client side
  // Pass the ID as a prop to the client component so it can fetch the data
  return <LessonPlanForm isEdit={true} initialData={{ id: params.id }} />;
}
