import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { logger } from "@/server/api/utils/logger";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampusAdminClassLeaderboardClient } from "./client";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ClassLeaderboardPage({ params }: PageProps) {
  const id = params.id;
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        userType: true,
        primaryCampusId: true,
      },
    });

    if (!user || user.userType !== 'CAMPUS_ADMIN' || !user.primaryCampusId) {
      redirect("/unauthorized");
    }

    const classData = await prisma.class.findUnique({
      where: {
        id,
        campusId: user.primaryCampusId,
      },
      include: {
        courseCampus: {
          include: {
            course: true,
            campus: true,
          }
        },
      },
    });

    if (!classData) {
      logger.warn("Class not found", {
        classId: id,
        campusId: user.primaryCampusId
      });
      notFound();
    }

    return (
      <PageLayout
        title={`Leaderboard: ${classData.name}`}
        description="Student rankings and performance metrics"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: classData.name, href: `/admin/campus/classes/${id}` },
          { label: 'Leaderboard', href: '#' },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/campus/classes/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
        }
      >
        <div className="space-y-6">
          <CampusAdminClassLeaderboardClient
            classId={id}
            courseId={classData.courseCampus.courseId}
            campusId={classData.courseCampus.campusId}
            className={classData.name}
            courseName={classData.courseCampus.course.name}
            campusName={classData.courseCampus.campus.name}
          />
        </div>
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in class leaderboard page:", {
      error,
      classId: id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
