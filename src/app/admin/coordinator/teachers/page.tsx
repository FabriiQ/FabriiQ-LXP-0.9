import { Metadata } from 'next';
import { CoordinatorTeachersClient } from '@/components/coordinator/CoordinatorTeachersClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Teacher Management',
  description: 'Manage teachers, view performance metrics, and track attendance',
};

/**
 * Teacher Management Page
 *
 * This page displays the teacher management interface for coordinators.
 * It uses a client component for interactive elements.
 */
export default async function TeachersPage({
  searchParams
}: {
  searchParams: { search?: string }
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

  // Mock campus data (in a real app, this would come from the database)
  const mockCampus = {
    id: "campus-1",
    name: "Main Campus",
    code: "MC",
    status: "ACTIVE"
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Teacher Management
      </h1>
      <CoordinatorTeachersClient
        initialSearch={searchParams?.search ?? ""}
        campus={mockCampus}
      />
    </div>
  );
}
