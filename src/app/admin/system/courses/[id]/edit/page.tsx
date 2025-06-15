"use client";

import { useParams } from "next/navigation";
import { CourseForm } from "@/components/admin/courses/CourseForm";
import { Card } from "@/components/ui/data-display/card";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";
import { SystemStatus } from "@/server/api/constants";

// Define the interface to match what CourseForm expects
interface CourseFormData {
  code: string;
  name: string;
  description?: string;
  level: number;
  credits: number;
  programId: string;
  status: SystemStatus;
  objectives: Array<{ description: string }>;
  resources: Array<{
    name: string;
    url: string;
    type: string;
    description?: string;
    isRequired: boolean;
  }>;
  syllabus?: Record<string, unknown>;
}

export default function EditCoursePage() {
  const params = useParams();
  const courseId = params?.id as string;

  const { data, isLoading } = api.course.get.useQuery({ id: courseId });

  if (isLoading) return <LoadingSpinner />;
  if (!data?.course) return <div>Course not found</div>;

  // Transform the data to match the form's expected structure
  const courseData: CourseFormData = {
    code: data.course.code,
    name: data.course.name,
    description: data.course.description || '',
    level: data.course.level,
    credits: data.course.credits,
    programId: data.course.programId,
    status: data.course.status as unknown as SystemStatus, // Cast to the correct SystemStatus type
    objectives: ((data.course.settings as Record<string, unknown>)?.objectives as Array<{ description: string }>) || [{ description: '' }],
    resources: ((data.course.settings as Record<string, unknown>)?.resources as Array<{
      name: string;
      url: string;
      type: string;
      description?: string;
      isRequired: boolean;
    }>) || [{
      name: '',
      url: '',
      type: 'TEXTBOOK',
      isRequired: false
    }],
    syllabus: data.course.syllabus as Record<string, unknown> || {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Course"
        description="Modify course details and configuration"
      />
      <Card className="p-6">
        <CourseForm
          initialData={courseData}
          courseId={courseId}
        />
      </Card>
    </div>
  );
}