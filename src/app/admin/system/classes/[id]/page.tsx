'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Users, BookOpen, Calendar, Activity, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/atoms/button';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/atoms/badge';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

export default function SystemClassDetailPage() {
  const params = useParams();

  const classId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch class details
  const { data: classData, isLoading: isLoadingClass } = api.systemAnalytics.getClassById.useQuery(
    { id: classId },
    {
      enabled: !!classId,
      retry: 1,
    }
  );

  if (isLoadingClass) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <PageHeader
          title="Class Not Found"
          description="The requested class could not be found."
        />
        <Button asChild>
          <Link href="/admin/system/classes">Back to Classes</Link>
        </Button>
      </div>
    );
  }

  // Format dates
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'UPCOMING':
        return 'warning';
      case 'COMPLETED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/system/classes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Classes
            </Link>
          </Button>
          <PageHeader
            title={`Class: ${classData.name}`}
            description={`${classData.code} - ${classData.course.name}`}
          />
        </div>
        <div className="flex space-x-2">
          <Badge variant={getStatusBadgeVariant(classData.status)}>
            {classData.status.charAt(0) + classData.status.slice(1).toLowerCase()}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/system/classes/${classId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Class Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Course:</span>
              <span className="ml-2">{classData.course.name}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Teacher:</span>
              <span className="ml-2">{classData.teacher ? classData.teacher.name : 'No teacher assigned'}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Term:</span>
              <span className="ml-2">{classData.term.name}</span>
            </div>
            <div className="flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Program:</span>
              <span className="ml-2">{classData.program ? classData.program.name : 'Not assigned'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Students:</span>
              <span className="ml-2">{classData.studentCount}</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Teachers:</span>
              <span className="ml-2">{classData.teacherCount}</span>
            </div>
            <div className="flex items-center">
              <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Activities:</span>
              <span className="ml-2">{classData.activityCount}</span>
            </div>
            <div className="flex items-center">
              <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Assessments:</span>
              <span className="ml-2">{classData.assessmentCount}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/admin/system/classes/${classId}/students`}>
                <Users className="h-4 w-4 mr-2" />
                Manage Students
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">Start Date:</span>
              <span className="ml-2">{formatDate(classData.term.startDate)}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">End Date:</span>
              <span className="ml-2">{formatDate(classData.term.endDate)}</span>
            </div>
            {classData.facility && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">Facility:</span>
                <span className="ml-2">{classData.facility.name}</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/admin/system/classes/${classId}/schedule`}>
                <Calendar className="h-4 w-4 mr-2" />
                View Schedule
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Class Overview</CardTitle>
              <CardDescription>
                General information about this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1">{classData.description || 'No description provided'}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Campus</h3>
                  <div className="mt-1 flex items-center">
                    <Link href={`/admin/system/campuses/${classData.campus.id}`} className="text-primary hover:underline">
                      {classData.campus.name}
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Term</h3>
                  <div className="mt-1 flex items-center">
                    <Link href={`/admin/system/terms/${classData.term.id}`} className="text-primary hover:underline">
                      {classData.term.name}
                    </Link>
                    <span className="ml-2 text-muted-foreground">
                      ({formatDate(classData.term.startDate)} - {formatDate(classData.term.endDate)})
                    </span>
                  </div>
                </div>

                {classData.teacher && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Home Teacher</h3>
                    <div className="mt-1 flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={`https://avatar.vercel.sh/${classData.teacher.name}`} alt={classData.teacher.name} />
                        <AvatarFallback>{classData.teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Link href={`/admin/system/teachers/${classData.teacher.id}`} className="text-primary hover:underline">
                        {classData.teacher.name}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Students enrolled in this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Student list will be displayed here.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/system/classes/${classId}/students`}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activities</CardTitle>
              <CardDescription>
                Learning activities for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Activities list will be displayed here.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/system/classes/${classId}/activities`}>
                  <Activity className="h-4 w-4 mr-2" />
                  Manage Activities
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>
                Assessments and grades for this class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Assessments list will be displayed here.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/system/classes/${classId}/assessments`}>
                  <Activity className="h-4 w-4 mr-2" />
                  Manage Assessments
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
