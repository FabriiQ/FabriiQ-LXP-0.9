"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BookOpen, ClipboardCheck, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function ContentStudioPage() {
  const { data: session } = useSession();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("worksheets");

  // Get the teacher ID from the session
  api.user.getById.useQuery(
    session?.user?.id || "",
    {
      enabled: !!session?.user?.id,
      onSuccess: (data) => {
        if (data?.teacherProfile?.id) {
          setTeacherId(data.teacherProfile.id);
        }
      }
    }
  );

  // Fetch worksheets for the teacher
  const { data: worksheets, isLoading: isLoadingWorksheets } = api.aiContentStudio.listWorksheetsByTeacher.useQuery(
    { teacherId: teacherId || "" },
    { enabled: !!teacherId }
  );

  // Fetch activities for the teacher
  const { data: activities, isLoading: isLoadingActivities } = api.activityTeacher.listByTeacher.useQuery(
    { teacherId: teacherId || "" },
    { enabled: !!teacherId }
  );

  // Filter activities by purpose
  const learningActivities = activities?.filter((activity: any) => activity.purpose === "LEARNING") || [];
  const assessments = activities?.filter((activity: any) => activity.purpose === "ASSESSMENT") || [];

  return (
    <div className="container py-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>AI Content Studio</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <PageHeader
          title="AI Content Studio"
          description="Create activities, assessments, and worksheets with AI"
        />
        <div className="flex flex-col md:flex-row gap-2">
          <Button asChild className="w-full md:w-auto">
            <Link href="/teacher/content-studio/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Content
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="worksheets" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="worksheets" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Worksheets</span>
            <span className="md:hidden">Sheets</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            <span>Activities</span>
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            <span>Assessments</span>
          </TabsTrigger>
        </TabsList>

        {/* Worksheets Tab */}
        <TabsContent value="worksheets">
          {isLoadingWorksheets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : worksheets && worksheets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {worksheets.map((worksheet) => (
                <Link href={`/teacher/content-studio/${worksheet.id}`} key={worksheet.id}>
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{worksheet.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground">
                        {worksheet.subject?.name || "No subject"}
                        {worksheet.topic && ` • ${worksheet.topic.title}`}
                      </div>
                      <div className="text-sm mt-2">
                        Created: {new Date(worksheet.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't created any worksheets yet.
                </p>
                <Button asChild>
                  <Link href="/teacher/content-studio/create">Create Your First Worksheet</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          {isLoadingActivities ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : learningActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningActivities.map((activity: any) => (
                <Link href={`/teacher/classes/${activity.classId}/activities/${activity.id}`} key={activity.id}>
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground">
                        {activity.subject?.name || "No subject"}
                        {activity.topic && ` • ${activity.topic.title}`}
                      </div>
                      <div className="text-sm mt-2">
                        Created: {new Date(activity.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't created any learning activities yet.
                </p>
                <Button asChild>
                  <Link href="/teacher/content-studio/create">Create Your First Activity</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          {isLoadingActivities ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="p-4">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : assessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assessments.map((assessment: any) => (
                <Link href={`/teacher/classes/${assessment.classId}/activities/${assessment.id}`} key={assessment.id}>
                  <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{assessment.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground">
                        {assessment.subject?.name || "No subject"}
                        {assessment.topic && ` • ${assessment.topic.title}`}
                      </div>
                      <div className="text-sm mt-2">
                        Created: {new Date(assessment.createdAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't created any assessments yet.
                </p>
                <Button asChild>
                  <Link href="/teacher/content-studio/create">Create Your First Assessment</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
