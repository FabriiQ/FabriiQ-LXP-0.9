"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ActivityPurpose } from "@/server/api/constants";
import { ActivityTypeSelector } from "@/features/activities/components/activity-creators/ActivityTypeSelector";

export default function ActivityTypePage() {
  const router = useRouter();

  const handleActivityTypeSelect = (activityTypeId: string, purpose?: ActivityPurpose) => {
    // Automatically navigate to the next step when an activity type is selected
    const queryParams = purpose
      ? `type=${activityTypeId}&purpose=${purpose}`
      : `type=${activityTypeId}`;

    router.push(`/teacher/content-studio/create/activity/method?${queryParams}`);
  };

  return (
    <div className="container py-6 max-w-4xl mx-auto px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/content-studio">AI Content Studio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/content-studio/create">Create Content</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Select Activity Type</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Select Activity Type"
          description="Choose the type of learning activity you want to create"
        />
        <Button variant="outline" asChild className="flex items-center">
          <Link href="/teacher/content-studio/create">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <ActivityTypeSelector
        onSelect={handleActivityTypeSelect}
        className="mb-8"
      />
    </div>
  );
}
