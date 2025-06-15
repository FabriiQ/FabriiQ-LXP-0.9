import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { AssessmentGrid } from "@/components/teacher/classes/AssessmentGrid";
import { logger } from "@/server/api/utils/logger";

export const metadata: Metadata = {
  title: "Class Assessments",
  description: "Manage class assessments",
};

export default async function ClassAssessmentsPage({
  params,
}: {
  params: { classId: string };
}) {
  try {
    // Await params to fix the error
    const { classId } = await Promise.resolve(params);

    // Get session with detailed logging
    const session = await getSessionCache();

    logger.debug("ClassAssessmentsPage: Session check", {
      hasSession: !!session,
      userId: session?.user?.id,
      userType: session?.user?.userType
    });

    if (!session?.user?.id) {
      logger.warn("ClassAssessmentsPage: No session, redirecting to login");
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
      teacherProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user || (user.userType !== 'CAMPUS_TEACHER' && user.userType !== 'TEACHER') || !user.teacherProfile) {
    redirect("/login");
  }

  // Get class details
  const classDetails = await prisma.class.findUnique({
    where: {
      id: classId,
    },
    include: {
      term: true,
      courseCampus: {
        include: {
          course: {
            include: {
              subjects: true
            }
          }
        }
      },
      teachers: true,
    },
  });

  if (!classDetails) {
    redirect("/teacher/classes");
  }

  // Check if the teacher is assigned to this class
  const isTeacherAssigned = classDetails.teachers.some(
    (assignment) => assignment.teacherId === user.teacherProfile?.id
  );

  if (!isTeacherAssigned) {
    redirect("/teacher/classes");
  }

  // Get assessments for this class
  const assessments = await prisma.assessment.findMany({
    where: {
      classId: classId,
      status: 'ACTIVE', // Only show active assessments
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  // Log assessment count for debugging
  logger.debug("ClassAssessmentsPage: Found assessments", {
    classId,
    count: assessments.length,
    assessmentIds: assessments.map(a => a.id),
    teacherId: user.teacherProfile?.id
  });

  // Group assessments by status
  const upcomingAssessments = assessments.filter(
    (assessment) => new Date(assessment.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const pastAssessments = assessments.filter(
    (assessment) => new Date(assessment.createdAt) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  return <AssessmentGrid classId={classId} />;
  } catch (error) {
    logger.error("Error in ClassAssessmentsPage:", { error, classId: params.classId });
    throw error; // Let the error boundary handle it
  }
}