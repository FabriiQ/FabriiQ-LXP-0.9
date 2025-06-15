import { Metadata } from 'next';
import { getSessionCache } from '@/utils/session-cache';
import { redirect } from 'next/navigation';
import { UserType } from '@/server/api/types/user';
import { prisma } from '@/server/db';
import { CoordinatorProgramSelector } from '@/components/coordinator';

// Define types for the program and campus data
interface Campus {
  id: string;
  name: string;
  code: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
  campuses: Campus[];
}

export const metadata: Metadata = {
  title: 'Course Analytics | Coordinator Portal',
  description: 'View analytics for courses across campuses',
};

export default async function CoordinatorCourseAnalyticsPage() {
  const session = await getSessionCache();

  // Redirect if not authenticated or not a coordinator
  if (!session?.user || session.user.userType !== UserType.CAMPUS_COORDINATOR) {
    redirect('/auth/signin?callbackUrl=/admin/coordinator/analytics/course');
  }

  // Get coordinator profile with program assignments
  const coordinator = await prisma.coordinatorProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
    },
  });

  if (!coordinator) {
    redirect('/admin/coordinator');
  }

  // Extract programs and campuses from coordinator profile
  // The managedPrograms field is a JSON array of program assignments
  interface ProgramCoordinatorData {
    programId: string;
    programName: string;
    programCode: string;
    campusId: string;
    campusName: string;
    role: string;
    responsibilities: string[];
    assignedAt: string | Date;
  }

  const managedPrograms = coordinator.managedPrograms as unknown as ProgramCoordinatorData[];

  const programs = managedPrograms.map((programAssignment) => ({
    id: programAssignment.programId,
    name: programAssignment.programName,
    code: programAssignment.programCode,
    campusId: programAssignment.campusId,
    campusName: programAssignment.campusName,
  }));

  // Group programs by program ID
  const programsById = programs.reduce<Record<string, Program>>((acc, program) => {
    if (!acc[program.id]) {
      acc[program.id] = {
        id: program.id,
        name: program.name,
        code: program.code,
        campuses: [],
      };
    }

    acc[program.id].campuses.push({
      id: program.campusId,
      name: program.campusName,
      code: program.campusId.substring(0, 4), // Generate a code if not available
    });

    return acc;
  }, {});

  // Convert to array
  const programsList: Program[] = Object.values(programsById);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Course Analytics</h1>

      {programsList.length > 0 ? (
        <CoordinatorProgramSelector programs={programsList} />
      ) : (
        <div className="bg-muted p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">No Programs Assigned</h2>
          <p className="text-muted-foreground">
            You don't have any programs assigned to you yet. Please contact your administrator.
          </p>
        </div>
      )}
    </div>
  );
}
