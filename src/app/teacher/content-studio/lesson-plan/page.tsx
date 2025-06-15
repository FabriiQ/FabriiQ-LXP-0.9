import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import { LessonPlanCreationPage } from '@/features/contnet-studio/pages/LessonPlanCreationPage';
import { ContentStudioProvider } from '@/features/contnet-studio/contexts/ContentStudioContext';

export const metadata: Metadata = {
  title: 'Create Lesson Plan | Content Studio',
  description: 'Create a new lesson plan with AI assistance or manually',
};

export default async function LessonPlanCreationPageWrapper() {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a teacher
  if (!session?.user || session.user.userType !== UserType.CAMPUS_TEACHER) {
    redirect('/auth/signin?callbackUrl=/teacher/content-studio/lesson-plan');
  }

  return (
    <ContentStudioProvider>
      <LessonPlanCreationPage />
    </ContentStudioProvider>
  );
}
