import { Metadata } from 'next';
import { CoordinatorCourseDetail } from '@/components/coordinator/CoordinatorCourseDetail';

export const metadata: Metadata = {
  title: 'Course Details',
  description: 'View detailed course information, analytics, and performance metrics',
};

/**
 * Course Detail Page
 * 
 * This page displays detailed information about a specific course.
 * It uses a client component for interactive elements.
 */
export default function CourseDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Course Details
      </h1>
      <CoordinatorCourseDetail courseId={params.id} />
    </div>
  );
}
