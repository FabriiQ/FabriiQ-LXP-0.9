import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CoordinatorClassLeaderboardClient } from "./client";

export const metadata: Metadata = {
  title: "Class Leaderboard",
  description: "View student rankings and performance metrics for this class",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CoordinatorClassLeaderboardPage({ params }: PageProps) {
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

    logger.debug("Coordinator Class Leaderboard Page - User found:", { userId: user?.id, userType: user?.userType });

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

    // Get class details
    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        courseCampus: {
          include: {
            course: true,
            campus: true
          }
        }
      }
    });

    if (!classData) {
      redirect("/admin/coordinator/classes");
    }

    // Check if coordinator has access to this class's program
    const managedPrograms = coordinatorProfile.managedPrograms as any[];
    const programIds = managedPrograms.map(p => p.programId);

    const courseProgram = await prisma.course.findUnique({
      where: { id: classData.courseCampus.courseId },
      select: { programId: true }
    });

    if (!courseProgram || !programIds.includes(courseProgram.programId)) {
      redirect("/admin/coordinator/classes");
    }

    return (
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/coordinator/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/coordinator/classes">Classes</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/coordinator/classes/${params.id}`}>{classData.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <PageHeader
            title={`Class Leaderboard: ${classData.name}`}
            description="Student rankings and performance metrics for this class"
          />
          <Button asChild variant="outline">
            <Link href={`/admin/coordinator/classes/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
        </div>

        <CoordinatorClassLeaderboardClient
          classId={params.id}
          courseId={classData.courseCampus.courseId}
          campusId={classData.courseCampus.campusId}
          className={classData.name}
          courseName={classData.courseCampus.course.name}
          campusName={classData.courseCampus.campus.name}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in CoordinatorClassLeaderboardPage", { error });
    return redirect("/error");
  }
}
