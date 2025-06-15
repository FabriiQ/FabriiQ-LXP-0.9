import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { EnhancedStudentGrid } from "@/components/teacher/classes/EnhancedStudentGrid";

export const metadata: Metadata = {
  title: "Class Students",
  description: "View and manage students in your class",
};

export default async function ClassStudentsPage({
  params,
}: {
  params: { classId: string };
}) {
  // Await params to fix the error
  const { classId } = await Promise.resolve(params);
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
      teachers: true,
      students: {
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      },
    },
  });

  if (!classDetails) {
    redirect("/teacher/classes");
  }

  // Check if the teacher is assigned to this class
  const isTeacherAssigned = classDetails.teachers.some(
    (assignment) => assignment.teacherId === user.teacherProfile.id
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
          user: true
        }
      }
    }
  });

  // Group attendance by date
  const attendanceByDate = recentAttendance.reduce((acc, record) => {
    const dateStr = record.date.toISOString().split('T')[0];
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(record);
    return acc;
  }, {} as Record<string, typeof recentAttendance>);

  // Calculate attendance statistics
  const attendanceStats = classDetails.students.map(enrollment => {
    const studentAttendance = recentAttendance.filter(
      record => record.studentId === enrollment.studentId
    );

    const present = studentAttendance.filter(record => record.status === 'PRESENT').length;
    const absent = studentAttendance.filter(record => record.status === 'ABSENT').length;
    const late = studentAttendance.filter(record => record.status === 'LATE').length;

    const total = studentAttendance.length;
    const presentPercentage = total > 0 ? (present / total) * 100 : 0;

    return {
      studentId: enrollment.studentId,
      studentName: enrollment.student.user.name,
      present,
      absent,
      late,
      total,
      presentPercentage
    };
  });

  return <EnhancedStudentGrid classId={classId} />;
}