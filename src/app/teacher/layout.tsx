import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { TeacherLayoutClient } from "@/components/teacher/layout/TeacherLayoutClient";
import { prisma } from "@/server/db";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      logger.debug("No session found in TeacherLayout, redirecting to login");
      return redirect("/login");
    }

    if (session.user.userType !== UserType.CAMPUS_TEACHER && session.user.userType !== 'TEACHER') {
      logger.warn("Non-teacher attempting to access teacher layout", {
        userType: session.user.userType,
        userId: session.user.id
      });
      return redirect("/unauthorized");
    }

    // Get teacher profile from database
    const user = session.user;

    // Fetch the teacher profile from the database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileData: true,
        teacherProfile: true
      }
    });

    if (!dbUser) {
      logger.error("User not found in database", { userId: user.id });
      return redirect("/login");
    }

    if (!dbUser.teacherProfile) {
      logger.error("Teacher profile not found in database", { userId: user.id });
      return redirect("/unauthorized");
    }

    const teacherId = dbUser.teacherProfile.id;

    return (
      <TeacherLayoutClient
        teacherId={teacherId}
        userName={dbUser.name || "Teacher"}
        userEmail={dbUser.email || ""}
        userImage={undefined}
      >
        {children}
      </TeacherLayoutClient>
    );
  } catch (error) {
    logger.error("Error in TeacherLayout", { error });
    return redirect("/login");
  }
}