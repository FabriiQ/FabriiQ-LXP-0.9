"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/data-display/card";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/feedback/toast";
import { PlateEditor } from "@/components/plate-editor/PlateEditor";

export default function CreateWorksheetPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Get the teacher ID from the session
  api.user.getById.useQuery(
    session?.user?.id || "",
    {
      enabled: !!session?.user?.id,
      onSuccess: (data) => {
        if (data?.teacherProfile?.id) {
          setTeacherId(data.teacherProfile.id);
        }
      }
    }
  );

  // Fetch subjects
  const { data: subjects } = api.subject.getAllSubjects.useQuery();

  // Fetch topics based on selected subject
  const { data: topics } = api.subject.getTopics.useQuery(
    { subjectId },
    { enabled: !!subjectId }
  );

  // Mutation for creating a worksheet
  const { mutate: createWorksheet } = api.aiContentStudio.createWorksheet.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Worksheet has been created.",
        variant: "success",
      });
      router.push(`/teacher/content-studio/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create worksheet.",
        variant: "error",
      });
      setIsGenerating(false);
    },
  });

  const handleGenerateWorksheet = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title for your worksheet.",
        variant: "error",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt to guide the AI.",
        variant: "error",
      });
      return;
    }

    if (!teacherId) {
      toast({
        title: "Error",
        description: "Teacher profile not found.",
        variant: "error",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // In a real implementation, we would call the AI agent here
      // For now, use a placeholder content structure
      const generatedContent = {
        version: 1,
        title: title,
        subject: subjects?.find(s => s.id === subjectId)?.name || "",
        topic: topics?.find(t => t.id === topicId)?.title || "",
        instructions: "Complete the following worksheet.",
        sections: [
          {
            title: "Introduction",
            content: prompt
          },
          {
            title: "Section 1",
            content: "This is the first section of your worksheet."
          },
          {
            title: "Section 2",
            content: "This is the second section of your worksheet."
          }
        ]
      };

      // Create the worksheet
      createWorksheet({
        title,
        content: generatedContent,
        teacherId,
        subjectId: subjectId || undefined,
        topicId: topicId || undefined
      });
    } catch (error) {
      console.error("Error generating worksheet:", error);
      toast({
        title: "Error",
        description: "Failed to generate worksheet. Please try again.",
        variant: "error",
      });
      setIsGenerating(false);
    }
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
            <BreadcrumbPage>Create Worksheet</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title="Create Worksheet"
          description="Generate a printable worksheet with AI"
        />
        <Button variant="outline" asChild className="flex items-center">
          <Link href="/teacher/content-studio">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Worksheet Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your worksheet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject (Optional)</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger id="subject" className="mt-1">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Select
                  value={topicId}
                  onValueChange={setTopicId}
                  disabled={!subjectId || !topics?.length}
                >
                  <SelectTrigger id="topic" className="mt-1">
                    <SelectValue placeholder={!subjectId ? "Select a subject first" : "Select a topic"} />
                  </SelectTrigger>
                  <SelectContent>
                    {topics?.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prompt">Prompt for AI</Label>
              <Textarea
                id="prompt"
                placeholder="Describe what you want in your worksheet. Be specific about content, difficulty level, and any special instructions."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 min-h-[150px]"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateWorksheet}
                disabled={isGenerating || !title || !prompt}
                className="flex items-center"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Worksheet
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
