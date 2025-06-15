import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { TeacherSubjectLeaderboardClient } from "./client";

export const metadata: Metadata = {
  title: "Subject Leaderboard",
  description: "View student rankings and performance metrics for this subject",
};

interface PageProps {
  params: {
    subjectId: string;
  };
}

export default async function SubjectLeaderboardPage({ params }: PageProps) {
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

    // Get subject details
    const subject = await prisma.subject.findUnique({
      where: { id: params.subjectId },
    });

    if (!subject) {
      logger.error("Subject not found", { subjectId: params.subjectId });
      return redirect("/teacher/subjects");
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: subject.courseId },
    });

    if (!course) {
      logger.error("Course not found for subject", { subjectId: params.subjectId, courseId: subject.courseId });
      return redirect("/teacher/subjects");
    }

    // Get campus details through CourseCampus
    const courseCampus = await prisma.courseCampus.findFirst({
      where: { courseId: subject.courseId },
      include: {
        campus: true,
      },
    });

    if (!courseCampus) {
      logger.error("Course campus not found for subject", { subjectId: params.subjectId, courseId: subject.courseId });
      return redirect("/teacher/subjects");
    }

    // Get campus ID from the course campus
    const campusId = courseCampus.campusId;
    const campusName = courseCampus.campus.name;

    return (
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/teacher/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/teacher/subjects">Subjects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/teacher/subjects/${params.subjectId}`}>
                {subject.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <PageHeader
          title={`Leaderboard: ${subject.name}`}
          description="Student rankings and performance metrics for this subject"
        />

        <TeacherSubjectLeaderboardClient
          subjectId={params.subjectId}
          campusId={campusId}
          subjectName={subject.name}
          campusName={campusName}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in SubjectLeaderboardPage", { error });
    return redirect("/error");
  }
}
