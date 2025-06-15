import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";
import { getSessionCache } from "@/utils/session-cache";
import { logger } from "@/server/api/utils/logger";

/**
 * This page will redirect to the appropriate role-based dashboard
 * It serves as a fallback in case someone navigates directly to /dashboard
 */
export default async function DashboardPage() {
  let session = await getSessionCache();

  // Add detailed logging to debug session
  logger.debug("Dashboard page session", {
    hasSession: !!session,
    sessionData: session ? {
      userId: session.user?.id,
      username: session.user?.username,
      userType: session.user?.userType
    } : null
  });

  // IMPORTANT: The dashboard page is the central hub for redirecting users to their role-specific dashboards
  // This is especially important for login redirects, where the session might not be available yet in the NextAuth redirect callback

  // If there's no session, wait a moment and try again
  // This is a workaround for the case where the session is not available yet
  if (!session) {
    logger.debug("No session, waiting a moment and trying again");

    // Wait a moment and try again
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to get the session again
    const retrySession = await getSessionCache();

    if (retrySession) {
      logger.debug("Got session on retry", {
        userId: retrySession.user?.id,
        username: retrySession.user?.username,
        userType: retrySession.user?.userType
      });

      // Use the retry session
      session = retrySession;
    } else {
      // If we still don't have a session, redirect to login
      logger.debug("No session after retry, redirecting to login");
      redirect("/login");
    }
  }

  if (!session.user) {
    logger.debug("Session exists but no user data, redirecting to login");
    redirect("/login");
  }

  // Get user type from session
  const userType = session.user.userType as UserType;
  logger.debug("Dashboard page: User type detected", { userType });

  // Redirect based on user role - no break statements needed as redirect() throws an error
  switch (userType) {
    case 'SYSTEM_ADMIN':
      logger.debug("Redirecting user to role-based dashboard", { userType, target: "/admin/system" });
      redirect("/admin/system");
    case 'CAMPUS_ADMIN':
      logger.debug("Redirecting user to role-based dashboard", { userType, target: "/admin/campus" });
      redirect("/admin/campus");
    case 'CAMPUS_COORDINATOR':
    case 'COORDINATOR':
      logger.debug("Redirecting user to role-based dashboard", { userType, target: "/admin/coordinator" });
      redirect("/admin/coordinator");
    case 'CAMPUS_TEACHER':
    case 'TEACHER':
      logger.debug("Redirecting user to role-based dashboard", { userType, target: "/teacher/dashboard" });
      redirect("/teacher/dashboard");
    case 'CAMPUS_STUDENT':
      logger.debug("Redirecting user to role-based dashboard", { userType, target: "/student/classes" });
      redirect("/student/classes");
    case 'STUDENT': // Add special case for STUDENT without CAMPUS_ prefix
      logger.debug("Redirecting STUDENT user to student dashboard", { userType, target: "/student/classes" });
      redirect("/student/classes");
    case 'CAMPUS_PARENT':
      logger.debug("Redirecting user to role-based dashboard", { userType, target: "/parent/dashboard" });
      redirect("/parent/dashboard");
    default:
      logger.debug("Unknown user type, showing generic dashboard", { userType });
  }

  // This is just a fallback dashboard that should only be shown if the redirect fails
  // or if the user type doesn't match any of the above cases
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Welcome, {session.user.name || session.user.username}!</h2>
          <p className="text-gray-600">You are logged in as: <span className="font-medium">{userType}</span></p>
          <p className="mt-4 text-amber-600">Redirecting you to the appropriate dashboard...</p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Your Account</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium">{session.user.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium">{session.user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{userType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}