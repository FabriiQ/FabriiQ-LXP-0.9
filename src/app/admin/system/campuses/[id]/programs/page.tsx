import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { CampusProgramsContent } from "./CampusProgramsContent";

interface CampusProgramsPageProps {
  params: {
    id: string;
  };
}

export default async function CampusProgramsPage({
  params: { id } // Destructure id from params
}: CampusProgramsPageProps) {
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      userType: true,
    },
  });

  if (!user || user.userType !== 'SYSTEM_ADMIN') {
    redirect("/login");
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id }, // Use destructured id
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!campus) {
    notFound();
  }

  // Get programs associated with this campus
  const programCampuses = await prisma.programCampus.findMany({
    where: {
      campusId: id, // Use destructured id
      status: 'ACTIVE',
    },
    include: {
      program: true,
      _count: {
        select: {
          classes: true,
          courseOfferings: true,
        },
      },
    },
    orderBy: {
      program: {
        name: 'asc',
      },
    },
  });

  // Get ALL programs in the system
  const allSystemPrograms = await prisma.program.findMany({
    where: {
      status: 'ACTIVE',
    },
    orderBy: {
      name: 'asc',
    },
  });

  console.log('All programs in system:', allSystemPrograms.length);

  // Create a set of assigned program IDs for quick lookup
  const assignedProgramIds = new Set(programCampuses.map(pc => pc.programId));

  // Filter out programs that are already assigned to this campus
  const filteredAvailablePrograms = allSystemPrograms.filter(program => !assignedProgramIds.has(program.id));

  console.log('Assigned program IDs:', Array.from(assignedProgramIds));
  console.log('Available programs after filtering:', filteredAvailablePrograms.length);

  return (
    <CampusProgramsContent
      campus={campus}
      programCampuses={programCampuses}
      availablePrograms={filteredAvailablePrograms}
    />
  );
}
