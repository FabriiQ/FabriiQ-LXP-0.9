"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "~/trpc/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import ClassActivityCreator from "@/components/teacher/activities/ClassActivityCreator";
import { ChevronLeft, Plus, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { ActivityType } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { SystemStatus } from "@prisma/client";

type Json = Prisma.JsonValue;

interface ActivityListResponse {
  items: Activity[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

interface Class {
  id: string;
  name: string;
  code: string;
  status: SystemStatus;
  subject: {
    id: string;
    name: string;
    code: string;
  };
}

// Add interface for API response
interface ClassListResponse {
  items: Class[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  status: SystemStatus;
  subjectId: string;
  topicId?: string;
  classId: string;
  content: Json;
  isGradable: boolean;
  maxScore?: number | null;
  passingScore?: number | null;
  weightage?: number | null;
  gradingConfig?: Json;
  createdAt: Date;
  updatedAt: Date;
  class: Class;
}

export default function TeacherActivitiesPage() {
  const { data: session, status } = useSession();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/api/auth/signin");
  }
  
  const teacherId = session?.user?.id;
  
  if (!teacherId) {
    return <div>Loading...</div>;
  }
  
  // Get teacher's classes
  const { data: classesData, isLoading: isLoadingClasses } = api.class.list.useQuery({ 
    status: SystemStatus.ACTIVE,
    classTeacherId: teacherId // Changed from teacherId to classTeacherId
  });
  
  // Get activities for the teacher
  const { data: activitiesData, isLoading: isLoadingActivities } = api.activity.list.useQuery({ 
    status: SystemStatus.ACTIVE as any,
    classId: selectedClass || undefined,
    page: 1,
    pageSize: 50
  });

  // Type assertion with proper interface
  const classes = ((classesData?.items || []) as unknown as Class[]).map(cls => ({
    id: cls.id,
    name: cls.name,
    code: cls.code,
    status: cls.status,
    subject: {
      id: cls.subject?.id || '',
      name: cls.subject?.name || '',
      code: cls.subject?.code || ''
    }
  }));
  
  const activities = (activitiesData?.items || []) as Activity[];

  // Transform the activities data
  const transformedActivities: Activity[] = activities.map((activity: Activity) => ({
    ...activity,
    scheduledDate: activity.createdAt,
    description: (activity.content as any)?.description as string || "",
    duration: (activity.content as any)?.duration as number || 0,
    materials: (activity.content as any)?.materials as string || undefined,
  }));

  // Group activities by upcoming and past
  const now = new Date();
  const upcomingActivities = transformedActivities.filter((activity: Activity) => 
    new Date(activity.createdAt) >= now
  );
  
  const pastActivities = transformedActivities.filter((activity: Activity) => 
    new Date(activity.createdAt) < now
  );

  // Get activity type badge variant
  const getActivityTypeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type.toLowerCase()) {
      case "lesson":
        return "default";
      case "exercise":
      case "quiz":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  if (isLoadingClasses || isLoadingActivities) {
    return <TeacherActivitiesPageSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Class Activities"
          description="Create and manage activities for your classes"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/teacher/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ClassActivityCreator classId={selectedClass || ""} />
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Activities</CardTitle>
                <div className="flex items-center gap-2">
                  <select 
                    className="border rounded-md p-2 text-sm"
                    value={selectedClass || ""}
                    onChange={(e) => setSelectedClass(e.target.value || null)}
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <CardDescription>
                View and manage your class activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming" className="mt-6">
                  {upcomingActivities.length === 0 ? (
                    <p className="text-gray-500">No upcoming activities.</p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingActivities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="past" className="mt-6">
                  {pastActivities.length === 0 ? (
                    <p className="text-gray-500">No past activities.</p>
                  ) : (
                    <div className="space-y-4">
                      {pastActivities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="all" className="mt-6">
                  {transformedActivities.length === 0 ? (
                    <p className="text-gray-500">No activities found.</p>
                  ) : (
                    <div className="space-y-4">
                      {transformedActivities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  // Get activity type badge variant
  const getActivityTypeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type.toLowerCase()) {
      case "lesson":
        return "default";
      case "exercise":
      case "quiz":
        return "secondary";
      default:
        return "outline";
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{activity.title}</h3>
            <p className="text-sm text-gray-500">
              {activity.class.name} • {activity.class.subject.name}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(activity.createdAt), 'PPP')}
            </p>
            {(activity.content as any)?.description && (
              <p className="mt-2 text-sm">{(activity.content as any).description}</p>
            )}
          </div>
          <Badge variant={getActivityTypeVariant(activity.type)}>
            {activity.type}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherActivitiesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-64 mb-6" />
              
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-md" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 