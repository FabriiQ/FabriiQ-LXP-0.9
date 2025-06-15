import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType } from "@prisma/client";
import { logger } from '@/server/api/utils/logger';
import { PageLayout } from "@/components/layout/page-layout";
import { CoordinatorStudentsClient } from "@/components/coordinator";

export const metadata: Metadata = {
  title: "Student Management",
  description: "Manage students for your coordinated programs",
};

export default async function CoordinatorStudentsPage({
  searchParams
}: {
  searchParams: {
    search?: string;
    programId?: string;
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

    logger.debug("Coordinator Students Page - User found:", { userId: user?.id, userType: user?.userType });

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
        <PageLayout
          title="Student Management"
          description="Manage students for your coordinated programs"
        >
          <div className="container mx-auto py-6">
            <p className="text-muted-foreground mb-6">You don't have any programs assigned to you yet.</p>
          </div>
        </PageLayout>
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

    // Get available programs for filtering
    const programCampuses = await prisma.programCampus.findMany({
      where: {
        campusId: { in: campusIds },
        programId: { in: programIds },
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

    return (
      <PageLayout
        title="Student Management"
        description={`Manage students for your coordinated programs at ${campus.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/coordinator" },
          { label: "Students", href: "/admin/coordinator/students" },
        ]}
      >
        <CoordinatorStudentsClient
          initialSearch={resolvedParams.search || ""}
          initialProgramId={resolvedParams.programId || ""}
          campus={campus}
          programCampuses={programCampuses}
        />
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in CoordinatorStudentsPage:", { error });
    return redirect("/error");
  }
}
