"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "@/trpc/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import AttendanceGrid from "@/components/teacher/attendance/AttendanceGrid";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface ClassType {
  id: string;
  name: string;
}

interface ClassResponse {
  total: number;
  items: ClassType[];
}

export default function TeacherAttendancePage() {
  const { data: session, status } = useSession();
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/api/auth/signin");
  }
  
  // Get teacher ID from session
  const teacherId = session?.user?.id;
  
  if (!teacherId) {
    return <div>Loading...</div>;
  }
  
  // Get teacher's classes
  const { data: classesResponse, isLoading: isLoadingClasses } = api.class.list.useQuery({ 
    classTeacherId: teacherId,
    status: "ACTIVE"
  });
  
  if (isLoadingClasses) {
    return <TeacherAttendancePageSkeleton />;
  }

  const classes = classesResponse?.items || [];
  
  if (!classes || classes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Attendance Tracker"
            description="Track and manage student attendance"
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
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">You don't have any classes assigned. Please contact an administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Attendance Tracker"
          description="Track and manage student attendance"
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
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Select Class</CardTitle>
          </div>
          <CardDescription>
            Choose a class to view and manage attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedClass || ""} 
            onValueChange={(value: string) => setSelectedClass(value || null)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls: ClassType) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedClass && (
        <AttendanceGrid classId={selectedClass} />
      )}
    </div>
  );
}

function TeacherAttendancePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-[300px]" />
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 