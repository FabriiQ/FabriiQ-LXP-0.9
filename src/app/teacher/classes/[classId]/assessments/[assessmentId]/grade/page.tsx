"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, BarChart } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import EnhancedAssessmentGradingInterface from "@/components/teacher/assessments/grading/EnhancedAssessmentGradingInterface";

export default function GradeAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const assessmentId = params?.assessmentId as string;

  // Fetch assessment details with rubric information
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({
    id: assessmentId,
    includeSubmissions: true
  }, {
    enabled: !!assessmentId,
    onError: (error) => {
      console.error("Error fetching assessment:", error);
    }
  });

  // Fetch class details
  const { data: classDetails } = api.class.getById.useQuery({
    classId
  }, {
    enabled: !!classId
  });

  // Check if user is a teacher for this class
  const { data: isTeacher } = api.teacherRole.isClassTeacher.useQuery({
    classId
  }, {
    enabled: !!classId
  });

  if (isLoadingAssessment) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h3 className="text-lg font-medium mb-2">Assessment Not Found</h3>
          <p>The assessment you're looking for doesn't exist or has been removed.</p>
          <Link href={`/teacher/classes/${classId}/assessments`}>
            <Button variant="outline" className="mt-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/classes/${classId}`}>
              {classDetails?.name || "Class"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/classes/${classId}/assessments`}>
              Assessments
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/classes/${classId}/assessments/${assessmentId}`}>
              {assessment.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Grade</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mt-4 mb-6">
        <PageHeader
          title={`Grade Assessment: ${assessment.title}`}
          description={`${assessment.subject?.name || "Subject"} • ${classDetails?.name || "Class"}`}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/teacher/classes/${classId}/assessments/${assessmentId}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Assessment
            </Link>
          </Button>
        </div>
      </div>

      <EnhancedAssessmentGradingInterface
        assessment={assessment}
        classId={classId}
        isClassTeacher={!!isTeacher}
      />
    </div>
  );
}
