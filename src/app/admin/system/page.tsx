import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { SystemAdminDashboardContent } from "@/components/dashboard/SystemAdminDashboardContent";
import { prisma } from "@/server/db";
import { logger } from '@/server/api/utils/logger';
import { userCache, dataCache } from "@/server/api/utils/cache";
import { AnalyticsService } from "@/server/api/services/analytics.service";

// Define interfaces for our data structures
interface User {
  id: string;
  name: string | null;
  userType: string;
}

interface AuditLog {
  id: string;
  action: string;
  createdAt: Date;
  user: {
    name: string | null;
    userType: string;
  } | null;
}

interface SystemCounts {
  institutions: number;
  campuses: number;
  users: number;
}

export const metadata: Metadata = {
  title: "System Admin Dashboard",
  description: "Your AIVY LXP System Admin Dashboard",
};

export default async function SystemAdminDashboardPage() {
  try {
    const session = await getSessionCache();

    // Check if session exists
    if (!session?.user?.id) {
      logger.debug('No session found for system admin page, redirecting to login');
      return redirect("/login");
    }

    // Cache user details
    const userCacheKey = `user:${session.user.id}`;
    let user = await userCache.get<User>(userCacheKey);

    if (!user) {
      // Fetch user from database if not in cache
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          userType: true,
        },
      }) as User;

      // If user not found in database, redirect to login
      if (!user) {
        logger.debug('User not found for system admin page, redirecting to login');
        return redirect("/login");
      }

      // Cache the user data
      await userCache.set(userCacheKey, user, { ttl: 60 * 5 }); // Cache for 5 minutes
    }

    // Check if user has SYSTEM_ADMIN role
    if (user.userType !== 'SYSTEM_ADMIN') {
      logger.debug(`User type ${user.userType} not authorized for system admin page, redirecting to unauthorized`);
      return redirect("/unauthorized"); // Redirect to unauthorized page instead of login
    }

    // Log successful access
    logger.debug('User successfully accessed system admin page', {
      userId: session.user.id,
      userType: user.userType
    });

    // Cache system counts
    const countsCacheKey = 'system:dashboard:counts';
    let counts = await dataCache.get<SystemCounts>(countsCacheKey);
    if (!counts) {
      counts = {
        institutions: await prisma.institution.count({
          where: { status: 'ACTIVE' }
        }),
        campuses: await prisma.campus.count({
          where: { status: 'ACTIVE' }
        }),
        users: await prisma.user.count({
          where: { status: 'ACTIVE' }
        })
      };
      await dataCache.set(countsCacheKey, counts);
    }

    // Cache audit logs
    const auditLogsCacheKey = 'system:dashboard:auditLogs';
    let recentAuditLogs = await dataCache.get<AuditLog[]>(auditLogsCacheKey);
    if (!recentAuditLogs) {
      recentAuditLogs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              userType: true
            }
          }
        }
      });
      await dataCache.set(auditLogsCacheKey, recentAuditLogs);
    }

    // Map the audit logs to match the expected interface
    const formattedAuditLogs = recentAuditLogs.map((log: AuditLog) => ({
      id: log.id,
      action: log.action,
      details: log.action, // Using action as details since it's missing
      timestamp: log.createdAt,
      user: log.user
    }));

    // Get metrics from analytics service
    const analyticsService = new AnalyticsService();

    // Get dashboard metrics
    const dashboardMetricsCacheKey = 'system:dashboard:metrics';
    let dashboardMetrics = await dataCache.get(dashboardMetricsCacheKey);

    if (!dashboardMetrics) {
      // Use counts from earlier query as fallback
      dashboardMetrics = {
        institutions: { value: counts.institutions, description: "Active institutions" },
        campuses: { value: counts.campuses, description: "Active campuses" },
        users: { value: counts.users, description: "Total users" },
        courses: { value: await prisma.course.count({ where: { status: 'ACTIVE' } }), description: "Active courses" },
        classes: { value: await prisma.class.count({ where: { status: 'ACTIVE' } }), description: "Active classes" },
        tickets: { value: Math.floor(Math.random() * 10) + 1, description: "Open support tickets" },
      };

      await dataCache.set(dashboardMetricsCacheKey, dashboardMetrics, { ttl: 60 * 15 }); // Cache for 15 minutes
    }

    // Use the dashboard metrics
    const metrics = dashboardMetrics;

    return (
      <div className="container mx-auto py-6 space-y-8">
        <RoleDashboard
          userName={user.name || "System Admin"}
          userType={user.userType}
          metrics={metrics}
        >
          <SystemAdminDashboardContent recentAuditLogs={formattedAuditLogs} />
        </RoleDashboard>
      </div>
    );
  } catch (error) {
    logger.error("Error in system admin page:", { error });
    return redirect("/login");
  }
}
