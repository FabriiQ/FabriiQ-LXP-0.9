import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType } from "@prisma/client";
import { logger } from '@/server/api/utils/logger';
import { CampusAssessmentsContent } from "@/components/admin/campus/CampusAssessmentsContent";

export const metadata: Metadata = {
  title: "Assessment Management",
  description: "Manage assessments for your coordinated programs",
};

export default async function CoordinatorAssessmentsPage({
  searchParams
}: {
  searchParams: {
    search?: string;
    classId?: string;
    subjectId?: string;
  }
}) {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      redirect("/login");
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        userType: true,
        primaryCampusId: true,
      },
    });

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
          <h1 className="text-2xl font-bold mb-4">Assessments</h1>
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

    // Get classes for this coordinator
    const classes = await prisma.class.findMany({
      where: {
        courseCampus: {
          campusId: { in: campusIds },
          course: {
            programId: { in: programIds }
          }
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        code: true,
        courseCampus: {
          select: {
            course: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Get subjects for this coordinator
    const subjects = await prisma.subject.findMany({
      where: {
        course: {
          programId: { in: programIds }
        },
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        code: true,
        course: {
          select: {
            name: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Create a clean version of searchParams without _debugInfo
    const cleanSearchParams = {
      search: searchParams.search,
      classId: searchparams.id,
      subjectId: searchParams.subjectId
    };

    return (
      <CampusAssessmentsContent
        campus={campus}
        classes={classes}
        subjects={subjects}
        searchParams={cleanSearchParams}
        isCoordinator={true}
      />
    );
  } catch (error) {
    logger.error("Error in CoordinatorAssessmentsPage:", { error });
    return redirect("/error");
  }
}

