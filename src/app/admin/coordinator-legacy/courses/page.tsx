import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType, SystemStatus } from "@prisma/client";
import { logger } from '@/server/api/utils/logger';
import { CampusCoursesContent } from "@/components/admin/campus/CampusCoursesContent";

export const metadata: Metadata = {
  title: "Courses Management",
  description: "Manage courses for your coordinated programs",
};

export default async function CoordinatorCoursesPage({
  searchParams
}: {
  searchParams: {
    search?: string;
    programId?: string;
    level?: string;
  }
}) {
  // Ensure searchParams is fully resolved
  const resolvedParams = await Promise.resolve(searchParams);
  try {
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
        primaryCampusId: true,
      },
    });

    logger.debug("Coordinator Courses Page - User found:", { userId: user?.id, userType: user?.userType });

    if (!user || user.userType !== UserType.CAMPUS_COORDINATOR) {
      redirect("/login");
    }

    // Get coordinator profile
    const coordinatorProfile = await prisma.coordinatorProfile.findUnique({
      where: { userId: user.id }
    });

    if (!coordinatorProfile) {
      redirect("/login");
    }

    // Get managed programs
    const managedPrograms = coordinatorProfile.managedPrograms as any[];

    if (managedPrograms.length === 0) {
      return (
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-4">Courses</h1>
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
        { code: { contains: resolvedParams.search, mode: 'insensitive' as const } },
        { description: { contains: resolvedParams.search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Build program filter condition
    const programCondition = resolvedParams.programId ? {
      programId: resolvedParams.programId
    } : {};

    // Build level filter condition
    const levelCondition = resolvedParams.level ? {
      level: parseInt(resolvedParams.level)
    } : {};

    // Get courses
    const courses = await prisma.course.findMany({
      where: {
        programId: { in: programIds },
        status: SystemStatus.ACTIVE,
        ...searchCondition,
        ...programCondition,
        ...levelCondition
      },
      include: {
        program: true,
        campusOfferings: {
          where: {
            campusId: { in: campusIds },
            status: SystemStatus.ACTIVE
          },
          include: {
            campus: true,
            _count: {
              select: {
                classes: true
              }
            }
          }
        },
        _count: {
          select: {
            subjects: true
          }
        }
      },
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get available programs for filtering
    const programs = await prisma.program.findMany({
      where: {
        id: { in: programIds },
        status: SystemStatus.ACTIVE
      },
      orderBy: { name: 'asc' }
    });

    // Get available levels for filtering
    const levels = [...new Set(courses.map(c => c.level))].sort((a, b) => a - b);

    // Create a clean version of searchParams without _debugInfo
    const cleanSearchParams = {
      search: resolvedParams.search,
      programId: resolvedParams.programId,
      level: resolvedParams.level
    };

    return (
      <CampusCoursesContent
        campus={campus}
        courses={courses}
        programs={programs}
        levels={levels}
        searchParams={cleanSearchParams}
        isCoordinator={true}
      />
    );
  } catch (error) {
    logger.error("Error in CoordinatorCoursesPage:", { error });
    return redirect("/error");
  }
}
