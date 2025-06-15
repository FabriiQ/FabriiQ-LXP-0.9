import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { NewClassForm } from "./NewClassForm";

interface NewClassPageProps {
  params: {
    id: string;
  };
  searchParams: {
    programId?: string;
    courseId?: string;
  };
}

export default async function NewClassPage({ params, searchParams }: NewClassPageProps) {
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

  // Check academic cycles for this institution
  const academicCycles = await prisma.academicCycle.findMany({
    where: {
      institutionId: campus.institution.id,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      code: true,
      startDate: true,
      endDate: true,
      _count: {
        select: {
          terms: true
        }
      }
    }
  });

  // Log for debugging
  console.log('Academic Cycles found:', academicCycles.length);
  console.log('Academic Cycles:', academicCycles);

  // Get active terms for this institution
  const terms = await prisma.term.findMany({
    where: {
      status: 'ACTIVE',
      academicCycle: {
        institutionId: campus.institution.id,
        status: 'ACTIVE'
      }
    },
    include: {
      academicCycle: {
        select: {
          id: true,
          name: true,
          code: true,
          type: true,
          startDate: true,
          endDate: true
        }
      },
      course: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    },
    orderBy: [
      {
        academicCycle: {
          startDate: 'desc'
        }
      },
      {
        startDate: 'desc'
      }
    ]
  });

  // Transform terms data to include academic cycle information
  const formattedTerms = terms.map(term => ({
    id: term.id,
    name: `${term.name} (${term.academicCycle.name})`,
    code: term.code,
    startDate: term.startDate,
    endDate: term.endDate,
    academicCycle: term.academicCycle,
    course: term.course
  }));

  // Log for debugging
  console.log('Institution ID:', campus.institution.id);
  console.log('Terms found:', terms.length);

  // If no terms exist but we have academic cycles, create a default term
  if (terms.length === 0 && academicCycles.length > 0) {
    const currentAcademicCycle = academicCycles[0]; // Use the first active academic cycle
    
    // Get a course to associate with the term
    const courseCampus = await prisma.courseCampus.findFirst({
      where: {
        campusId: params.id,
        status: 'ACTIVE'
      },
      include: {
        course: true
      }
    });

    const defaultCourse = courseCampus?.course;

    if (defaultCourse) {
      const defaultTerm = await prisma.term.create({
        data: {
          code: `${currentAcademicCycle.code}-TERM1`,
          name: `Term 1`,
          description: 'Default term',
          termType: 'SEMESTER',
          termPeriod: 'FALL',
          startDate: currentAcademicCycle.startDate,
          endDate: currentAcademicCycle.endDate,
          status: 'ACTIVE',
          courseId: defaultCourse.id,
          academicCycleId: currentAcademicCycle.id
        },
        include: {
          academicCycle: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
              startDate: true,
              endDate: true
            }
          },
          course: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // Add the newly created term to our terms array
      formattedTerms.push({
        id: defaultTerm.id,
        name: `${defaultTerm.name} (${defaultTerm.academicCycle.name})`,
        code: defaultTerm.code,
        startDate: defaultTerm.startDate,
        endDate: defaultTerm.endDate,
        academicCycle: defaultTerm.academicCycle,
        course: defaultTerm.course
      });

      console.log('Created default term:', defaultTerm);
    }
  }

  // Get available programs for this campus
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

  // Get courses for this campus
  const courseCampuses = await prisma.courseCampus.findMany({
    where: {
      campusId: params.id,
      status: 'ACTIVE',
    },
    include: {
      course: true,
    },
    orderBy: {
      course: {
        name: 'asc',
      },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${params.id}/classes`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`New Class - ${campus.name}`}
          description={`Create a new class for ${campus.code} campus`}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Class</CardTitle>
          <CardDescription>
            Set up a new class for this campus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewClassForm 
            campusId={params.id}
            programCampuses={programCampuses}
            courseCampuses={courseCampuses}
            terms={formattedTerms}
            selectedProgramId={searchParams.programId}
            selectedCourseId={searchParams.courseId}
          />
        </CardContent>
      </Card>
    </div>
  );
} 