"use client";

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/core/button";
import { Card } from "@/components/ui/data-display/card";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumbs } from "@/components/ui/navigation/breadcrumbs";
import { api } from "@/trpc/react";
import { Edit, ChevronLeft, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/atoms/badge";
import { formatDate } from "@/utils/format";
import { SystemStatus } from "@/server/api/constants";
import { useToast } from "@/components/ui/feedback/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ContentStructure } from "@/components/admin/subjects/ContentStructure";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BloomsDistributionChart } from "@/features/bloom/components/taxonomy/BloomsDistributionChart";
import { BloomsDistribution } from "@/features/bloom/types";
import { ThemeWrapper } from "@/features/activties/components/ui/ThemeWrapper";

export default function SubjectDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Unwrap params with React.use() to avoid the warning in Next.js
  const unwrappedParams = params instanceof Promise ? use(params) : params;
  const subjectId = unwrappedParams.id;

  // Fetch subject details
  const { data: subject, isLoading } = api.subject.getById.useQuery({
    id: subjectId,
  });

  // Fetch real-time subject statistics
  const { data: subjectStats, isLoading: isStatsLoading } = api.subject.getStats.useQuery({
    id: subjectId,
  });

  // Delete subject mutation
  const { mutate: deleteSubject, isLoading: isDeleting } = api.subject.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Subject deleted",
        description: "The subject has been successfully deleted.",
        variant: "success",
      });
      router.push("/admin/system/subjects");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject",
        variant: "error",
      });
    },
  });

  const handleDelete = () => {
    deleteSubject({ id: subjectId });
  };

  if (isLoading) {
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
        ]}
      />

      <div className="flex justify-between items-center">
        <PageHeader
          title={subject.name}
          description={`Subject Code: ${subject.code}`}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/system/subjects")}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/system/subjects/${subjectId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the subject
                  and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Content Structure</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Subject Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Code</p>
                    <p className="font-medium">{subject.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{subject.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Credits</p>
                    <p className="font-medium">{subject.credits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge
                      variant={subject.status === SystemStatus.ACTIVE ? "success" : "secondary"}
                    >
                      {subject.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Course</p>
                    <p className="font-medium">{subject.course.name} ({subject.course.code})</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(subject.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Syllabus</h3>
              <div className="space-y-4">
                {subject.syllabus ? (
                  <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(subject.syllabus, null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500">No syllabus information available</p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <ContentStructure subjectId={subjectId} />
        </TabsContent>

        <TabsContent value="stats">
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Subject Statistics</h3>
              {isStatsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Loading statistics...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-4 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground">Total Topics</p>
                    <p className="text-2xl font-semibold text-primary">
                      {subjectStats?.counts?.topics || 0}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground">Total Learning Outcomes</p>
                    <p className="text-2xl font-semibold text-primary">
                      {subjectStats?.counts?.learningOutcomes || 0}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground">Total Rubrics</p>
                    <p className="text-2xl font-semibold text-primary">
                      {subjectStats?.counts?.rubrics || 0}
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-md border border-border">
                    <p className="text-sm text-muted-foreground">Total Rubric Criteria</p>
                    <p className="text-2xl font-semibold text-primary">
                      {subjectStats?.counts?.rubricCriteria || 0}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Bloom's Taxonomy Distribution</h3>
              <div className="h-64">
                <ThemeWrapper>
                  {isStatsLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <p>Loading distribution...</p>
                    </div>
                  ) : subjectStats?.bloomsDistribution ? (
                    <BloomsDistributionChart
                      distribution={subjectStats.bloomsDistribution as BloomsDistribution}
                      editable={false}
                      showLabels={true}
                      showPercentages={true}
                      variant="pie"
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      {subjectStats?.counts?.learningOutcomes === 0
                        ? "No learning outcomes created yet. Create learning outcomes to see Bloom's taxonomy distribution."
                        : "No Bloom's taxonomy distribution available."
                      }
                    </div>
                  )}
                </ThemeWrapper>
              </div>
              {subjectStats?.bloomsDistributionCounts && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p className="text-center">
                    Based on {subjectStats.counts.learningOutcomes} learning outcomes across {subjectStats.counts.topics} topics
                  </p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}