import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { ClassesGrid } from "@/components/teacher/classes/ClassesGrid";

export const metadata: Metadata = {
  title: "My Classes",
  description: "View and manage your classes",
};

export default async function TeacherClassesPage() {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        userType: true,
        teacherProfile: {
          select: {
            id: true
          }
        }
      }
    });

    if (!user) {
      logger.error("User not found", { userId: session.user.id });
      return redirect("/login");
    }

    if (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER') {
      logger.error("Unauthorized user type", { userType: user.userType });
      return redirect("/unauthorized");
    }

    if (!user.teacherProfile) {
      logger.error("Teacher profile not found", { userId: user.id });
      return redirect("/unauthorized");
    }

    return (
      <ClassesGrid teacherId={user.teacherProfile.id} />
    );
  } catch (error) {
    logger.error("Error in TeacherClassesPage", { error });
    return redirect("/error");
  }
}