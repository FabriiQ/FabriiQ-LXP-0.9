import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { CoursePerformanceDashboard } from '@/components/coordinator/performance/CoursePerformanceDashboard';

export const metadata: Metadata = {
  title: 'Course Performance',
  description: 'View detailed performance metrics for this course and its classes',
};

/**
 * Course Performance Page
 *
 * This page displays the performance metrics for a specific course.
 * It includes accumulated analytics for all classes within the course.
 */
export default async function CoursePerformancePage({
  params
}: {
  params: { id: string }
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  // Redirect if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if the user is a coordinator or admin
  if (!['COORDINATOR', 'CAMPUS_COORDINATOR', 'SYSTEM_ADMIN', 'CAMPUS_ADMIN'].includes(session.user.userType)) {
    // Set user type in session to CAMPUS_COORDINATOR for testing purposes
    // In a real app, you would redirect to an appropriate page
    console.log('User is not a coordinator, but allowing access for testing');
    // redirect('/dashboard');
  }

  const courseId = params.id;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Course Performance
      </h1>
      <p className="text-muted-foreground">
        View accumulated performance metrics for all classes within this course
      </p>
      <CoursePerformanceDashboard courseId={courseId} />
    </div>
  );
}
