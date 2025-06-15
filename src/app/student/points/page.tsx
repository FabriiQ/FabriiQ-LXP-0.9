import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { SystemStatus } from "@prisma/client";
import { PointsDisplay } from "@/components/rewards/PointsDisplay";
import { LevelProgress } from "@/components/rewards/LevelProgress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Coins, Activity, BookOpen, GraduationCap, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { unstable_cache } from "next/cache";

// Define a type for the student profile with levels
interface StudentProfileWithLevels {
  id: string;
  currentLevel?: number;
  studentLevels: Array<{
    level: number;
    currentExp: number;
    nextLevelExp: number;
  }>;
}

// Cache the student level fetch
const getCachedStudentLevel = unstable_cache(
  async (userId: string) => {
    // Use type assertion for Prisma model
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        id: true,
      },
    });

    // Fetch student levels separately with type assertion
    const studentLevels = await (prisma as any).studentLevel.findMany({
      where: {
        studentId: studentProfile?.id,
        classId: null, // Get the overall level (not class-specific)
        status: SystemStatus.ACTIVE,
      },
      orderBy: { updatedAt: 'desc' },
      take: 1,
      select: {
        level: true,
        currentExp: true,
        nextLevelExp: true,
      },
    });

    // Combine the data
    const profileWithLevels = {
      ...studentProfile,
      studentLevels,
    } as unknown as StudentProfileWithLevels;

    if (!studentProfile || !studentLevels || studentLevels.length === 0) {
      return {
        level: 1, // Default level
        currentExp: 0,
        nextLevelExp: 100,
      };
    }

    return {
      level: studentLevels[0].level,
      currentExp: studentLevels[0].currentExp,
      nextLevelExp: studentLevels[0].nextLevelExp,
    };
  },
  ['student-level'],
  { revalidate: 60 } // Revalidate every 60 seconds
);

// Cache the student points fetch
const getCachedStudentPoints = unstable_cache(
  async (studentId: string) => {
    // Get total points using type assertion
    const totalPoints = await (prisma as any).studentPoints.aggregate({
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    });

    // Get daily points (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyPoints = await (prisma as any).studentPoints.aggregate({
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get weekly points (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weeklyPoints = await (prisma as any).studentPoints.aggregate({
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
        createdAt: {
          gte: weekStart,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Get monthly points (last 30 days)
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyPoints = await (prisma as any).studentPoints.aggregate({
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
        createdAt: {
          gte: monthStart,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalPoints: totalPoints._sum.amount || 0,
      dailyPoints: dailyPoints._sum.amount || 0,
      weeklyPoints: weeklyPoints._sum.amount || 0,
      monthlyPoints: monthlyPoints._sum.amount || 0,
    };
  },
  ['student-points'],
  { revalidate: 60 } // Revalidate every 60 seconds
);

// Cache the student points history fetch
const getCachedPointsHistory = unstable_cache(
  async (studentId: string, limit: number = 50) => {
    return (prisma as any).studentPoints.findMany({
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        class: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
    });
  },
  ['student-points-history'],
  { revalidate: 60 } // Revalidate every 60 seconds
);

// Cache the student points by source fetch
const getCachedPointsBySource = unstable_cache(
  async (studentId: string) => {
    return (prisma as any).studentPoints.groupBy({
      by: ['source'],
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
    });
  },
  ['student-points-by-source'],
  { revalidate: 60 } // Revalidate every 60 seconds
);

export default async function StudentPointsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Get student profile
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!studentProfile) {
    redirect("/auth/signin");
  }

  // Get student level, points, and points history
  const levelInfo = await getCachedStudentLevel(session.user.id);
  const pointsInfo = await getCachedStudentPoints(studentProfile.id);
  const pointsHistory = await getCachedPointsHistory(studentProfile.id, 100);
  const pointsBySource = await getCachedPointsBySource(studentProfile.id);

  // Get source icon
  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'activity':
        return <Activity className="h-4 w-4" />;
      case 'class':
        return <BookOpen className="h-4 w-4" />;
      case 'grade':
        return <GraduationCap className="h-4 w-4" />;
      case 'login':
        return <Clock className="h-4 w-4" />;
      case 'streak':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">My Points</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PointsDisplay summary={pointsInfo} />
        <LevelProgress
          level={levelInfo.level}
          currentExp={levelInfo.currentExp}
          nextLevelExp={levelInfo.nextLevelExp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600" />
              Points History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="activity">Activities</TabsTrigger>
                <TabsTrigger value="class">Classes</TabsTrigger>
                <TabsTrigger value="login">Login</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <PointsHistoryTable
                  pointsHistory={pointsHistory}
                  getSourceIcon={getSourceIcon}
                />
              </TabsContent>

              <TabsContent value="activity">
                <PointsHistoryTable
                  pointsHistory={pointsHistory.filter((p: any) => p.source.toLowerCase() === 'activity')}
                  getSourceIcon={getSourceIcon}
                />
              </TabsContent>

              <TabsContent value="class">
                <PointsHistoryTable
                  pointsHistory={pointsHistory.filter((p: any) => p.source.toLowerCase() === 'class')}
                  getSourceIcon={getSourceIcon}
                />
              </TabsContent>

              <TabsContent value="login">
                <PointsHistoryTable
                  pointsHistory={pointsHistory.filter((p: any) =>
                    p.source.toLowerCase() === 'login' || p.source.toLowerCase() === 'streak'
                  )}
                  getSourceIcon={getSourceIcon}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-teal-600" />
              Points Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pointsBySource.map((sourceGroup: any) => (
                <div key={sourceGroup.source} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-teal-100 text-teal-700 p-2 rounded-full">
                        {getSourceIcon(sourceGroup.source)}
                      </div>
                      <span className="font-medium capitalize">{sourceGroup.source}</span>
                    </div>
                    <span className="text-lg font-bold text-teal-700">{sourceGroup._sum.amount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (sourceGroup._sum.amount! / pointsInfo.totalPoints) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {Math.round((sourceGroup._sum.amount! / pointsInfo.totalPoints) * 100)}% of total
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface PointsHistoryTableProps {
  pointsHistory: any[];
  getSourceIcon: (source: string) => React.ReactNode;
}

function PointsHistoryTable({ pointsHistory, getSourceIcon }: PointsHistoryTableProps) {
  if (pointsHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No points history available
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pointsHistory.map((points) => (
            <TableRow key={points.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(points.createdAt), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="bg-teal-100 text-teal-700 p-1 rounded-full">
                    {getSourceIcon(points.source)}
                  </div>
                  <span className="capitalize">{points.source}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {points.description || `Points from ${points.source}`}
                </div>
                {(points.class || points.subject) && (
                  <div className="text-xs text-gray-500">
                    {points.class?.name && <span>{points.class.name}</span>}
                    {points.class?.name && points.subject?.name && <span> • </span>}
                    {points.subject?.name && <span>{points.subject.name}</span>}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  +{points.amount}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
