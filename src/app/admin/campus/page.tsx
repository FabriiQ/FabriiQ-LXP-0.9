import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { prisma } from "@/server/db";
import { CampusAdminDashboardContent } from "@/components/dashboard/CampusAdminDashboardContent";
import { logger } from '@/server/api/utils/logger';

export const metadata: Metadata = {
  title: "Campus Admin Dashboard",
  description: "Your AIVY LXP Campus Admin Dashboard",
};

export default async function CampusAdminDashboardPage() {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      logger.debug('No session found for campus admin page, redirecting to login');
      return redirect("/login");
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        userType: true,
        primaryCampusId: true,
        activeCampuses: {
          where: { status: 'ACTIVE' },
          select: {
            campusId: true,
            roleType: true
          }
        }
      },
    });

    if (!user) {
      logger.debug('User not found for campus admin page, redirecting to login');
      return redirect("/login");
    }

    // Check if user has appropriate role
    if (user.userType !== "SYSTEM_ADMIN" && user.userType !== "CAMPUS_ADMIN") {
      logger.warn(`User type ${user.userType} not authorized for campus admin page, redirecting to unauthorized`, {
        userId: user.id,
        userType: user.userType
      });
      return redirect("/unauthorized");
    }

    // Determine which campus to show
    let campusId = user.primaryCampusId;
    
    // If CAMPUS_ADMIN has no primary campus but has active campuses, use the first one
    if (!campusId && user.userType === "CAMPUS_ADMIN" && user.activeCampuses.length > 0) {
      campusId = user.activeCampuses[0].campusId;
      
      // Log that we're using an active campus instead of primary
      logger.info(`CAMPUS_ADMIN user has no primary campus, using first active campus instead`, {
        userId: user.id,
        campusId
      });
      
      // Update the user's primary campus in the background
      prisma.user.update({
        where: { id: user.id },
        data: { primaryCampusId: campusId }
      }).catch(err => {
        logger.error("Failed to update primary campus ID:", { error: String(err), userId: user.id });
      });
    }
    
    if (!campusId) {
      logger.warn('No campus ID available for campus admin page, redirecting to unauthorized', {
        userId: user.id,
        userType: user.userType
      });
      return redirect("/unauthorized");
    }

    // Get campus details
    const campus = await prisma.campus.findUnique({
      where: { id: campusId },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
      },
    });

    if (!campus) {
      logger.warn('Campus not found for campus admin page, redirecting to unauthorized', {
        userId: user.id,
        campusId
      });
      return redirect("/unauthorized");
    }

    // Get real metrics for campus admin
    const teacherCount = await prisma.user.count({
      where: { 
        userType: 'CAMPUS_TEACHER',
        activeCampuses: {
          some: {
            campusId: campusId,
            status: 'ACTIVE'
          }
        }
      }
    });

    const studentCount = await prisma.user.count({
      where: { 
        userType: 'CAMPUS_STUDENT',
        activeCampuses: {
          some: {
            campusId: campusId,
            status: 'ACTIVE'
          }
        }
      }
    });

    const classCount = await prisma.class.count({
      where: {
        courseCampus: {
          campusId: campusId
        },
        status: 'ACTIVE'
      }
    });

    const programCount = await prisma.programCampus.count({
      where: {
        campusId: campusId,
        status: 'ACTIVE'
      }
    });

    // Custom metrics for campus admin
    const metrics = {
      teachers: { value: teacherCount, description: "Active teachers" },
      students: { value: studentCount, description: "Enrolled students" },
      classes: { value: classCount, description: "Active classes" },
      programs: { value: programCount, description: "Active programs" },
    };

    logger.debug('User successfully accessed campus admin page', {
      userId: user.id,
      userType: user.userType,
      campusId
    });

    return (
      <RoleDashboard 
        userName={user.name || "Campus Admin"} 
        userType={user.userType}
        metrics={metrics}
      >
        <CampusAdminDashboardContent campusId={campusId} campusName={campus.name} />
      </RoleDashboard>
    );
  } catch (error) {
    logger.error("Error in campus admin page:", { error });
    return redirect("/login");
  }
} 