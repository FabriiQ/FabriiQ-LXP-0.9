import { redirect } from 'next/navigation';

/**
 * Redirect from /student/class/[id] to /student/class/[id]/dashboard
 * This ensures that when a user navigates to the class page, they are redirected to the dashboard
 */
export default function ClassPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Redirect to the dashboard page
  redirect(`/student/class/${id}/dashboard`);
}
