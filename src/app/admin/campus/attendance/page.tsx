import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar, Download, Clock, BarChart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { startOfDay } from "date-fns/startOfDay";
import { endOfDay } from "date-fns/endOfDay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceAnalyticsDashboard } from "@/components/attendance/AttendanceAnalyticsDashboard";
import { CourseAttendanceAnalytics } from "@/components/attendance/CourseAttendanceAnalytics";
import { ClassAttendanceSelector } from "@/components/attendance/ClassAttendanceSelector";
import { StudentAttendanceSelector } from "@/components/attendance/StudentAttendanceSelector";
import { AttendanceService } from "@/server/api/services/attendance.service";

export const metadata: Metadata = {
  title: "Attendance Management | Campus Admin",
  description: "Manage attendance at your campus",
};

export default async function CampusAttendancePage() {
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

  // Get recent attendance records
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      class: {
        programCampus: {
          campusId: user.primaryCampusId,
        }
      }
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              name: true,
            }
          }
        }
      },
      class: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      date: 'desc',
    },
    take: 50,
  });

  // Get today's attendance statistics
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  // Get today's attendance records
  const todayAttendance = await prisma.attendance.findMany({
    where: {
      class: {
        programCampus: {
          campusId: user.primaryCampusId,
        }
      },
      date: {
        gte: todayStart,
        lte: todayEnd,
      }
    },
    select: {
      status: true,
    }
  });

  // Calculate today's attendance statistics
  const todayStats = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: todayAttendance.length
  };

  todayAttendance.forEach(record => {
    if (record.status === 'PRESENT') todayStats.present++;
    else if (record.status === 'ABSENT') todayStats.absent++;
    else if (record.status === 'LATE') todayStats.late++;
    else if (record.status === 'EXCUSED') todayStats.excused++;
  });

  // Calculate attendance rate
  const todayAttendanceRate = todayStats.total > 0
    ? Math.round((todayStats.present / todayStats.total) * 100)
    : 0;

  // Get weekly attendance statistics
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const weeklyAttendance = await prisma.attendance.findMany({
    where: {
      class: {
        programCampus: {
          campusId: user.primaryCampusId,
        }
      },
      date: {
        gte: startOfDay(weekStart),
        lte: todayEnd,
      }
    },
    select: {
      status: true,
    }
  });

  // Calculate weekly attendance statistics
  const weeklyStats = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: weeklyAttendance.length
  };

  weeklyAttendance.forEach(record => {
    if (record.status === 'PRESENT') weeklyStats.present++;
    else if (record.status === 'ABSENT') weeklyStats.absent++;
    else if (record.status === 'LATE') weeklyStats.late++;
    else if (record.status === 'EXCUSED') weeklyStats.excused++;
  });

  // Calculate weekly attendance rate
  const weeklyAttendanceRate = weeklyStats.total > 0
    ? Math.round((weeklyStats.present / weeklyStats.total) * 100)
    : 0;

  // Get active classes for attendance
  const classes = await prisma.class.findMany({
    where: {
      programCampus: {
        campusId: user.primaryCampusId,
      },
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      currentCount: true,
    },
    orderBy: {
      name: 'asc',
    },
    take: 10,
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">Manage attendance at {campus.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/campus/attendance/export">
              <Download className="mr-2 h-4 w-4" /> Export
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/campus/attendance/take">
              <Clock className="mr-2 h-4 w-4" /> Take Attendance
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{todayStats.present} of {todayStats.total} students present</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Based on {weeklyStats.total} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Classes Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.absent}</div>
            <p className="text-xs text-muted-foreground mt-1">Students absent today</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search attendance records..."
            className="w-full pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" /> Date Range
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Records</TabsTrigger>
          <TabsTrigger value="classes">By Class</TabsTrigger>
          <TabsTrigger value="students">By Student</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">By Course</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <AttendanceAnalyticsDashboard campusId={campus.id} />
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <CourseAttendanceAnalytics campusId={campus.id} period="month" />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Student</th>
                      <th className="text-left p-4 font-medium">Class</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Remarks</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-muted/50">
                        <td className="p-4 font-medium">{record.student.user.name}</td>
                        <td className="p-4">{record.class.name}</td>
                        <td className="p-4">{format(new Date(record.date), "MMM d, yyyy")}</td>
                        <td className="p-4">
                          {record.status === 'PRESENT' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                              Present
                            </Badge>
                          ) : record.status === 'ABSENT' ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
                              Absent
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-700">
                              Late
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">{record.remarks || "-"}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/campus/attendance/${record.id}`}>
                              Edit
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {attendanceRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-muted-foreground">
                          No attendance records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <ClassAttendanceSelector campusId={campus.id} />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <StudentAttendanceSelector campusId={campus.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}