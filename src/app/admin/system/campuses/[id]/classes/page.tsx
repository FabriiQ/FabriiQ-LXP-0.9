import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { CampusClassesContent } from "./CampusClassesContent";

interface CampusClassesPageProps {
  params: {
    id: string;
  };
  searchParams: {
    programId?: string;
    termId?: string;
    search?: string;
  };
}

export default async function CampusClassesPage({ params, searchParams }: CampusClassesPageProps) {
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
    where: { id: params.id },
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
      campusId: params.id,
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

  // Get available terms for filtering
  const terms = await prisma.term.findMany({
    where: {
      status: 'ACTIVE',
    },
    orderBy: [
      {
        startDate: 'desc',
      },
    ],
    take: 10, // Limit to recent terms
  });

  // Build where clause for classes query
  const whereClause: any = {
    courseCampus: {
      campusId: params.id,
    },
    status: 'ACTIVE',
  };

  // Add program filter if provided
  if (searchParams.programId) {
    whereClause.programCampusId = searchParams.programId;
  }

  // Add term filter if provided
  if (searchParams.termId) {
    whereClause.termId = searchParams.termId;
  }

  // Add search filter if provided
  if (searchParams.search) {
    whereClause.OR = [
      {
        name: {
          contains: searchParams.search,
          mode: 'insensitive',
        },
      },
      {
        code: {
          contains: searchParams.search,
          mode: 'insensitive',
        },
      },
    ];
  }

  // Get classes for this campus with filters
  const classes = await prisma.class.findMany({
    where: whereClause,
    include: {
      courseCampus: {
        include: {
          course: true,
        },
      },
      term: true,
      classTeacher: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      facility: true,
      programCampus: {
        include: {
          program: true,
        },
      },
      _count: {
        select: {
          students: true,
          teachers: true,
          activities: true,
          assessments: true,
        },
      },
    },
    orderBy: [
      {
        term: {
          startDate: 'desc',
        },
      },
      {
        name: 'asc',
      },
    ],
  });

  return (
    <CampusClassesContent
      campus={campus}
      classes={classes}
      programCampuses={programCampuses}
      terms={terms}
      searchParams={searchParams}
    />
  );
}
