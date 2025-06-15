"use client";

import { PageHeader } from "~/components/ui/atoms/page-header";
import { Breadcrumbs } from "~/components/ui/navigation/breadcrumbs";
import { SubjectForm } from "~/components/admin/subjects/SubjectForm";
import { Card } from "~/components/ui/atoms/card";

export default function CreateSubjectPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/system" },
          { label: "Subjects", href: "/admin/system/subjects" },
          { label: "Create", href: "/admin/system/subjects/create" },
        ]}
      />

      <div className="flex justify-between items-center">
        <PageHeader
          title="Create New Subject"
          description="Add a new subject to the system"
        />
      </div>

      <Card className="p-6">
        <SubjectForm />
      </Card>
    </div>
  );
} 