"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import AssessmentCreator from "@/components/teacher/assessments/AssessmentCreator";

interface ClassType {
  id: string;
  name: string;
}

interface ClassResponse {
  total: number;
  items: ClassType[];
}

export default function CreateAssessmentPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/api/auth/signin");
    },
  });

  const teacherId = session?.user?.id;
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  if (!teacherId) {
    return null;
  }

  const { data: classesResponse, isLoading } = api.class.list.useQuery({ 
    classTeacherId: teacherId,
    status: "ACTIVE"
  });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const classes = classesResponse?.items || [];

  if (!classes || classes.length === 0) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Create Assessment"
            description="Create a new assessment for your class"
          />
          <Link href="/teacher/assessments">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Assessments
            </Button>
          </Link>
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
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Create Assessment"
          description="Create a new assessment for your class"
        />
        <Link href="/teacher/assessments">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Class
            </label>
            <Select
              value={selectedClassId}
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="w-full">
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
          </div>
          
          {selectedClassId ? (
            <AssessmentCreator classId={selectedClassId} />
          ) : (
            <p className="text-gray-500 text-center py-10">
              Please select a class to create an assessment
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 