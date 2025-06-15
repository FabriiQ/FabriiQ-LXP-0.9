import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { DatePicker } from "@/components/ui/date-picker";
import AttendanceRecorder from "@/components/teacher/attendance/AttendanceRecorder";

export const metadata: Metadata = {
  title: "Class Attendance",
  description: "Manage class attendance",
};

export default async function ClassAttendancePage({
  params,
}: {
  params: { classId: string };
}) {
  // Ensure params are resolved before using them
  const classId = params.classId;

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
          teacher: true,
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
    },
  });

  if (!classDetails) {
    redirect("/teacher/classes");
  }

  // Check if the teacher is assigned to this class
  // We've already checked that user.teacherProfile is not null in the earlier condition
  // TypeScript needs a non-null assertion or additional check
  const teacherProfileId = user.teacherProfile?.id;
  if (!teacherProfileId) {
    redirect("/teacher/classes");
  }

  const isTeacherAssigned = classDetails.teachers.some(
    (assignment) => assignment.teacherId === teacherProfileId
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
    take: 10,
    include: {
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  // Calculate attendance statistics
  const attendanceStats = await prisma.$queryRaw`
    SELECT
      status,
      COUNT(*) as count,
      COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance WHERE "classId" = ${classId}) as percentage
    FROM attendance
    WHERE "classId" = ${classId}
    GROUP BY status
  `;

  // Note: We're not currently using attendance by date data
  // This code is kept for future implementation of attendance trends
  // but commented out to avoid unnecessary database queries

  /*
  // Get attendance by date for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const attendanceByDate = await prisma.attendance.groupBy({
    by: ['date', 'status'],
    where: {
      classId: classId,
      date: {
        gte: thirtyDaysAgo
      }
    },
    _count: {
      status: true
    },
    orderBy: {
      date: 'asc'
    }
  });
  */

  // Format student data for the attendance recorder
  const students = classDetails.students.map(enrollment => ({
    id: enrollment.studentId,
    name: enrollment.student.user.name || '',
    // Removed email as it's not needed
  }));

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <PageHeader
        title="Class Attendance"
        description={`${classDetails.name} - ${classDetails.courseCampus.course.subjects[0]?.name || "No subject"}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Class Information for mobile - shown at top on mobile */}
        <Card className="p-6 md:hidden">
          <h3 className="text-lg font-semibold mb-4">Class Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="font-medium text-foreground">{classDetails.students.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Records</p>
                <p className="font-medium text-foreground">{recentAttendance.length}</p>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 text-foreground">Attendance Overview</h4>
              <div className="grid grid-cols-2 gap-2">
                {Array.isArray(attendanceStats) && attendanceStats.map((stat: any) => (
                  <div
                    key={stat.status}
                    className={`p-2 rounded ${
                      stat.status === 'PRESENT'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : stat.status === 'ABSENT'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        : stat.status === 'LATE'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    <p className="text-xs font-medium">{stat.status}</p>
                    <p className="text-lg font-bold">{Number(stat.percentage).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{Number(stat.count)} records</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Record Attendance */}
        <Card className="p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Record Attendance</h3>
          <AttendanceRecorder
            classId={classId}
            students={students}
          />
        </Card>

        {/* Class Information for desktop - shown on right side on desktop */}
        <Card className="p-6 md:col-span-1 hidden md:block">
          <h3 className="text-lg font-semibold mb-4">Class Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="font-medium text-foreground">{classDetails.students.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent Attendance Records</p>
              <p className="font-medium text-foreground">{recentAttendance.length}</p>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 text-foreground">Attendance Overview</h4>
              <div className="grid grid-cols-2 gap-2">
                {Array.isArray(attendanceStats) && attendanceStats.map((stat: any) => (
                  <div
                    key={stat.status}
                    className={`p-2 rounded ${
                      stat.status === 'PRESENT'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : stat.status === 'ABSENT'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                        : stat.status === 'LATE'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                    }`}
                  >
                    <p className="text-xs font-medium">{stat.status}</p>
                    <p className="text-lg font-bold">{Number(stat.percentage).toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">{Number(stat.count)} records</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Attendance Records</h3>
          {recentAttendance.length === 0 ? (
            <p className="text-muted-foreground">No attendance records yet.</p>
          ) : (
            <>
              {/* Mobile view - card-based layout */}
              <div className="block sm:hidden space-y-4">
                {recentAttendance.map((attendance) => (
                  <div key={attendance.id} className="bg-muted/30 dark:bg-muted/10 rounded-lg p-4 border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-foreground">
                        {attendance.student.user.name}
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        attendance.status === "PRESENT"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : attendance.status === "ABSENT"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          : attendance.status === "LATE"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                      }`}>
                        {attendance.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date(attendance.date).toLocaleDateString()}
                    </div>
                    {attendance.remarks && (
                      <div className="text-sm text-foreground mt-2 border-t border-border pt-2">
                        <span className="font-medium text-xs text-muted-foreground">Notes: </span>
                        {attendance.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop view - table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {recentAttendance.map((attendance) => (
                      <tr key={attendance.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {new Date(attendance.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">
                            {attendance.student.user.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            attendance.status === "PRESENT"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : attendance.status === "ABSENT"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              : attendance.status === "LATE"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                          }`}>
                            {attendance.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {attendance.remarks || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 mb-4">
        <Link
          href={`/teacher/classes/${classId}`}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-background border border-primary/30 rounded-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Class
        </Link>
      </div>
    </div>
  );
}