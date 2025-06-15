import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/server/db";
import CreateClassForm, { type Term } from "./CreateClassForm";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import type { ProgramCampus, CourseCampus } from '@prisma/client';
import { api } from "@/utils/api";
import { CampusService } from "@/server/api/services/campus.service";

export default async function NewClassPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Convert searchParams to a Promise to handle it asynchronously
  const params = await Promise.resolve(searchParams);
  
  // Now safely destructure the params
  const programId = typeof params?.programId === 'string' ? params.programId : undefined;
  const courseId = typeof params?.courseId === 'string' ? params.courseId : undefined;

  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { 
      id: session.user.id 
    },
    include: {
      activeCampuses: {
        where: {
          status: 'ACTIVE',
        },
        take: 1,
      },
    },
  });

  if (!user || !user.activeCampuses?.[0]) {
    redirect("/login");
  }

  const campusId = user.activeCampuses[0].campusId;

  // Get campus details with institution
  const campus = await prisma.campus.findUnique({
    where: { 
      id: campusId
    },
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

  // Get active program campuses
  const programCampuses = await prisma.programCampus.findMany({
    where: {
      campusId: campusId,
      status: 'ACTIVE' as const,
    },
    include: {
      program: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: {
      program: {
        name: 'asc',
      },
    },
  }) satisfies ProgramCampus[];

  // Get active course campuses for the campus
  let fetchedCourseCampuses = await prisma.courseCampus.findMany({
    where: {
      campusId: campusId,
      status: 'ACTIVE' as const,
      programCampus: {
        status: 'ACTIVE' as const,
      },
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
          programId: true,
        },
      },
      programCampus: {
        select: {
          id: true,
          program: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: {
      course: {
        name: 'asc',
      },
    },
  });

  // If no course campuses exist, create them
  if (fetchedCourseCampuses.length === 0) {
    // Use server action instead of client mutation
    await syncCourseCampuses(campusId);
    
    // Refetch after sync
    fetchedCourseCampuses = await prisma.courseCampus.findMany({
      where: {
        campusId: campusId,
        status: 'ACTIVE' as const,
        programCampus: {
          status: 'ACTIVE' as const,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            programId: true,
          },
        },
        programCampus: {
          select: {
            id: true,
            program: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        course: {
          name: 'asc',
        },
      },
    });
  }

  // Add debug logging
  console.log('Debug - Program Campuses:', programCampuses.length);
  console.log('Debug - Course Campuses:', fetchedCourseCampuses.length);

  // Log the results for debugging
  console.log('Fetched courseCampuses:', JSON.stringify(fetchedCourseCampuses, null, 2));

  // Verify data is properly structured
  if (fetchedCourseCampuses.length === 0) {
    console.warn('No course campuses found for campus:', campusId);
  }

  // Get active terms within current academic cycles
  const now = new Date();
  const [terms, academicCycles] = await Promise.all([
    prisma.term.findMany({
      where: {
        status: 'ACTIVE',
        academicCycle: {
          institutionId: campus.institution.id,
          status: 'ACTIVE',
          startDate: {
            lte: now,
          },
          endDate: {
            gte: now,
          },
        },
        courseId: courseId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        termType: true,
        termPeriod: true,
        status: true,
        startDate: true,
        endDate: true,
        courseId: true,
        academicCycle: {
          select: {
            id: true,
            name: true,
            code: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: [
        {
          academicCycle: {
            startDate: 'desc',
          },
        },
        {
          startDate: 'desc',
        },
      ],
    }) as Promise<Term[]>,
    prisma.academicCycle.findMany({
      where: {
        institutionId: campus.institution.id,
        status: 'ACTIVE',
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        startDate: true,
        endDate: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    }),
  ]);

  // Filter out terms with expired academic cycles
  const filteredTerms = terms.filter(term => {
    const cycleEnd = term.academicCycle.endDate ? new Date(term.academicCycle.endDate) : null;
    return !cycleEnd || cycleEnd >= now;
  });

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Create New Class"
        description="Create a new class for your campus"
        action={
          <Link href={`/admin/campus/${campusId}/classes`}>
            <Button variant="outline" size="sm">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Classes
            </Button>
          </Link>
        }
      />

      <CreateClassForm
        campusId={campusId}
        courseCampuses={fetchedCourseCampuses}
        terms={filteredTerms}
        academicCycles={academicCycles}
        selectedCourseId={courseId}
      />
    </div>
  );
}

// Add server action for syncing
async function syncCourseCampuses(campusId: string) {
  'use server';
  
  const campusService = new CampusService({ prisma });
  await campusService.syncCourseCampuses(campusId);
}









