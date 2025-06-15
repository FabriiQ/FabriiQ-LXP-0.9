import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { TeacherCourseLeaderboardClient } from "./client";

export const metadata: Metadata = {
  title: "Course Leaderboard",
  description: "View student rankings and performance metrics for this course",
};

interface PageProps {
  params: {
    courseId: string;
  };
}

export default async function CourseLeaderboardPage({ params }: PageProps) {
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

    if (!user || (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== UserType.CAMPUS_ADMIN)) {
      logger.error("Unauthorized access attempt", {
        userId: session.user.id,
        userType: user?.userType,
      });
      return redirect("/unauthorized");
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        courseCampuses: {
          take: 1,
          include: {
            campus: true,
          },
        },
      },
    });

    if (!course) {
      logger.error("Course not found", { courseId: params.courseId });
      return redirect("/teacher/courses");
    }

    // Get campus ID from the first course campus
    const campusId = course.courseCampuses[0]?.campusId || "";
    const campusName = course.courseCampuses[0]?.campus?.name || "";

    return (
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/teacher/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/teacher/courses">Courses</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/teacher/courses/${params.courseId}`}>
                {course.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title={`Leaderboard: ${course.name}`}
          description="Student rankings and performance metrics for this course"
        />

        <TeacherCourseLeaderboardClient
          courseId={params.courseId}
          campusId={campusId}
          courseName={course.name}
          campusName={campusName}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in CourseLeaderboardPage", { error });
    return redirect("/error");
  }
}
