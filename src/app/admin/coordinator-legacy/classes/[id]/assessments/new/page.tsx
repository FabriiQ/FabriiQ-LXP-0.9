import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageLayout } from "@/components/layout/page-layout";
import { logger } from "@/server/api/utils/logger";
import { UserType } from "@/server/api/constants";
import { AssessmentForm } from "@/components/assessments/AssessmentForm";

export const metadata: Metadata = {
  title: "Create Assessment",
  description: "Create a new assessment for the class",
};

export default async function CoordinatorCreateAssessmentPage({
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
      logger.warn("Unauthorized access attempt to coordinator create assessment", {
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

    // Get coordinator's teacher profile
    const coordinatorTeacherProfile = await prisma.teacherProfile.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
      },
    });

    if (!coordinatorTeacherProfile) {
      logger.warn("Coordinator teacher profile not found", { userId: session.user.id });
      // We'll continue without a teacher profile, but log the issue
    }

    return (
      <PageLayout
        title="Create Assessment"
        description={`Create a new assessment for ${classData.name}`}
        breadcrumbs={[
          { label: "Classes", href: "/admin/coordinator/classes" },
          { label: classData.name, href: `/admin/coordinator/classes/${params.id}` },
          { label: "Assessments", href: `/admin/coordinator/classes/${params.id}/assessments` },
          { label: "Create", href: "#" },
        ]}
      >
        <AssessmentForm
          classId={params.id}
          className={classData.name}
          teacherId={coordinatorTeacherProfile?.id}
          redirectPath={`/admin/coordinator/classes/${params.id}/assessments`}
        />
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in CoordinatorCreateAssessmentPage:", { error });
    return redirect("/error");
  }
}
