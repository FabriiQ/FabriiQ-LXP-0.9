"use client";

import { useParams, useRouter } from "next/navigation";
import { use } from "react";
import { Button } from "@/components/ui/atoms/button";
import { Card } from "@/components/ui/atoms/card";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { api } from "@/utils/api";
import { PrerequisiteConfig } from "@/components/admin/courses/PrerequisiteConfig";

export default function ViewCoursePage() {
  const params = useParams();
  const router = useRouter();
  // Unwrap params properly using React.use() for future compatibility
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const courseId = unwrappedParams.id as string;

  const { data, isLoading } = api.course.get.useQuery({ id: courseId });

  if (isLoading) return <div>Loading...</div>;
  if (!data?.course) return <div>Course not found</div>;

  const course = data.course;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title={course.name}
          description={`Course Code: ${course.code}`}
        />
        <Button onClick={() => router.push(`/admin/system/courses/${courseId}/edit`)}>
          Edit Course
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Course Details</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Credits</dt>
              <dd className="mt-1">{course.credits}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Level</dt>
              <dd className="mt-1">{course.level}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1">{course.description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Program</dt>
              <dd className="mt-1">{course.program.name}</dd>
            </div>
          </dl>
        </Card>

        <PrerequisiteConfig
          courseId={courseId}
          initialPrerequisites={course.prerequisites?.map(p => p.prerequisiteId)}
        />
      </div>
    </div>
  );
}