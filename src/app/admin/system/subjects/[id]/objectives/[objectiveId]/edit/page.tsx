"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/atoms/card";
import { Button } from "~/components/ui/atoms/button";
import { PageHeader } from "~/components/ui/atoms/page-header";
import { Breadcrumbs } from "~/components/ui/navigation/breadcrumbs";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/feedback/toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import { Textarea } from "@/components/ui/forms/textarea";
import { api } from "~/trpc/react";

// Form schema
const objectiveFormSchema = z.object({
  description: z.string().min(1, "Description is required"),
  assessmentCriteria: z.string().min(1, "Assessment criteria is required"),
});

type FormValues = z.infer<typeof objectiveFormSchema>;

export default function EditObjectivePage({
  params,
}: {
  params: Promise<{ id: string; objectiveId: string }> | { id: string; objectiveId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Unwrap params with React.use() to avoid the warning in Next.js 15+
  const unwrappedParams = use(params);
  const subjectId = unwrappedParams.id;
  const objectiveId = unwrappedParams.objectiveId;

  // Fetch subject details for breadcrumb
  const { data: subject } = api.subject.getById.useQuery({
    id: subjectId,
  });

  // Mock data for the objective - in a real app, you would fetch this from your API
  const [objectiveData, setObjectiveData] = useState({
    id: objectiveId,
    description: "Students will be able to understand basic concepts.",
    assessmentCriteria: "Written exam and practical demonstration.",
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      description: "",
      assessmentCriteria: "",
    },
  });

  // Set form values when objective data is loaded
  useEffect(() => {
    if (objectiveData) {
      form.reset({
        description: objectiveData.description,
        assessmentCriteria: objectiveData.assessmentCriteria,
      });
    }
  }, [objectiveData, form]);

  const onSubmit = (values: FormValues) => {
    // Here you would update the objective in your API
    console.log("Updating objective:", values);

    toast({
      title: "Objective updated",
      description: "The learning objective has been successfully updated.",
      variant: "success",
    });

    router.push(`/admin/system/subjects/${subjectId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/system" },
          { label: "Subjects", href: "/admin/system/subjects" },
          { label: subject?.name || "Subject", href: `/admin/system/subjects/${subjectId}` },
          { label: "Edit Objective", href: `/admin/system/subjects/${subjectId}/objectives/${objectiveId}/edit` },
        ]}
      />

      <div className="flex justify-between items-center">
        <PageHeader
          title="Edit Learning Objective"
          description="Update the learning objective details"
        />
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/subjects/${subjectId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subject
        </Button>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Objective Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter learning objective description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what students should learn or be able to do
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assessmentCriteria"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Assessment Criteria</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter assessment criteria"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe how this objective will be assessed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Update Objective
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}