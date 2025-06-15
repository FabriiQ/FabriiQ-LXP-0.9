import { Metadata } from 'next';
import { CoordinatorStudentsClient } from '@/components/coordinator/CoordinatorStudentsClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Student Management',
  description: 'Manage students, view performance metrics, and track progress',
};

/**
 * Student Management Page
 *
 * This page displays the student management interface for coordinators.
 * It uses a client component for interactive elements.
 */
export default async function StudentsPage({
  searchParams
}: {
  searchParams: { search?: string; programId?: string }
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

  // Mock program campuses data (in a real app, this would come from the database)
  const mockProgramCampuses = [
    {
      id: "pc-1",
      programId: "prog-1",
      program: {
        id: "prog-1",
        name: "Science Program"
      }
    },
    {
      id: "pc-2",
      programId: "prog-2",
      program: {
        id: "prog-2",
        name: "Arts Program"
      }
    },
    {
      id: "pc-3",
      programId: "prog-3",
      program: {
        id: "prog-3",
        name: "Technology Program"
      }
    }
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Student Management
      </h1>
      <CoordinatorStudentsClient
        initialSearch={searchParams.search || ""}
        initialProgramId={searchParams.programId || ""}
        campus={mockCampus}
        programCampuses={mockProgramCampuses}
      />
    </div>
  );
}
