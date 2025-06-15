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
import { CoordinatorCourseLeaderboardClient } from "./client";

export const metadata: Metadata = {
  title: "Course Leaderboard",
  description: "View student rankings and performance metrics for this course",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CoordinatorCourseLeaderboardPage({ params }: PageProps) {
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

    logger.debug("Coordinator Course Leaderboard Page - User found:", { userId: user?.id, userType: user?.userType });

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

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        campusOfferings: {
          include: {
            campus: true
          }
        }
      }
    });

    if (!course) {
      redirect("/admin/coordinator/courses");
    }

    // Check if coordinator has access to this course
    const managedPrograms = coordinatorProfile.managedPrograms as any[];
    const programIds = managedPrograms.map(p => p.programId);

    const courseProgram = await prisma.course.findUnique({
      where: { id: params.id },
      select: { programId: true }
    });

    if (!courseProgram || !programIds.includes(courseProgram.programId)) {
      redirect("/admin/coordinator/courses");
    }

    // Get campus ID (use primary campus if available)
    const campusId = user.primaryCampusId || course.campusOfferings[0]?.campusId;
    const campusName = course.campusOfferings.find(co => co.campusId === campusId)?.campus.name || "Campus";

    if (!campusId) {
      redirect("/admin/coordinator/courses");
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
              <BreadcrumbLink href="/admin/coordinator/courses">Courses</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/admin/coordinator/courses/${params.id}`}>{course.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <PageHeader
            title={`Course Leaderboard: ${course.name}`}
            description="Student rankings and performance metrics for this course"
          />
          <Button asChild variant="outline">
            <Link href={`/admin/coordinator/courses/${params.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Link>
          </Button>
        </div>

        <CoordinatorCourseLeaderboardClient
          courseId={params.id}
          campusId={campusId}
          courseName={course.name}
          campusName={campusName}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in CoordinatorCourseLeaderboardPage", { error });
    return redirect("/error");
  }
}
