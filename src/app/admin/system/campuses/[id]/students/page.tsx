import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { CampusStudentsContent } from "./CampusStudentsContent";

interface CampusStudentsPageProps {
  params: {
    id: string;
  };
  searchParams: {
    search?: string;
    programId?: string;
    _debugInfo?: any;
  };
}

export default async function CampusStudentsPage({ 
  params, 
  searchParams 
}: CampusStudentsPageProps) {
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      userType: true,
    },
  });

  if (!user || user.userType !== 'SYSTEM_ADMIN') {
    redirect("/login");
  }

  // Extract the ID from params to avoid using it directly
  const campusId = params.id;

  const campus = await prisma.campus.findUnique({
    where: { id: campusId },
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

  // Get available programs for filtering
  const programCampuses = await prisma.programCampus.findMany({
    where: {
      campusId: campusId,
      status: 'ACTIVE',
    },
    include: {
      program: true,
    },
    orderBy: {
      program: {
        name: 'asc',
      },
    },
  });

  // Create a clean version of searchParams without _debugInfo
  const cleanSearchParams = {
    search: searchParams.search,
    programId: searchParams.programId
  };

  return (
    <CampusStudentsContent
      campus={campus}
      programCampuses={programCampuses}
      searchParams={cleanSearchParams}
    />
  );
} 
