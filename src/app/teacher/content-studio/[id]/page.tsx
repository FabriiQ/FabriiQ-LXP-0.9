"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { api } from "@/utils/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

// Import the WorksheetDetail component
import { WorksheetDetailPage } from "@/features/content-studio/components/WorksheetDetailPage";

export default function ContentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Fetch worksheet details
  const { data: worksheet, isLoading } = api.aiContentStudio.getWorksheetById.useQuery({ id });

  return (
    <div className="container py-6">
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
            <BreadcrumbPage>{isLoading ? "Loading..." : worksheet?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title={isLoading ? <Skeleton className="h-8 w-48" /> : worksheet?.title || "Content Details"}
          description={
            isLoading ? (
              <Skeleton className="h-4 w-64" />
            ) : (
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                <span>
                  {worksheet?.subject?.name || "No subject"}
                  {worksheet?.topic && ` • ${worksheet.topic.title}`}
                </span>
              </div>
            )
          }
        />
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link href="/teacher/content-studio">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : worksheet ? (
        <WorksheetDetailPage worksheet={worksheet} />
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Content not found or has been deleted.
            </p>
            <Button asChild>
              <Link href="/teacher/content-studio">Back to Content Studio</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
