'use client';

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { StudentPerformanceDashboard } from "@/components/coordinator/StudentPerformanceDashboard";

export default function StudentPerformancePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = params?.id as string;
  const programId = searchParams.get('programId') || undefined;
  const enrollmentId = searchParams.get('enrollmentId') || undefined;
  const backUrl = searchParams.get('back') || "/admin/coordinator/programs";

  return (
    <div className="container mx-auto py-6">
      <StudentPerformanceDashboard 
        studentId={studentId}
        programId={programId}
        enrollmentId={enrollmentId}
        backUrl={backUrl}
      />
    </div>
  );
}
