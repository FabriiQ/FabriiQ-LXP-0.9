"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/core/button";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { SubjectList } from "@/components/admin/subjects/SubjectList";
import { Plus } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/navigation/breadcrumbs";

export default function SubjectsPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/system" },
          { label: "Subjects", href: "/admin/system/subjects" },
        ]}
      />

      <div className="flex justify-between items-center">
        <PageHeader
          title="Subjects"
          description="Manage all subjects in the system"
        />
        <Button onClick={() => router.push("/admin/system/subjects/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Subject
        </Button>
      </div>

      <SubjectList />
    </div>
  );
}