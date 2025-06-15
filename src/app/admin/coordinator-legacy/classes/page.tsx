import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType, SystemStatus } from "@prisma/client";
import { logger } from '@/server/api/utils/logger';
import { CoordinatorClassesClient } from "@/components/coordinator/CoordinatorClassesClient";
import { PageLayout } from "@/components/layout/page-layout";

export const metadata: Metadata = {
  title: "Classes Management",
  description: "Manage classes for your coordinated programs",
};

export default async function CoordinatorClassesPage({
  searchParams
}: {
  searchParams: {
    search?: string;
    programId?: string;
    termId?: string;
  }
}) {
  // Ensure searchParams is fully resolved
  const resolvedParams = await Promise.resolve(searchParams);
  try {
    console.log('Coordinator Classes Page - Starting to load');
    const session = await getSessionCache();
    console.log('Coordinator Classes Page - Session:', { userId: session?.user?.id, userType: session?.user?.userType });

    if (!session?.user?.id) {
      redirect("/login");
    }

    // Get user details from database
    console.log('Coordinator Classes Page - Looking up user');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        userType: true,
        primaryCampusId: true,
      },
    });

    if (!user || (user.userType !== UserType.CAMPUS_COORDINATOR && user.userType !== 'COORDINATOR' && user.userType !== UserType.SYSTEM_ADMIN)) {
      redirect("/login");
    }

    // Get coordinator profile
    console.log('Coordinator Classes Page - User found:', { id: user.id, userType: user.userType });
    const coordinatorProfile = await prisma.coordinatorProfile.findUnique({
      where: { userId: user.id }
    });

    // For system admin or if coordinator profile doesn't exist, use a default empty profile
    // This allows system admins to access the page without a coordinator profile
    console.log('Coordinator Classes Page - Coordinator profile:', { exists: !!coordinatorProfile });
    const profile = coordinatorProfile || {
      userId: user.id,
      managedPrograms: []
    };

    // Get managed programs
    const managedPrograms = profile.managedPrograms as any[] || [];
    console.log('Coordinator Classes Page - Managed programs:', { count: managedPrograms.length });

    // For system admin, if no programs are managed, show all programs
    if (managedPrograms.length === 0 && user.userType === UserType.SYSTEM_ADMIN) {
      // Get all programs
      const allPrograms = await prisma.program.findMany({
        where: { status: SystemStatus.ACTIVE },
        select: { id: true }
      });

      // Get all campuses
      const allCampuses = await prisma.campus.findMany({
        where: { status: SystemStatus.ACTIVE },
        select: { id: true }
      });

      // Create managed programs array with all programs and campuses
      allPrograms.forEach(program => {
        allCampuses.forEach(campus => {
          managedPrograms.push({
            programId: program.id,
            campusId: campus.id
          });
        });
      });

      console.log('Coordinator Classes Page - System admin, added all programs:', { count: managedPrograms.length });
    }

    if (managedPrograms.length === 0) {
      return (
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-4">Classes</h1>
          <p className="text-muted-foreground mb-6">You don't have any programs assigned to you yet.</p>
        </div>
      );
    }

    // Get program IDs
    const programIds = [...new Set(managedPrograms.map(p => p.programId))];

    // Get campus IDs
    const campusIds = [...new Set(managedPrograms.map(p => p.campusId))];

    // Get primary campus
    const primaryCampusId = user.primaryCampusId || campusIds[0];

    // Get campus details
    const campus = await prisma.campus.findUnique({
      where: { id: primaryCampusId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
      },
    });

    if (!campus) {
      redirect("/login");
    }

    // Build search condition
    const searchCondition = resolvedParams.search ? {
      OR: [
        { name: { contains: resolvedParams.search, mode: 'insensitive' as const } },
        { code: { contains: resolvedParams.search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Build program filter condition
    const programCondition = resolvedParams.programId ? {
      courseCampus: {
        course: {
          programId: resolvedParams.programId
        }
      }
    } : {};

    // Build term filter condition
    const termCondition = resolvedParams.termId ? {
      termId: resolvedParams.termId
    } : {};

    // Get classes
    const classes = await prisma.class.findMany({
      where: {
        courseCampus: {
          campusId: { in: campusIds },
          course: {
            programId: { in: programIds }
          }
        },
        status: SystemStatus.ACTIVE,
        ...searchCondition,
        ...programCondition,
        ...termCondition
      },
      include: {
        courseCampus: {
          include: {
            course: {
              include: {
                program: true
              }
            },
            campus: true
          }
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
        _count: {
          select: {
            students: true,
            teachers: true,
            activities: true,
            assessments: true,
          }
        }
      },
      orderBy: [
        { term: { startDate: 'desc' } },
        { name: 'asc' }
      ]
    });

    // Get available programs for filtering
    const programCampuses = await prisma.programCampus.findMany({
      where: {
        campusId: { in: campusIds },
        programId: { in: programIds },
        status: SystemStatus.ACTIVE,
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
        status: SystemStatus.ACTIVE
      },
      orderBy: { startDate: 'desc' }
    });

    // Create a clean version of searchParams without _debugInfo
    const cleanSearchParams = {
      search: resolvedParams.search,
      programId: resolvedParams.programId,
      termId: resolvedParams.termId
    };

    return (
      <PageLayout
        title="Class Management"
        description={`Manage classes for your coordinated programs at ${campus.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/coordinator' },
          { label: 'Classes', href: '/admin/coordinator/classes' },
        ]}
      >
        <CoordinatorClassesClient
          initialSearch={cleanSearchParams.search || ''}
          initialProgramId={cleanSearchParams.programId || ''}
          initialTermId={cleanSearchParams.termId || ''}
          campus={campus}
          programCampuses={programCampuses}
          terms={terms}
          classes={classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            code: cls.code,
            courseName: cls.courseCampus?.course?.name || 'Unknown Course',
            campusName: campus.name,
            termName: cls.term?.name || 'Unknown Term',
            studentsCount: cls._count?.students || 0,
            status: cls.status
          }))}
        />
      </PageLayout>
    );
  } catch (error) {
    console.error('Coordinator Classes Page - Error:', error);
    logger.error("Error in CoordinatorClassesPage:", { error });
    return redirect("/error");
  }
}
