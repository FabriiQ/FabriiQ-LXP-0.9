import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { TeacherCampusLeaderboardClient } from "./client";

export const metadata: Metadata = {
  title: "Campus Leaderboard",
  description: "View student rankings and performance metrics across the campus",
};

export default async function CampusLeaderboardPage() {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        activeCampuses: {
          where: { status: "ACTIVE" },
          include: {
            campus: true,
          },
        },
      },
    });

    if (!user || (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== UserType.CAMPUS_ADMIN && user.userType !== 'TEACHER')) {
      logger.error("Unauthorized access attempt", {
        userId: session.user.id,
        userType: user?.userType,
      });
      return redirect("/unauthorized");
    }

    // Get the user's active campus
    const activeCampus = user.activeCampuses[0];

    if (!activeCampus) {
      logger.error("User has no active campus", { userId: user.id });
      return redirect("/teacher/dashboard");
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/teacher/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title={`Campus Leaderboard: ${activeCampus.campus.name}`}
          description="Student rankings and performance metrics across the campus"
        />

        <TeacherCampusLeaderboardClient
          campusId={activeCampus.campusId}
          campusName={activeCampus.campus.name}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in CampusLeaderboardPage", { error });
    return redirect("/error");
  }
}
