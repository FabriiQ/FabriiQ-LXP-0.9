import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { DayOfWeek } from "@prisma/client";

export const metadata: Metadata = {
  title: "Teacher Dashboard",
  description: "Manage your classes, schedules, and students",
};

export default async function TeacherDashboardPage() {
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

  // Get current term
  const currentTerm = await prisma.term.findFirst({
    where: {
      status: 'ACTIVE',
    },
  });

  // Get teacher's classes for the current term
  const teacherClasses = await prisma.class.findMany({
    where: {
      teachers: {
        some: {
          teacherId: user.teacherProfile.id,
        },
      },
      termId: currentTerm?.id,
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
      students: true,
    },
    take: 5,
  });

  // Get upcoming schedule for today
  const today = new Date();
  const dayOfWeekMap: Record<number, DayOfWeek> = {
    0: 'SUNDAY',
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY'
  };
  const dayOfWeek = dayOfWeekMap[today.getDay()];

  // Get timetable periods for today
  const timetablePeriods = await prisma.timetablePeriod.findMany({
    where: {
      dayOfWeek: dayOfWeek,
      timetable: {
        classId: {
          in: teacherClasses.map(c => c.id)
        }
      }
    },
    include: {
      timetable: {
        include: {
          class: {
            include: {
              courseCampus: {
                include: {
                  course: {
                    include: {
                      subjects: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  // Get recent attendance records
  const recentAttendance = await prisma.attendance.findMany({
    where: {
      classId: {
        in: teacherClasses.map(c => c.id)
      }
    },
    orderBy: {
      date: 'desc',
    },
    include: {
      class: true,
      student: {
        include: {
          user: true,
        },
      },
    },
    take: 5,
  });

  // Get recent assessments
  const recentAssessments = await prisma.assessment.findMany({
    where: {
      classId: {
        in: teacherClasses.map(c => c.id)
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      class: true,
    },
    take: 5,
  });

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Teacher Dashboard"
        description={`Welcome back, ${user.name}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">My Classes</h3>
          {teacherClasses.length === 0 ? (
            <p className="text-gray-500">No classes assigned for the current term.</p>
          ) : (
            <div className="space-y-4">
              {teacherClasses.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/teacher/classes/${classItem.id}`}
                  className="block p-4 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{classItem.name}</div>
                  <div className="text-sm text-gray-500">
                    {classItem.courseCampus.course.subjects[0]?.name || "No subject"} • {classItem.students.length} students
                  </div>
                </Link>
              ))}
              <div className="pt-2">
                <Link
                  href="/teacher/classes"
                  className="text-sm text-primary-600 hover:underline"
                >
                  View all classes
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
          {timetablePeriods.length === 0 ? (
            <p className="text-gray-500">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-4">
              {timetablePeriods.map((period) => (
                <div
                  key={period.id}
                  className="p-4 border rounded"
                >
                  <div className="font-medium">{period.timetable.class.name}</div>
                  <div className="text-sm text-gray-500">
                    {period.timetable.class.courseCampus.course.subjects[0]?.name || "No subject"}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {formatTime(period.startTime.toString())} - {formatTime(period.endTime.toString())}
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Link
                  href="/teacher/schedule"
                  className="text-sm text-primary-600 hover:underline"
                >
                  View full schedule
                </Link>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
          {recentAttendance.length === 0 ? (
            <p className="text-gray-500">No recent attendance records.</p>
          ) : (
            <div className="space-y-4">
              {recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border rounded"
                >
                  <div className="font-medium">{record.student.user.name}</div>
                  <div className="text-sm text-gray-500">
                    {record.class.name}
                  </div>
                  <div className="flex items-center mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        record.status === "PRESENT"
                          ? "bg-green-100 text-green-800"
                          : record.status === "ABSENT"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {record.status}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(record.date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Assessments</h3>
          {recentAssessments.length === 0 ? (
            <p className="text-gray-500">No recent assessments.</p>
          ) : (
            <div className="space-y-4">
              {recentAssessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  href={`/teacher/classes/${assessment.classId}/assessments/${assessment.id}`}
                  className="block p-4 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium">{assessment.title}</div>
                  <div className="text-sm text-gray-500">
                    {assessment.class.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Created: {formatDate(assessment.createdAt)}
                  </div>
                </Link>
              ))}
              <div className="pt-2">
                <Link
                  href="/teacher/assessments"
                  className="text-sm text-primary-600 hover:underline"
                >
                  View all assessments
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${formattedHours}:${formattedMinutes} ${period}`;
}

// Helper function to format date
function formatDate(date: Date) {
  return date.toLocaleDateString();
}