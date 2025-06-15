import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageLayout } from "@/components/layout/page-layout";
import { TeacherProfileView } from "@/components/coordinator/TeacherProfileView";
import { logger } from "@/server/api/utils/logger";
import { UserType } from "@/server/api/constants";

export const metadata: Metadata = {
  title: "Teacher Profile",
  description: "View teacher profile and performance",
};

export default async function CoordinatorTeacherProfilePage({
  params,
}: {
  params: { id: string };
}) {
  // Await params to ensure it's fully resolved
  const { id } = params;
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
      logger.warn("Unauthorized access attempt to coordinator teacher profile", {
        userId: session.user.id,
        userType: session.user.userType,
        teacherId: id,
      });
      return redirect("/unauthorized");
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            status: true,
            userType: true,
          },
        },
        subjectQualifications: {
          include: {
            subject: true,
          },
        },
        assignments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            class: {
              include: {
                courseCampus: {
                  include: {
                    course: true,
                    campus: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      logger.warn("Teacher not found", { teacherId: id });
      return redirect("/admin/coordinator/classes");
    }

    // Get teacher feedback
    const feedback = await prisma.teacherFeedback.findMany({
      where: {
        teacherId: id,
        feedbackBase: {
          status: "ACTIVE",
        },
      },
      include: {
        feedbackBase: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        responses: {
          include: {
            responder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        feedbackBase: {
          createdAt: "desc",
        },
      },
    });

    return (
      <PageLayout
        title={teacher.user?.name || "Teacher Profile"}
        description="Teacher profile and performance analytics"
        breadcrumbs={[
          { label: "Classes", href: "/admin/coordinator/classes" },
          { label: teacher.user?.name || "Teacher", href: "#" },
        ]}
      >
        <TeacherProfileView
          teacher={teacher}
          feedback={feedback}
        />
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in CoordinatorTeacherProfilePage:", { error });
    return redirect("/error");
  }
}
