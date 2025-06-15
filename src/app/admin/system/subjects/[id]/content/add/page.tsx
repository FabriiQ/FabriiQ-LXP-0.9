"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "~/components/ui/atoms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Textarea } from "@/components/ui/forms/textarea";
import { api } from "~/trpc/react";

// Node types from schema
enum SubjectNodeType {
  CHAPTER = "CHAPTER",
  TOPIC = "TOPIC",
  SUBTOPIC = "SUBTOPIC"
}

// Form schema
const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  type: z.nativeEnum(SubjectNodeType),
});

type FormValues = z.infer<typeof contentFormSchema>;

export default function AddContentPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const subjectId = params.id;
  const parentId = searchParams.get("parentId");
  
  // Fetch subject details for breadcrumb
  const { data: subject } = api.subject.getById.useQuery({
    id: subjectId,
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      content: "",
      type: parentId ? SubjectNodeType.TOPIC : SubjectNodeType.CHAPTER,
    },
  });

  // Set the type based on parentId
  useEffect(() => {
    if (parentId) {
      form.setValue("type", SubjectNodeType.TOPIC);
    } else {
      form.setValue("type", SubjectNodeType.CHAPTER);
    }
  }, [parentId, form]);

  const onSubmit = (values: FormValues) => {
    // Here you would save the content to your API
    console.log("Saving content:", values, "parentId:", parentId);
    
    toast({
      title: "Content added",
      description: "The content has been successfully added.",
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
          { label: "Add Content", href: `/admin/system/subjects/${subjectId}/content/add` },
        ]}
      />

      <div className="flex justify-between items-center">
        <PageHeader
          title="Add Content"
          description={`Add ${parentId ? "a topic to a chapter" : "a new chapter"}`}
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
              name="type"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {!parentId && (
                        <SelectItem value={SubjectNodeType.CHAPTER}>Chapter</SelectItem>
                      )}
                      {parentId && (
                        <>
                          <SelectItem value={SubjectNodeType.TOPIC}>Topic</SelectItem>
                          <SelectItem value={SubjectNodeType.SUBTOPIC}>Subtopic</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of content to add
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormDescription>
                    The title of the content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter content"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The content text
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Content
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
} 