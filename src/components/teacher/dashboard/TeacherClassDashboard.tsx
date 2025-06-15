import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { TeacherClassPerformanceCard } from './TeacherClassPerformanceCard';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Calendar, Activity, BarChart } from 'lucide-react';
import Link from 'next/link';

interface TeacherClassDashboardProps {
  classId: string;
}

export const TeacherClassDashboard: React.FC<TeacherClassDashboardProps> = ({
  classId,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('overview');

  // Fetch class details
  const { data: classDetails, isLoading: isLoadingClass } = api.class.getById.useQuery(
    { classId },
    {
      enabled: !!classId,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load class details: ${error.message}`,
          variant: 'error',
        });
      },
    }
  );

  // Fetch student count
  const { data: studentEnrollments, isLoading: isLoadingStudents } = api.class.getStudents.useQuery(
    { classId },
    {
      enabled: !!classId,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load student count: ${error.message}`,
          variant: 'error',
        });
      },
    }
  );

  const studentCount = studentEnrollments?.length || 0;

  // Fetch activities for the class
  const { data: activities, isLoading: isLoadingActivities } = api.activity.getByClass.useQuery(
    { classId },
    {
      enabled: !!classId,
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to load activity count: ${error.message}`,
          variant: 'error',
        });
      },
    }
  );

  const activityCount = activities?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">
          {isLoadingClass ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            classDetails?.name || 'Class Dashboard'
          )}
        </h1>

        <div className="flex space-x-2">
          <Link href={`/teacher/classes/${classId}/performance`} passHref>
            <Button variant="outline" size="sm">
              <BarChart className="h-4 w-4 mr-2" />
              Detailed Performance
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-primary" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStudents ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{studentCount || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-primary" />
              Course
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingClass ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-md font-medium truncate">
                {classDetails?.courseCampus?.course?.name || 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              Term
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingClass ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-md font-medium truncate">
                {classDetails?.term?.name || 'N/A'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-primary" />
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{activityCount || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Class Overview</CardTitle>
                <CardDescription>Quick summary of class details</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingClass ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p><strong>Class Code:</strong> {classDetails?.code || 'N/A'}</p>
                    <p><strong>Capacity:</strong> {classDetails?.currentCount || 0}/{classDetails?.maxCapacity || 0}</p>
                    <p><strong>Campus:</strong> {classDetails?.campus?.name || 'N/A'}</p>
                    <p><strong>Status:</strong> {classDetails?.status || 'N/A'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <TeacherClassPerformanceCard
              classId={classId}
              className={classDetails?.name}
            />
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <TeacherClassPerformanceCard
            classId={classId}
            className={classDetails?.name}
          />
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest activities for this class</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : activityCount && activityCount > 0 ? (
                <p>Activity list will be displayed here.</p>
              ) : (
                <p className="text-muted-foreground">No activities have been created for this class yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
