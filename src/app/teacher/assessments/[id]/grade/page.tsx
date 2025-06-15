"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { api } from "@/trpc/react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import GradingInterface from "@/components/teacher/assessments/GradingInterface";
import { ChevronLeft, BarChart } from "lucide-react";
import Link from "next/link";

interface GradePageProps {
  params: {
    id: string;
  };
}

export default function AssessmentGradePage({ params }: GradePageProps) {
  const { data: session, status } = useSession();
  const assessmentId = params.id;
  
  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/api/auth/signin");
  }
  
  // Get teacher ID from session
  const teacherId = session?.user?.id;
  
  if (!teacherId) {
    return <div>Loading...</div>;
  }
  
  // Get assessment details
  const { data: assessment, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({ 
    id: assessmentId 
  });
  
  if (isLoadingAssessment) {
    return <AssessmentGradePageSkeleton />;
  }
  
  if (!assessment) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Grade Assessment"
            description="Review and grade student submissions"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/teacher/assessments">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Assessments
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="p-6 text-center">
          <h2 className="text-xl font-medium mb-2">Assessment Not Found</h2>
          <p className="text-gray-500">The assessment you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Grade Assessment"
          description="Review and grade student submissions"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/teacher/assessments/${assessmentId}/results`}>
              <BarChart className="h-4 w-4 mr-1" />
              View Results
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/teacher/assessments">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Assessments
            </Link>
          </Button>
        </div>
      </div>
      
      <GradingInterface assessmentId={assessmentId} />
    </div>
  );
}

function AssessmentGradePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="space-y-6">
        <Skeleton className="h-[600px] w-full rounded-md" />
      </div>
    </div>
  );
} 