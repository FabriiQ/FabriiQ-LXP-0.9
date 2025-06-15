import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { prisma } from "@/server/db";
import { CoordinatorDashboardContent } from "@/components/dashboard/CoordinatorDashboardContent";
import { logger } from '@/server/api/utils/logger';
import { SimpleNotificationCenter } from "@/components/coordinator/SimpleNotificationCenter";
import { UserType } from "@prisma/client";

export const metadata: Metadata = {
  title: "Coordinator Dashboard",
  description: "Your AIVY LXP Coordinator Dashboard",
};

export default async function CoordinatorDashboardPage() {
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

  logger.debug("Coordinator Dashboard Page - User found:", { userId: user?.id, userType: user?.userType });

  if (!user || (user.userType !== 'CAMPUS_COORDINATOR' && user.userType !== 'COORDINATOR')) {
    redirect("/login");
  }

  // Get coordinator profile
  const coordinatorProfile = await prisma.coordinatorProfile.findUnique({
    where: { userId: user.id }
  });

  // Get managed programs count
  const managedProgramsCount = coordinatorProfile ?
    (coordinatorProfile.managedPrograms as any[]).length : 0;

  // Get classes count for programs managed by this coordinator
  let classesCount = 0;
  let teachersCount = 0;
  let studentsCount = 0;

  if (coordinatorProfile && managedProgramsCount > 0) {
    // Get program IDs and campus IDs from managed programs
    const managedPrograms = coordinatorProfile.managedPrograms as any[];
    const programCampusPairs = managedPrograms.map(p => ({
      programId: p.programId,
      campusId: p.campusId
    }));

    // Get program campus IDs
    const programCampuses = await prisma.programCampus.findMany({
      where: {
        OR: programCampusPairs.map(pair => ({
          programId: pair.programId,
          campusId: pair.campusId
        }))
      },
      select: { id: true }
    });

    const programCampusIds = programCampuses.map(pc => pc.id);

    // Count classes
    if (programCampusIds.length > 0) {
      classesCount = await prisma.class.count({
        where: {
          programCampusId: { in: programCampusIds },
          status: 'ACTIVE'
        }
      });

      // Count teachers assigned to these classes
      const teacherIds = await prisma.class.findMany({
        where: {
          programCampusId: { in: programCampusIds },
          status: 'ACTIVE'
        },
        select: { classTeacherId: true },
        distinct: ['classTeacherId']
      });

      teachersCount = teacherIds.filter(t => t.classTeacherId !== null).length;

      // Count students enrolled in these programs
      studentsCount = await prisma.studentEnrollment.count({
        where: {
          class: {
            programCampusId: { in: programCampusIds }
          },
          status: 'ACTIVE'
        }
      });
    }
  }

  // Custom metrics for coordinator
  const metrics = {
    programs: { value: managedProgramsCount, description: "Managed programs" },
    classes: { value: classesCount, description: "Active classes" },
    teachers: { value: teachersCount, description: "Assigned teachers" },
    students: { value: studentsCount, description: "Enrolled students" },
  };

  // Get primary campus
  let primaryCampusId = user.primaryCampusId;
  let campusName = "Your Campus";

  if (coordinatorProfile && managedProgramsCount > 0) {
    // Get campus IDs from managed programs
    const managedPrograms = coordinatorProfile.managedPrograms as any[];
    const campusIds = [...new Set(managedPrograms.map(p => p.campusId))];

    // If user doesn't have a primary campus, use the first one from managed programs
    if (!primaryCampusId && campusIds.length > 0) {
      primaryCampusId = campusIds[0];
    }

    // Get campus name
    if (primaryCampusId) {
      const campus = await prisma.campus.findUnique({
        where: { id: primaryCampusId },
        select: { name: true }
      });

      if (campus) {
        campusName = campus.name;
      }
    }
  }

  logger.debug('User successfully accessed coordinator dashboard', {
    userId: user.id,
    userType: user.userType,
    campusId: primaryCampusId
  });

  return (
    <div>
      <RoleDashboard
        userName={user.name || "Coordinator"}
        userType={user.userType}
        metrics={metrics}
      >
        {primaryCampusId ? (
          <CoordinatorDashboardContent campusId={primaryCampusId} campusName={campusName} />
        ) : (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user.name}</h2>
            <p className="text-muted-foreground mb-6">You don't have any campuses assigned to you yet.</p>
          </div>
        )}

        <div className="mt-6">
          <SimpleNotificationCenter />
        </div>
      </RoleDashboard>
    </div>
  );
}
