import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";

export default async function HomePage() {
  const session = await getSessionCache();

  logger.debug("Home page session", { hasSession: !!session });

  if (!session?.user?.id) {
    logger.debug("No session, redirecting to login");
    redirect("/login");
  }

  const userType = session.user.userType as UserType;
  logger.debug("Home page: User type detected", { userType });

  // Redirect based on user role
  switch (userType) {
    case 'SYSTEM_ADMIN':
      logger.debug("Redirecting to system admin dashboard");
      redirect("/admin/system");
    case 'CAMPUS_ADMIN':
      logger.debug("Redirecting to campus admin dashboard");
      redirect("/admin/campus");
    case 'CAMPUS_COORDINATOR':
    case 'COORDINATOR':
      logger.debug("Redirecting to coordinator dashboard");
      redirect("/admin/coordinator");
    case 'CAMPUS_TEACHER':
    case 'TEACHER':
      logger.debug("Redirecting to teacher dashboard");
      redirect("/teacher/dashboard");
    case 'CAMPUS_STUDENT':
    case 'STUDENT':
      logger.debug("Redirecting to student dashboard");
      redirect("/student/classes"); // Redirect directly to classes instead of dashboard
    case 'CAMPUS_PARENT':
      logger.debug("Redirecting to parent dashboard");
      redirect("/parent/dashboard");
    default:
      logger.warn("Unknown user type, redirecting to unauthorized", { userType });
      redirect("/unauthorized");
  }
}
