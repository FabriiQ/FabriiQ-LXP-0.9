import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageLayout } from "@/components/layout/page-layout";
import { logger } from "@/server/api/utils/logger";
import { UserType } from "@/server/api/constants";
import { CoordinatorAssessmentsClient } from "./components/CoordinatorAssessmentsClient";

export const metadata: Metadata = {
  title: "Class Assessments",
  description: "Manage class assessments",
};

export default async function CoordinatorClassAssessmentsPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    // Check if user is a coordinator
    if (
      session.user.userType !== UserType.CAMPUS_COORDINATOR &&
      session.user.userType !== "COORDINATOR" &&
      session.user.userType !== UserType.SYSTEM_ADMIN
    ) {
      logger.warn("Unauthorized access attempt to coordinator class assessments", {
        userId: session.user.id,
        userType: session.user.userType,
        classId: params.id,
      });
      return redirect("/unauthorized");
    }

    // Get class details
    const classData = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        courseCampus: {
          include: {
            course: true,
            campus: true,
          },
        },
      },
    });

    if (!classData) {
      logger.warn("Class not found", { classId: params.id });
      return redirect("/admin/coordinator/classes");
    }

    // Get assessments for this class
    const assessments = await prisma.assessment.findMany({
      where: {
        classId: params.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return (
      <PageLayout
        title="Class Assessments"
        description={`Manage assessments for ${classData.name}`}
        breadcrumbs={[
          { label: "Classes", href: "/admin/coordinator/classes" },
          { label: classData.name, href: `/admin/coordinator/classes/${params.id}` },
          { label: "Assessments", href: "#" },
        ]}
      >
        <CoordinatorAssessmentsClient
          classId={params.id}
          className={classData.name}
          assessments={assessments}
        />
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in CoordinatorClassAssessmentsPage:", { error });
    return redirect("/error");
  }
}
