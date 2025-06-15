"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/core/button";
import { Card } from "@/components/ui/data-display/card";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumbs } from "@/components/ui/navigation/breadcrumbs";
import { api } from "@/trpc/react";
import { ChevronLeft } from "lucide-react";
import { SubjectForm } from "@/components/admin/subjects/SubjectForm";

export default function EditSubjectPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  // Get the subject ID from params - use a ref to avoid re-renders
  const subjectIdRef = useRef(params.id);
  const subjectId = subjectIdRef.current;

  // Fetch subject details
  const { data: subject, isLoading: isLoadingSubject } = api.subject.getById.useQuery({
    id: subjectId,
  });

  if (isLoadingSubject) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading subject details...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <p>Subject not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/system" },
          { label: "Subjects", href: "/admin/system/subjects" },
          { label: subject.name, href: `/admin/system/subjects/${subjectId}` },
          { label: "Edit", href: `/admin/system/subjects/${subjectId}/edit` },
        ]}
      />

      <div className="flex justify-between items-center">
        <PageHeader
          title={`Edit Subject: ${subject.name}`}
          description={`Subject Code: ${subject.code}`}
        />
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/subjects/${subjectId}`)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Subject
        </Button>
      </div>

      <Card className="p-6">
        <SubjectForm
          initialData={{
            code: subject.code,
            name: subject.name,
            credits: subject.credits,
            courseId: subject.courseId,
            status: subject.status as any,
            syllabus: subject.syllabus ? subject.syllabus as any : {},
          }}
          subjectId={subjectId}
        />
      </Card>
    </div>
  );
}