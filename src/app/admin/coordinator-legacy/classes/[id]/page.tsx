import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { UserType } from "@prisma/client";
import { logger } from '@/server/api/utils/logger';
import { PageLayout } from "@/components/layout/page-layout";
import { CoordinatorClassViewClient } from "@/components/coordinator/CoordinatorClassViewClient";

export const metadata: Metadata = {
  title: "Class Details",
  description: "View and manage class details",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CoordinatorClassDetailPage({ params }: PageProps) {
  // Ensure params is fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;
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

    logger.debug("Coordinator Class Detail Page - User found:", { userId: user?.id, userType: user?.userType });

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

    const classId = id;

    // Get class details
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        courseCampus: {
          include: {
            course: true,
            campus: true
          }
        },
        term: true,
        students: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            assessments: true,
            activities: true
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

    // Get assigned teachers
    const assignedTeachers = await prisma.teacherAssignment.findMany({
      where: { classId },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    // Find primary teacher
    const primaryTeacher = assignedTeachers.find((t: any) => t.isPrimary);
    const primaryTeacherName = primaryTeacher?.teacher?.user?.name || "Not assigned";

    // Get assessments count
    const assessmentsCount = await prisma.assessment.count({
      where: { classId }
    });

    // Get attendance records count
    const attendanceRecordsCount = await prisma.attendance.count({
      where: { classId }
    });

    // Get course campus details
    const courseCampus = {
      id: classData.courseCampusId,
      course: classData.courseCampus.course,
      campus: classData.courseCampus.campus
    };

    // Get gradebook (null for now, will be implemented later)
    const gradebook = null;

    return (
      <PageLayout
        title={courseCampus?.course?.name || 'Class Details'}
        description={`Class Code: ${classData.code}`}
        breadcrumbs={[
          { label: 'Classes', href: '/admin/coordinator/classes' },
          { label: courseCampus?.course?.name || 'Class', href: '#' },
        ]}
      >
        <CoordinatorClassViewClient
          id={classId}
          classData={classData}
          courseCampus={courseCampus}
          primaryTeacherName={primaryTeacherName}
          primaryTeacherId={classData.classTeacherId}
          assignedTeachers={assignedTeachers}
          assessmentsCount={assessmentsCount}
          attendanceRecordsCount={attendanceRecordsCount}
          gradebook={gradebook}
          className={classData.name}
        />
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in CoordinatorClassDetailPage:", { error });
    return redirect("/error");
  }
}
