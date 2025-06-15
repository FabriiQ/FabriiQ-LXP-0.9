'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart, Brain, LineChart, Users } from 'lucide-react';

interface ClassAnalyticsPageProps {
  params: {
    classId: string;
  };
}

export default function ClassAnalyticsPage({ params }: ClassAnalyticsPageProps) {
  const { classId } = params;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get class details
  const { data: classDetails, isLoading: isLoadingClass } = api.class.getClassById.useQuery(
    { id: classId },
    { enabled: !!classId }
  );
  
  // Get teacher ID
  const { data: teacher, isLoading: isLoadingTeacher } = api.teacher.getTeacherByUserId.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  );
  
  // Loading state
  if (status === 'loading' || isLoadingClass || isLoadingTeacher) {
    return (
      <div className="container py-6">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64 mb-6" />
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            You must be signed in to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // No teacher found
  if (!teacher) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>
            You must be a teacher to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // No class found
  if (!classDetails) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Class Not Found</AlertTitle>
          <AlertDescription>
            The requested class could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Navigate to specific analytics
  const navigateToAnalytics = (type: string) => {
    router.push(`/teacher/classes/${classId}/analytics/${type}`);
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Class Analytics</h1>
          <p className="text-muted-foreground">
            Analytics and insights for {classDetails.name}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-5 w-5" />
              Bloom's Taxonomy
            </CardTitle>
            <CardDescription>
              Cognitive level analysis and mastery tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze student performance across different cognitive levels of Bloom's Taxonomy.
              Track mastery progress and identify cognitive gaps.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigateToAnalytics('blooms')}
              className="w-full"
            >
              View Bloom's Analytics
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Academic performance metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track student performance across assessments and activities.
              Analyze grade distributions and identify areas for improvement.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigateToAnalytics('performance')}
              className="w-full"
              disabled
            >
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Student Engagement
            </CardTitle>
            <CardDescription>
              Participation and engagement analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor student engagement with learning materials and activities.
              Track participation trends and identify disengaged students.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigateToAnalytics('engagement')}
              className="w-full"
              disabled
            >
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>
            Summary of key metrics for {classDetails.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-12 text-center">
            <div className="text-muted-foreground">
              <LineChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Analytics Dashboard Coming Soon</h3>
              <p>
                We're working on a comprehensive analytics dashboard for your class.
                In the meantime, you can explore Bloom's Taxonomy analytics above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
