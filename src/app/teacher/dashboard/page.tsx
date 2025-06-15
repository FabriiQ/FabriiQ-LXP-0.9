import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { SystemStatus, UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { TeacherDashboardContent } from "@/components/dashboard/TeacherDashboardContent";
import { PageHeader } from "@/components/ui/page-header";
import TeacherMetrics from "@/components/teacher/dashboard/TeacherMetrics";


export default async function TeacherDashboardPage() {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        userType: true,
        primaryCampusId: true,
        teacherProfile: {
          select: {
            id: true,
            assignments: {
              where: { status: "ACTIVE" as SystemStatus },
              select: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    students: {
                      select: { id: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      logger.error("User not found", { userId: session.user.id });
      return redirect("/login");
    }

    if (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER') {
      logger.error("Unauthorized user type", { userType: user.userType });
      return redirect("/unauthorized");
    }

    if (!user.primaryCampusId) {
      logger.warn("Teacher has no primary campus assigned", { userId: user.id });
      return (
        <div className="container mx-auto p-6">
          <PageHeader
            title="Welcome"
            description="Please contact your administrator to assign you to a campus."
          />
        </div>
      );
    }

    const activeClasses = user.teacherProfile?.assignments.map(assignment => ({
      id: assignment.class.id,
      name: assignment.class.name,
      students: assignment.class.students
    })) || [];

    const totalStudents = activeClasses.reduce((sum, cls) =>
      sum + cls.students.length, 0
    );

    // Get campus name
    const campus = await prisma.campus.findUnique({
      where: { id: user.primaryCampusId },
      select: { name: true }
    });

    const campusName = campus?.name || "Campus";

    // Custom metrics for teacher
    const metrics = {
      classes: { value: activeClasses.length, description: "Active classes" },
      students: { value: totalStudents, description: "Total students" },
      attendance: { value: "95%", description: "Avg. attendance" },
      assessments: { value: 5, description: "Pending assessments" },
    };

    // Check if teacherProfile exists
    if (!user.teacherProfile) {
      logger.error("Teacher profile not found", { userId: user.id });
      throw new Error("Teacher profile not found");
    }

    return (
      <div className="space-y-6">
        <TeacherMetrics teacherId={user.teacherProfile.id} />
        <TeacherDashboardContent
          campusId={user.primaryCampusId}
          campusName={campusName}
          teacherId={user.teacherProfile.id}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in teacher dashboard", { error });
    throw error; // Let the error boundary handle it
  }
}
