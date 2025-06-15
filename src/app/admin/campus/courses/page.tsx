import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { CampusCoursesContent } from "@/app/admin/campus/courses/CampusCoursesContent";

export const metadata: Metadata = {
  title: "Course Management | Campus Admin",
  description: "Manage courses at your campus",
};

export default async function CampusCoursesPage() {
  const session = await getSessionCache();

  // Only redirect if there's definitely no session
  if (!session) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
    select: {
      id: true,
      name: true,
      userType: true,
      primaryCampusId: true,
    },
  });

  if (!user || user.userType !== 'CAMPUS_ADMIN' || !user.primaryCampusId) {
    redirect("/login");
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id: user.primaryCampusId },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
  });

  if (!campus) {
    redirect("/login");
  }

  // Get courses for this campus
  const courseCampuses = await prisma.courseCampus.findMany({
    where: {
      campusId: user.primaryCampusId,
      status: 'ACTIVE',
    },
    include: {
      course: {
        include: {
          program: true,
        }
      },
      classes: {
        where: {
          status: 'ACTIVE',
        }
      },
      _count: {
        select: {
          classes: true,
        }
      }
    },
    orderBy: {
      course: {
        name: 'asc',
      }
    },
  });

  // Get analytics data for each course
  const courseAnalytics = await Promise.all(
    courseCampuses.map(async (cc) => {
      // Get all active classes for this course
      const classes = await prisma.class.findMany({
        where: {
          courseCampusId: cc.id,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        }
      });

      const classIds = classes.map(c => c.id);

      // Get student count
      const studentCount = await prisma.studentEnrollment.count({
        where: {
          classId: {
            in: classIds,
          },
          status: 'ACTIVE',
        },
      });

      // Get attendance data
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          classId: {
            in: classIds,
          },
        },
      });

      const totalAttendance = attendanceRecords.length;
      const presentAttendance = attendanceRecords.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = totalAttendance > 0
        ? Math.round((presentAttendance / totalAttendance) * 100)
        : 0;

      // Get assessment data
      const assessments = await prisma.assessment.count({
        where: {
          classId: {
            in: classIds,
          },
        },
      });

      return {
        courseCampusId: cc.id,
        courseId: cc.courseId,
        courseName: cc.course.name,
        courseCode: cc.course.code,
        programName: cc.course.program.name,
        classCount: cc._count.classes,
        studentCount,
        attendanceRate,
        assessmentCount: assessments,
      };
    })
  );

  return (
    <CampusCoursesContent
      campus={campus}
      courseCampuses={courseCampuses}
      courseAnalytics={courseAnalytics}
    />
  );
}
