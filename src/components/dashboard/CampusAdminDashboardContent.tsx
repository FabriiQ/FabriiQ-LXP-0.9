"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { CalendarIcon, GraduationCapIcon, UsersIcon, BookOpenIcon, RefreshCwIcon } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

interface CampusAdminDashboardContentProps {
  campusId: string;
  campusName: string;
}

export function CampusAdminDashboardContent({ campusId, campusName }: CampusAdminDashboardContentProps) {
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
      refetchOnWindowFocus: false,
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

  // Fetch recent enrollments data
  const {
    data: enrollmentsData,
    isLoading: isLoadingEnrollments,
    refetch: refetchEnrollments
  } = api.campusAnalytics.getRecentEnrollments.useQuery(
    { campusId },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching recent enrollments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load enrollment data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch teacher assignments data
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments
  } = api.campusAnalytics.getTeacherAssignments.useQuery(
    { campusId },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching teacher assignments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teacher assignment data',
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
      refetchOnWindowFocus: false,
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
    { campusId },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching upcoming events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load events data',
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
    { campusId },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching recent activity:', error);
        toast({
          title: 'Error',
          description: 'Failed to load activity data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch program statistics
  const {
    data: programData,
    isLoading: isLoadingPrograms,
    refetch: refetchPrograms
  } = api.campusAnalytics.getProgramStatistics.useQuery(
    { campusId },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching program statistics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load program data',
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
        refetchEnrollments(),
        refetchAssignments(),
        refetchClasses(),
        refetchEvents(),
        refetchActivity(),
        refetchPrograms()
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold tracking-tight">{campusName} Dashboard</h2>
        <LoadingButton
          variant="outline"
          size="sm"
          onClick={refreshAllData}
          loading={isRefreshing}
          loadingText="Refreshing..."
          icon={<RefreshCwIcon className="h-4 w-4" />}
        >
          Refresh Data
        </LoadingButton>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campus Performance</CardTitle>
                <CardDescription>Key performance indicators for {campusName}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPerformance ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-full mt-4" />
                    <Skeleton className="h-2 w-full" />
                    <Skeleton className="h-4 w-full mt-4" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Student Attendance</span>
                      <span className="text-sm font-medium">{performanceData?.studentAttendance || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${performanceData?.studentAttendance || 0}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm font-medium">Class Completion</span>
                      <span className="text-sm font-medium">{performanceData?.classCompletion || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${performanceData?.classCompletion || 0}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm font-medium">Teacher Engagement</span>
                      <span className="text-sm font-medium">{performanceData?.teacherEngagement || 0}%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${performanceData?.teacherEngagement || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/campus/reports`}>
                    View Detailed Reports
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Next 7 days at {campusName}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEvents ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : eventsData && eventsData.length > 0 ? (
                  <div className="space-y-4">
                    {eventsData.map((event) => (
                      <div key={event.id} className="flex items-start space-x-4">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.time ? format(new Date(event.time), 'EEEE, h:mm a') : 'Date not set'}
                          </p>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No upcoming events in the next 7 days
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/campus/calendar`}>
                    View Calendar
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Enrollments</CardTitle>
                <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingEnrollments ? (
                  <div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">+{enrollmentsData?.count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {enrollmentsData?.percentageChange && enrollmentsData.percentageChange > 0 ? '+' : ''}
                      {enrollmentsData?.percentageChange || 0}% from previous {enrollmentsData?.period || 30} days
                    </p>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/campus/students`}>
                    View Students
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teacher Assignments</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingAssignments ? (
                  <div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{assignmentsData?.count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      New assignments this {assignmentsData?.period === 7 ? 'week' : `${assignmentsData?.period || 7} days`}
                    </p>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/campus/teachers`}>
                    Manage Teachers
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
                <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoadingClasses ? (
                  <div>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{classesData?.count || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Across {classesData?.programCount || 0} programs
                    </p>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/campus/classes`}>
                    View Classes
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Management</CardTitle>
              <CardDescription>Manage programs offered at your campus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {isLoadingPrograms ? (
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>
                    </>
                  ) : programData && programData.length > 0 ? (
                    programData.map(program => (
                      <Card key={program.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{program.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{program.classCount} active classes</p>
                          <p className="text-sm text-muted-foreground">{program.studentCount} enrolled students</p>
                        </CardContent>
                        <CardFooter className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <Link href={`/admin/campus/programs/${program.id}`}>Manage</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-3 py-4 text-center text-muted-foreground">
                      No active programs found
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href={`/admin/campus/programs`}>
                  View All Programs
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Management</CardTitle>
              <CardDescription>Manage classes at your campus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 p-4 font-medium">
                    <div>Class Code</div>
                    <div>Name</div>
                    <div>Program</div>
                    <div>Teacher</div>
                    <div>Students</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-5 p-4">
                      <div>CS101</div>
                      <div>Introduction to Programming</div>
                      <div>Computer Science</div>
                      <div>John Smith</div>
                      <div>32</div>
                    </div>
                    <div className="grid grid-cols-5 p-4">
                      <div>BA201</div>
                      <div>Marketing Fundamentals</div>
                      <div>Business Administration</div>
                      <div>Sarah Johnson</div>
                      <div>28</div>
                    </div>
                    <div className="grid grid-cols-5 p-4">
                      <div>GD110</div>
                      <div>Design Principles</div>
                      <div>Graphic Design</div>
                      <div>Michael Chen</div>
                      <div>24</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href={`/admin/campus/classes`}>
                  Manage Classes
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage users at your campus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Teachers</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">32</div>
                      <p className="text-sm text-muted-foreground">Active teachers</p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/admin/campus/teachers`}>
                          Manage Teachers
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Students</CardTitle>
                        <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">450</div>
                      <p className="text-sm text-muted-foreground">Enrolled students</p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/admin/campus/students`}>
                          Manage Students
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Staff</CardTitle>
                        <UsersIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">18</div>
                      <p className="text-sm text-muted-foreground">Administrative staff</p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/admin/campus/staff`}>
                          Manage Staff
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href={`/admin/campus/users/new`}>
                  Add New User
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="facilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facility Management</CardTitle>
              <CardDescription>Manage facilities at your campus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 font-medium">
                    <div>Name</div>
                    <div>Type</div>
                    <div>Capacity</div>
                    <div>Status</div>
                  </div>
                  <div className="divide-y">
                    <div className="grid grid-cols-4 p-4">
                      <div>Room 101</div>
                      <div>Classroom</div>
                      <div>30</div>
                      <div><span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Available</span></div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Computer Lab A</div>
                      <div>Laboratory</div>
                      <div>24</div>
                      <div><span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Maintenance</span></div>
                    </div>
                    <div className="grid grid-cols-4 p-4">
                      <div>Auditorium</div>
                      <div>Event Space</div>
                      <div>200</div>
                      <div><span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Booked</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href={`/admin/campus/facilities`}>
                  Manage Facilities
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in your campus</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivity ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
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
                      {activity.timestamp ? format(new Date(activity.timestamp), 'PPp') : 'Unknown date'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              No recent activity found
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/campus/activity`}>
              View All Activity
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}