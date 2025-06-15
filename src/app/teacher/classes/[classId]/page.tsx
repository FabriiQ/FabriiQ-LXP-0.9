import React from "react";
import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { ClassOverview } from "@/components/teacher/classes/ClassOverview";

export const metadata: Metadata = {
  title: "Class Details",
  description: "View class details and manage students",
};

export default async function ClassDetailPage({
  params,
}: {
  params: { classId: string };
}) {
  // Await params to ensure it's fully resolved
  const classId = await params.classId;
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
      teachers: {
        include: {
          teacher: {
            include: {
              user: true,
            },
          },
        },
      },
      students: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
      _count: {
        select: {
          activities: true,
          assessments: true,
        },
      },
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

  // Get recent attendance records
  const recentAttendance = await prisma.attendance.findMany({
    where: {
      classId: classId,
    },
    orderBy: {
      date: "desc",
    },
    take: 5,
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  // Count attendance records
  const attendanceCount = await prisma.attendance.count({
    where: {
      classId: classId,
    },
  });

  return <ClassOverview classId={classId} attendanceCount={attendanceCount} recentAttendance={recentAttendance} />;
}