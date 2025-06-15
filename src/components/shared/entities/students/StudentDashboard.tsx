'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  BarChart as BarChartIcon,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Bell,
  ChevronRight,
  Award,
  RefreshCw,
  Medal,
  CircleDollarSign
} from 'lucide-react';
import { PieChart as PieChartIcon } from './icons';

export interface StudentMetrics {
  courses: { value: number; description: string };
  assignments: { value: number; description: string };
  grades: { value: string; description: string };
  messages: { value: number; description: string };
  attendance?: { value: number; description: string };
  activities?: { value: number; description: string };
  // Reward system metrics
  points?: { value: number; description: string };
  level?: { value: number; description: string };
  achievements?: { value: number; description: string };
}

export interface Activity {
  id: string;
  title: string;
  subject: string;
  dueDate: Date;
  status: 'completed' | 'pending' | 'overdue' | 'upcoming';
  type: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: Date;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface StudentDashboardProps {
  studentName: string;
  metrics: StudentMetrics;
  recentActivities?: Activity[];
  upcomingActivities?: Activity[];
  announcements?: Announcement[];
  recentGrades?: Array<{
    id: string;
    subject: string;
    title: string;
    grade: string;
    date: Date;
  }>;
  leaderboard?: {
    position: number;
    previousPosition?: number;
    score: number;
  };
  isLoading?: boolean;
  error?: string;
  className?: string;
  onRefresh?: () => void; // Add refresh callback
}

/**
 * StudentDashboard component with mobile-first design
 *
 * Features:
 * - Performance metrics display
 * - Recent and upcoming activities
 * - Announcements
 * - Recent grades
 *
 * @example
 * ```tsx
 * <StudentDashboard
 *   studentName="John Doe"
 *   metrics={metrics}
 *   recentActivities={recentActivities}
 *   upcomingActivities={upcomingActivities}
 *   announcements={announcements}
 *   recentGrades={recentGrades}
 * />
 * ```
 */
export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentName,
  metrics,
  recentActivities = [],
  upcomingActivities = [],
  announcements = [],
  recentGrades = [],
  leaderboard,
  isLoading = false,
  error,
  className,
  onRefresh,
}) => {
  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'destructive';
      case 'upcoming':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'upcoming':
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium">Error Loading Dashboard</h3>
              <p className="text-muted-foreground mt-2">{error}</p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Welcome message */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {studentName}!</h1>
          <p className="text-muted-foreground">
            Here's an overview of your academic progress and upcoming activities.
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="mt-1"
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.courses.value}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.courses.description}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.assignments.value}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.assignments.description}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.grades.value}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.grades.description}
            </p>
          </CardContent>
        </Card>

        {/* Points Card */}
        {metrics.points && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.points.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.points.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Level Card */}
        {metrics.level && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Medal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.level.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.level.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Achievements Card */}
        {metrics.achievements && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.achievements.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.achievements.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Attendance Card */}
        {metrics.attendance && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <PieChartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metrics.attendance.value}%</div>
                <Progress
                  value={metrics.attendance.value}
                  className="h-2"
                  indicatorClassName={metrics.attendance.value >= 90 ? "bg-green-500" :
                                     metrics.attendance.value >= 75 ? "bg-yellow-500" : "bg-red-500"}
                />
                <p className="text-xs text-muted-foreground">
                  {metrics.attendance.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {leaderboard ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leaderboard</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl font-bold">#{leaderboard.position}</div>
                </div>
                {leaderboard.previousPosition && leaderboard.previousPosition !== leaderboard.position && (
                  <Badge
                    variant={leaderboard.previousPosition > leaderboard.position ? "success" : "destructive"}
                    className="flex items-center gap-1"
                  >
                    {leaderboard.previousPosition > leaderboard.position ? (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        {leaderboard.previousPosition - leaderboard.position}
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3" />
                        {leaderboard.position - leaderboard.previousPosition}
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {leaderboard.score} points
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-2 px-4">
              <Link href="/student/leaderboard" className="text-xs text-primary hover:underline flex items-center">
                View Leaderboard <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.messages.value}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.messages.description}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activities */}
        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>Activities</CardTitle>
            <CardDescription>Your recent and upcoming activities</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="upcoming" className="w-full">
              <div className="px-6">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upcoming" className="m-0">
                <div className="divide-y">
                  {upcomingActivities.length > 0 ? (
                    upcomingActivities.map((activity) => (
                      <div key={activity.id} className="p-4 hover:bg-muted/50">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <p className="text-xs text-muted-foreground">{activity.subject}</p>
                          </div>
                          <Badge variant={getStatusVariant(activity.status)} className="ml-2 flex items-center gap-1">
                            {getStatusIcon(activity.status)}
                            <span className="capitalize">{activity.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {formatDate(activity.dueDate)}
                          </span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">No upcoming activities</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recent" className="m-0">
                <div className="divide-y">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="p-4 hover:bg-muted/50">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{activity.title}</h4>
                            <p className="text-xs text-muted-foreground">{activity.subject}</p>
                          </div>
                          <Badge variant={getStatusVariant(activity.status)} className="ml-2 flex items-center gap-1">
                            {getStatusIcon(activity.status)}
                            <span className="capitalize">{activity.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {formatDate(activity.dueDate)}
                          </span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">No recent activities</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/student/activities">
                View All Activities
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Latest updates and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-3 hover:bg-muted/50">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'} className="ml-2">
                        {announcement.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {announcement.content}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(announcement.date)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No announcements</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Your latest assessment results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrades.length > 0 ? (
                recentGrades.map((grade) => (
                  <div key={grade.id} className="border rounded-lg p-3 hover:bg-muted/50">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="font-medium text-sm">{grade.title}</h4>
                        <p className="text-xs text-muted-foreground">{grade.subject}</p>
                      </div>
                      <div className="text-lg font-bold">{grade.grade}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {formatDate(grade.date)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No recent grades</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/student/grades">
                View All Grades
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
