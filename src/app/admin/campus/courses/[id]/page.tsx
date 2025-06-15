import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/server/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseDetailsContent } from "@/app/admin/campus/courses/[id]/CourseDetailsContent";

interface CourseDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  // Ensure params is fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;
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

  // Get course campus details
  const courseCampus = await prisma.courseCampus.findUnique({
    where: {
      id,
      campusId: user.primaryCampusId,
    },
    include: {
      course: {
        include: {
          program: true,
          subjects: true,
        }
      },
      campus: true,
      programCampus: true,
      _count: {
        select: {
          classes: true,
        }
      }
    },
  });

  if (!courseCampus) {
    notFound();
  }

  // Get classes for this course
  const classes = await prisma.class.findMany({
    where: {
      courseCampusId: id,
      status: 'ACTIVE',
    },
    include: {
      term: true,
      classTeacher: {
        include: {
          user: true,
        }
      },
      _count: {
        select: {
          students: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get analytics data
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

  const analytics = {
    studentCount,
    attendanceRate,
    assessmentCount: assessments,
    classCount: classes.length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/campus/courses" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>

      <CourseDetailsContent
        courseCampus={courseCampus}
        classes={classes}
        analytics={analytics}
      />
    </div>
  );
}
