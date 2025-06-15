import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';

export const metadata: Metadata = {
  title: 'Test Page | Coordinator Portal',
  description: 'Test page for coordinator portal',
};

export default async function TestPage() {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a coordinator
  if (!session?.user || session.user.userType !== UserType.CAMPUS_COORDINATOR) {
    redirect('/auth/signin?callbackUrl=/admin/coordinator/lesson-plans/test');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>This is a test page to verify that the coordinator layout is working correctly.</p>
    </div>
  );
}
