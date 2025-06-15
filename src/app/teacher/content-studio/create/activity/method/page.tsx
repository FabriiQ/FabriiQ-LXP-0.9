"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft, Edit } from "lucide-react";
import { Sparkle } from "@/components/ui/icons/sparkle";
import Link from "next/link";
import { ActivityPurpose, LearningActivityType } from "@/server/api/constants";
import { toast } from "@/components/ui/feedback/toast";

export default function ActivityMethodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityType = searchParams.get('type') || ActivityPurpose.SELF_STUDY;
  const activityPurpose = searchParams.get('purpose');

  // Redirect if no activity type is selected
  useEffect(() => {
    if (!searchParams.get('type')) {
      router.push('/teacher/content-studio/create/activity/type');
    }
  }, [searchParams, router]);

  // Get activity type display name
  const getActivityTypeDisplayName = () => {
    // Check if it's a LearningActivityType
    switch (activityType) {
      // Content types (from LearningActivityType)
      case LearningActivityType.READING:
        return "Reading";
      case LearningActivityType.VIDEO:
        return "Video";
      case LearningActivityType.QUIZ:
        return "Quiz";
      case LearningActivityType.MULTIPLE_CHOICE:
        return "Multiple Choice";
      case LearningActivityType.MULTIPLE_RESPONSE:
        return "Multiple Response";
      case LearningActivityType.TRUE_FALSE:
        return "True/False";
      case LearningActivityType.FILL_IN_THE_BLANKS:
        return "Fill in the Blanks";
      case LearningActivityType.MATCHING:
        return "Matching";
      case LearningActivityType.SEQUENCE:
        return "Sequence";
      case LearningActivityType.DRAG_AND_DROP:
        return "Drag and Drop";
      case LearningActivityType.DRAG_THE_WORDS:
        return "Drag the Words";
      case LearningActivityType.NUMERIC:
        return "Numeric";
      case LearningActivityType.FLASH_CARDS:
        return "Flash Cards";
      case LearningActivityType.H5P:
        return "H5P";
      case LearningActivityType.OTHER:
        return "Other";

      // Delivery formats (from ActivityPurpose)
      case ActivityPurpose.SELF_STUDY:
        return "Self Study";
      case ActivityPurpose.LECTURE:
        return "Lecture";
      case ActivityPurpose.TUTORIAL:
        return "Tutorial";
      case ActivityPurpose.WORKSHOP:
        return "Workshop";
      case ActivityPurpose.DISCUSSION:
        return "Discussion";
      case ActivityPurpose.DEMONSTRATION:
        return "Demonstration";
      case ActivityPurpose.GROUP_WORK:
        return "Group Work";
      case ActivityPurpose.OTHER:
        return "Other";
      default:
        return "Activity";
    }
  };

  const handleManualCreation = () => {
    // For manual creation, redirect directly to the appropriate activity editor
    toast({
      title: "Manual Creation",
      description: `Redirecting to manual creation for ${getActivityTypeDisplayName()} activity...`,
      variant: "info",
    });

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('type', activityType);
    if (activityPurpose) {
      queryParams.set('purpose', activityPurpose);
    }

    // Redirect to the appropriate activity editor based on the activity type
    // This should go to a dedicated manual editor page for the specific activity type
    router.push(`/teacher/classes/activity-editor?${queryParams.toString()}`);
  };

  const handleAICreation = () => {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('type', activityType);
    if (activityPurpose) {
      queryParams.set('purpose', activityPurpose);
    }
    queryParams.set('method', 'AI_ASSISTED');

    // For AI-assisted creation, redirect to the form page
    router.push(`/teacher/content-studio/create/activity/form?${queryParams.toString()}`);
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
            <BreadcrumbLink href="/teacher/content-studio/create/activity/type">Select Activity Type</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Choose Creation Method</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title={`Create ${getActivityTypeDisplayName()} Activity`}
          description="Choose how you want to create your activity"
        />
        <Button variant="outline" asChild className="flex items-center">
          <Link href="/teacher/content-studio/create/activity/type">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted border-2 hover:border-primary"
          onClick={handleManualCreation}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Edit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Manual Creation</h3>
              <p className="text-muted-foreground">
                Create your activity from scratch with full control over all content and settings.
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Complete creative control</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Structured activity editor</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Use your own content</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted border-2 hover:border-primary"
          onClick={handleAICreation}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Sparkle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Assisted</h3>
              <p className="text-muted-foreground">
                Let AI help you create your activity based on your parameters. You can refine the content afterward.
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Quick content generation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Customizable parameters</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Editable after generation</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
