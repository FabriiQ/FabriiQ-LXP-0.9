import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ClassLeaderboardClient } from "./client";

export const metadata: Metadata = {
  title: "Class Leaderboard",
  description: "View student rankings and performance metrics",
};

interface PageProps {
  params: {
    classId: string;
  };
}

export default async function ClassLeaderboardPage({ params }: PageProps) {
  const { classId } = params;
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        teacherProfile: true,
      },
    });

    if (!user || (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== UserType.CAMPUS_ADMIN && user.userType !== 'TEACHER')) {
      logger.error("Unauthorized access attempt", {
        userId: session.user.id,
        userType: user?.userType,
      });
      return redirect("/unauthorized");
    }

    // Get class details
    const classEntity = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        courseCampus: {
          include: {
            course: true,
            campus: true,
          },
        },
      },
    });

    if (!classEntity) {
      logger.error("Class not found", { classId });
      return redirect("/teacher/classes");
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
              <BreadcrumbLink href="/teacher/classes">Classes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/teacher/classes/${classId}`}>
                {classEntity.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title={`Leaderboard: ${classEntity.name}`}
          description="Student rankings and performance metrics"
        />

        <ClassLeaderboardClient
          classId={classId}
          className={classEntity.name}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in ClassLeaderboardPage", { error });
    return redirect("/error");
  }
}
