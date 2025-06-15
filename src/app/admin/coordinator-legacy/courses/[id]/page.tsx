'use client';

import React from "react";
import { useParams } from "next/navigation";
import { CoordinatorCourseDetail } from "@/components/coordinator/CoordinatorCourseDetail";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading";

export default function CoordinatorCourseDetailPage() {
  const params = useParams();
  const courseId = params?.id as string;

  // Fetch course details
  const { data: courseData, isLoading: courseLoading } = api.course.get.useQuery({
    id: courseId,
  });

  // Extract the course from the response
  const course = courseData?.course;

  // Map the course data to match the expected interface
  const mappedCourse = course ? {
    ...course,
    subjects: course.subjects?.map(subject => {
      // Create a safe subject object with the required fields
      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        status: subject.status,
        description: null // Default to null since we can't safely extract it
      };
    }) || []
  } : null;

  // Fetch program name
  const { data: programData, isLoading: programLoading } = api.program.getById.useQuery(
    { id: courseData?.course?.programId || "" },
    { enabled: !!courseData?.course?.programId }
  ) as { data: { name: string } | undefined, isLoading: boolean };

  // Extract program name
  const programName = programData?.name || "Program";

  const isLoading = courseLoading || (courseData?.course?.programId && programLoading);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (!courseData || !courseData.course) {
    return (
      <div className="container mx-auto py-6">
        <div className="p-4 bg-destructive/10 rounded-md">
          <p className="text-destructive">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <CoordinatorCourseDetail
        course={mappedCourse as any}
        programName={programName}
      />
    </div>
  );
}
