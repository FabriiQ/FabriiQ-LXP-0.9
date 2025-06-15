import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { logger } from "@/server/api/utils/logger";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Edit } from "lucide-react";
import { ClassViewClient } from "./components/ClassViewClient";

interface PageProps {
  params: {
    id: string;
  };
}

// Define the type for assigned teachers
type AssignedTeacher = {
  id: string;
  name: string | null;
  type: string;
  isPrimary: boolean;
};

export default async function CampusClassPage({ params }: PageProps) {
  // Get the ID from params - ensure it's properly typed
  const { id } = params;

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

    logger.debug("Fetching class details", {
      classId: id,
      campusId: user.primaryCampusId
    });

    const classData = await prisma.class.findUnique({
      where: {
        id,
        campusId: user.primaryCampusId,
      },
      include: {
        courseCampus: {
          include: {
            course: true,
          }
        },
        classTeacher: {
          include: {
            user: true,
          }
        },
        students: {  // This is the correct relation name
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
        timetables: {  // Changed from timetable to timetables
          include: {
            periods: true,
            schedulePattern: {
              select: {
                description: true,
              },
            },
          },
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

    // Get course name through the courseCampus relation
    const courseCampus = await prisma.courseCampus.findUnique({
      where: { id: classData.courseCampusId },
      include: { course: true }
    });

    // Get teacher information
    let primaryTeacherName = 'Not Assigned';
    if (classData.classTeacherId) {
      // First try to get the teacher from the classTeacher relation
      if (classData.classTeacher?.user?.name) {
        primaryTeacherName = classData.classTeacher.user.name;
        logger.info("Found primary teacher from classTeacher relation", {
          classId: id,
          teacherId: classData.classTeacherId,
          teacherName: primaryTeacherName
        });
      } else {
        // If not found in relation, try direct lookup
        const teacher = await prisma.teacherProfile.findUnique({
          where: { id: classData.classTeacherId },
          include: { user: true }
        });
        if (teacher?.user?.name) {
          primaryTeacherName = teacher.user.name;
          logger.info("Found primary teacher from direct lookup", {
            classId: id,
            teacherId: classData.classTeacherId,
            teacherName: primaryTeacherName
          });
        } else {
          logger.warn("Primary teacher found but name is missing", {
            classId: id,
            teacherId: classData.classTeacherId
          });
        }
      }
    } else {
      logger.info("No primary teacher assigned to class", {
        classId: id
      });
    }

    // Get all assigned teachers
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        classId: id,
        status: 'ACTIVE',
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    const assignedTeachers: AssignedTeacher[] = teacherAssignments.map((assignment) => ({
      id: assignment.teacher.id,
      name: assignment.teacher.user.name,
      type: assignment.teacherId === classData.classTeacherId ? 'PRIMARY' : 'ASSISTANT',
      isPrimary: assignment.teacher.id === classData.classTeacherId
    }));

    // Schedule details will be loaded separately

    // Get assignments count for this class
    const assessmentsCount = await prisma.assessment.count({
      where: { classId: classData.id }
    });

    // Get attendance records count
    const attendanceRecordsCount = await prisma.attendance.count({
      where: { classId: classData.id }
    });

    // Get gradebook availability
    const gradebook = await prisma.gradeBook.findFirst({
      where: { classId: classData.id }
    });

    return (
      <PageLayout
        title={courseCampus?.course?.name || 'Class Details'}
        description={`Class Code: ${classData.code}`}
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: courseCampus?.course?.name || 'Class', href: '#' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/campus/classes/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Class
              </Link>
            </Button>
          </div>
        }
      >
        <ClassViewClient
          id={id}
          classData={classData}
          courseCampus={courseCampus}
          primaryTeacherName={primaryTeacherName}
          assignedTeachers={assignedTeachers}
          assessmentsCount={assessmentsCount}
          attendanceRecordsCount={attendanceRecordsCount}
          gradebook={gradebook}
          className={classData.name}
        />
      </PageLayout>
    );
  } catch (error) {
    logger.error("Error in campus class page:", {
      error,
      classId: id,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}










