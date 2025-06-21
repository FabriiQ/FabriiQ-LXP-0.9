"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  GraduationCap,
  Users,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface TeacherDashboardContentProps {
  campusId: string;
  campusName: string;
  teacherId: string;
}

export function TeacherDashboardContent({ campusId, campusName, teacherId }: TeacherDashboardContentProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Fetch campus performance data
  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
    refetch: refetchPerformance
  } = api.campusAnalytics.getCampusPerformance.useQuery(
    { campusId },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 60000,
      onError: (error) => {
        console.error('Error fetching campus performance:', error);
        toast({
          title: 'Error',
          description: 'Failed to load campus performance data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch active classes data
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    refetch: refetchClasses
  } = api.campusAnalytics.getActiveClasses.useQuery(
    { campusId },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 60000,
      onError: (error) => {
        console.error('Error fetching active classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load class data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch upcoming events
  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    refetch: refetchEvents
  } = api.campusAnalytics.getUpcomingEvents.useQuery(
    { campusId, days: 14 },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 60000,
      onError: (error) => {
        console.error('Error fetching upcoming events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load upcoming events',
          variant: 'error',
        });
      }
    }
  );

  // Fetch recent activity
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    refetch: refetchActivity
  } = api.campusAnalytics.getRecentActivity.useQuery(
    { campusId, limit: 10 },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // More frequent for recent activity
      onError: (error) => {
        console.error('Error fetching recent activity:', error);
        toast({
          title: 'Error',
          description: 'Failed to load recent activity',
          variant: 'error',
        });
      }
    }
  );

  // Function to refresh all data
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchPerformance(),
        refetchClasses(),
        refetchEvents(),
        refetchActivity()
      ]);
      toast({
        title: 'Data refreshed',
        description: 'Dashboard data has been updated',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh dashboard data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch teacher's classes
  const {
    data: teacherClassesData = [],
    isLoading: isLoadingTeacherClasses
  } = api.teacher.getTeacherClasses.useQuery(
    { teacherId },
    {
      refetchOnWindowFocus: true,
      refetchInterval: 60000,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching teacher classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load class data',
          variant: 'error',
        });
      }
    }
  );

  // Mock pending assessments data since the API endpoint doesn't exist yet
  const pendingAssessments = React.useMemo(() => [
    {
      id: '1',
      title: 'Midterm Exam',
      className: 'Introduction to Programming',
      dueDate: new Date().toISOString(),
      pendingCount: 5
    },
    {
      id: '2',
      title: 'Weekly Quiz',
      className: 'Data Structures',
      dueDate: new Date().toISOString(),
      pendingCount: 3
    }
  ], []);
  const isLoadingPendingAssessments = false;

  // Calculate student count from teacher classes
  const studentsData = React.useMemo(() => {
    if (!teacherClassesData || teacherClassesData.length === 0) return [];

    // Collect all students from all classes
    const allStudents = teacherClassesData.flatMap(cls => cls.students || []);

    // Return unique students by ID
    const uniqueStudents = Array.from(
      new Map(allStudents.map(student => [student.studentId, student])).values()
    );

    return uniqueStudents;
  }, [teacherClassesData]);

  const isLoadingStudents = isLoadingTeacherClasses;

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAllData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingTeacherClasses ? (
                  <div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{teacherClassesData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active classes
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{studentsData.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total students
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingPendingAssessments ? (
                  <div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{pendingAssessments.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Need grading
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Schedule</CardTitle>
              <CardDescription>Your upcoming classes and events</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[250px] overflow-y-auto">
              {isLoadingEvents ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : eventsData && eventsData.length > 0 ? (
                <div className="space-y-4">
                  {eventsData.map((event, index) => (
                    <div key={event.id || index} className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-2 rounded">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                        <p className="text-xs font-medium">
                          {event.time ? format(new Date(event.time), 'PPP p') : format(new Date(), 'PPP')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/teacher/calendar">
                  View Calendar
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pending Assessments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Assessments Needing Attention</CardTitle>
              <CardDescription>Assessments that need grading</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {isLoadingPendingAssessments ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : pendingAssessments && pendingAssessments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAssessments.map((assessment) => (
                    <div key={assessment.id} className="flex items-start space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{assessment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assessment.className} • Due: {format(new Date(assessment.dueDate), 'PP')}
                        </p>
                        <div className="mt-1">
                          <Badge variant="outline">{assessment.pendingCount} submissions need grading</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/teacher/assessments/${assessment.id}`}>Grade</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No assessments need grading</p>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" asChild className="w-full">
                <Link href="/teacher/assessments">
                  View All Assessments
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions in your classes</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              {isLoadingActivity ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : activityData && activityData.length > 0 ? (
                <div className="space-y-4">
                  {activityData.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.timestamp), 'PPp')}
                        </p>
                      </div>
                      {activity.type && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/teacher/${activity.type.toLowerCase()}s`}>View</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>My Classes</CardTitle>
                  <CardDescription>Classes you are teaching this term</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teacher/classes">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTeacherClasses ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : teacherClassesData.length > 0 ? (
                <div className="space-y-4">
                  {teacherClassesData.slice(0, 5).map(classItem => (
                    <div key={classItem.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{classItem.name}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{classItem.courseCampus?.course?.name || 'No course'}</span>
                            {classItem.students && (
                              <span>• {classItem.students.length} students</span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/teacher/classes/${classItem.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No classes assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pending Assessments</CardTitle>
                  <CardDescription>Assessments that need your attention</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teacher/assessments">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingPendingAssessments ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : pendingAssessments && pendingAssessments.length > 0 ? (
                <div className="space-y-4">
                  {pendingAssessments.map((assessment) => (
                    <div key={assessment.id} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{assessment.title}</p>
                          <div className="flex flex-col xs:flex-row xs:items-center gap-1 text-xs text-muted-foreground">
                            <span>{assessment.className}</span>
                            <span className="hidden xs:inline">•</span>
                            <span>Due: {format(new Date(assessment.dueDate), 'PP')}</span>
                          </div>
                          <div className="mt-1">
                            <Badge variant="outline">{assessment.pendingCount} need grading</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/teacher/assessments/${assessment.id}`}>
                            Grade
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No assessments need grading</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest student submissions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingActivity ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : activityData && activityData.filter(a => a.type === 'SUBMISSION').length > 0 ? (
                <div className="space-y-4">
                  {activityData
                    .filter(a => a.type === 'SUBMISSION')
                    .slice(0, 5)
                    .map((activity, index) => (
                      <div key={activity.id || index} className="border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.timestamp), 'PPp')}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/teacher/assessments/${activity.id || ''}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No recent submissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
