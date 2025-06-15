"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft } from "lucide-react";
import { Sparkle } from "@/components/ui/icons/sparkle";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/feedback/toast";
import { ActivityPurpose, LearningActivityType } from "@/server/api/constants";
// Import components from the new implementation
import { ActivityCreationPage } from "@/features/contnet-studio/pages/ActivityCreationPage";
import { ContentStudioProvider, CreationMethod } from "@/features/contnet-studio";
import { ContentType } from "@/features/contnet-studio/components/ContentCreationFlow";
import { AgentOrchestratorProvider } from "@/features/agents/core/AgentOrchestratorProvider";

export default function ActivityFormPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityType = searchParams.get('type') || ActivityPurpose.SELF_STUDY;
  const activityPurpose = searchParams.get('purpose');
  // Get the creation method from the URL or default to AI_ASSISTED
  const methodParam = searchParams.get('method');
  const creationMethod = CreationMethod.AI_ASSISTED; // This page is only for AI-assisted creation

  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, any> | null>(null);

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

  // Fetch classes for the teacher
  const { data: classes } = api.classTeacher.getByTeacher.useQuery(
    { teacherId: teacherId || "" },
    { enabled: !!teacherId }
  );

  // Redirect if no activity type is selected
  useEffect(() => {
    if (!searchParams.get('type')) {
      router.push('/teacher/content-studio/create/activity/type');
    }
  }, [searchParams, router]);

  // Mutation for creating an activity
  const { mutate: createActivity } = api.activity.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Activity has been created.",
        variant: "success",
      });
      router.push(`/teacher/classes/${classId}/activities/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create activity.",
        variant: "error",
      });
      setIsGenerating(false);
    },
  });

  const handleGenerateActivity = async () => {
    if (!classId) {
      toast({
        title: "Error",
        description: "Please select a class for this activity.",
        variant: "error",
      });
      return;
    }

    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title for your activity.",
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
      let content: Record<string, any>;

      // Create content based on activity type
      switch (activityType) {
        // Content types (from LearningActivityType)
        case LearningActivityType.READING:
        case ActivityPurpose.LECTURE:
        case ActivityPurpose.TUTORIAL:
        case ActivityPurpose.SELF_STUDY:
          content = {
            version: 1,
            type: "reading",
            activityType: "reading",
            title: title,
            content: [
              {
                type: "p",
                children: [{ text: prompt }]
              }
            ],
            checkpoints: []
          };
          break;

        case LearningActivityType.VIDEO:
        case ActivityPurpose.DEMONSTRATION:
          content = {
            version: 1,
            type: "video",
            activityType: "video",
            title: title,
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            description: prompt,
            questions: []
          };
          break;

        case LearningActivityType.H5P:
          content = {
            version: 1,
            type: "h5p",
            activityType: "h5p",
            title: title,
            description: prompt,
            h5pUrl: "",
            h5pContentId: "",
            h5pContentType: "interactive-video"
          };
          break;

        case LearningActivityType.FLASH_CARDS:
          content = {
            version: 1,
            type: "flash-cards",
            activityType: "flash-cards",
            title: title,
            description: prompt,
            cards: [
              { front: "Front of card 1", back: "Back of card 1" },
              { front: "Front of card 2", back: "Back of card 2" },
              { front: "Front of card 3", back: "Back of card 3" }
            ]
          };
          break;

        case LearningActivityType.MULTIPLE_CHOICE:
          content = {
            version: 1,
            type: "multiple-choice",
            activityType: "multiple-choice",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                question: "Sample question?",
                options: [
                  { id: "a", text: "Option A", isCorrect: false },
                  { id: "b", text: "Option B", isCorrect: true },
                  { id: "c", text: "Option C", isCorrect: false }
                ]
              }
            ]
          };
          break;

        case LearningActivityType.MULTIPLE_RESPONSE:
          content = {
            version: 1,
            type: "multiple-response",
            activityType: "multiple-response",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                question: "Sample question with multiple correct answers?",
                options: [
                  { id: "a", text: "Option A", isCorrect: true },
                  { id: "b", text: "Option B", isCorrect: true },
                  { id: "c", text: "Option C", isCorrect: false }
                ]
              }
            ]
          };
          break;

        case LearningActivityType.TRUE_FALSE:
          content = {
            version: 1,
            type: "true-false",
            activityType: "true-false",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                statement: "This is a sample true/false statement.",
                isTrue: true,
                explanation: "Explanation for why this statement is true."
              }
            ]
          };
          break;

        case LearningActivityType.FILL_IN_THE_BLANKS:
          content = {
            version: 1,
            type: "fill-in-the-blanks",
            activityType: "fill-in-the-blanks",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                text: "The capital of France is [Paris].",
                blanks: [
                  { id: "1", answer: "Paris", alternatives: ["paris"] }
                ]
              }
            ]
          };
          break;

        case LearningActivityType.MATCHING:
          content = {
            version: 1,
            type: "matching",
            activityType: "matching",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                pairs: [
                  { id: "1", left: "France", right: "Paris" },
                  { id: "2", left: "Germany", right: "Berlin" },
                  { id: "3", left: "Italy", right: "Rome" }
                ]
              }
            ]
          };
          break;

        case LearningActivityType.SEQUENCE:
          content = {
            version: 1,
            type: "sequence",
            activityType: "sequence",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                instruction: "Arrange the following events in chronological order:",
                items: [
                  { id: "1", text: "First event", position: 1 },
                  { id: "2", text: "Second event", position: 2 },
                  { id: "3", text: "Third event", position: 3 }
                ]
              }
            ]
          };
          break;

        case LearningActivityType.DRAG_AND_DROP:
          content = {
            version: 1,
            type: "drag-and-drop",
            activityType: "drag-and-drop",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                instruction: "Drag the items to their correct categories:",
                categories: [
                  { id: "1", name: "Category 1" },
                  { id: "2", name: "Category 2" }
                ],
                items: [
                  { id: "1", text: "Item 1", categoryId: "1" },
                  { id: "2", text: "Item 2", categoryId: "2" },
                  { id: "3", text: "Item 3", categoryId: "1" }
                ]
              }
            ]
          };
          break;

        case LearningActivityType.DRAG_THE_WORDS:
          content = {
            version: 1,
            type: "drag-the-words",
            activityType: "drag-the-words",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                text: "The *quick* *brown* fox jumps over the *lazy* dog.",
                instruction: "Drag the words to their correct positions."
              }
            ]
          };
          break;

        case LearningActivityType.NUMERIC:
          content = {
            version: 1,
            type: "numeric",
            activityType: "numeric",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                question: "What is 2 + 2?",
                answer: 4,
                tolerance: 0,
                unit: ""
              }
            ]
          };
          break;

        case LearningActivityType.QUIZ:
          content = {
            version: 1,
            type: "quiz",
            activityType: "quiz",
            title: title,
            description: prompt,
            questions: [
              {
                id: "1",
                type: "MULTIPLE_CHOICE",
                question: "Sample question?",
                options: [
                  { id: "a", text: "Option A", isCorrect: false },
                  { id: "b", text: "Option B", isCorrect: true },
                  { id: "c", text: "Option C", isCorrect: false }
                ]
              }
            ]
          };
          break;

        case ActivityPurpose.DISCUSSION:
          content = {
            version: 1,
            type: "discussion",
            activityType: "discussion",
            title: title,
            description: prompt,
            discussionPoints: [
              "Discussion point 1",
              "Discussion point 2",
              "Discussion point 3"
            ]
          };
          break;

        default:
          content = {
            version: 1,
            type: "interactive",
            activityType: activityType,
            title: title,
            description: prompt,
            sections: []
          };
      }

      // Ensure the content has the required fields
      const contentWithRequiredFields = {
        ...content,
        // Make sure these fields are always present
        version: content.version || 1,
        activityType: content.activityType || activityType
      };

      console.log("Generated activity content:", contentWithRequiredFields);

      // Set the generated content and show the conversation interface
      setGeneratedContent(contentWithRequiredFields);
      setShowConversation(true);
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating activity:", error);
      toast({
        title: "Error",
        description: "Failed to generate activity. Please try again.",
        variant: "error",
      });
      setIsGenerating(false);
    }
  };

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

  // Handle saving the activity after AI conversation
  const handleSaveActivity = (finalContent: any) => {
    setIsGenerating(true);

    try {
      // Ensure the content has the required fields
      const contentWithRequiredFields = {
        ...finalContent,
        // Add required fields if they don't exist
        version: finalContent.version || 1,
        activityType: finalContent.activityType || activityType
      };

      console.log("Saving activity with content:", contentWithRequiredFields);

      // Use the purpose parameter if available, otherwise determine from activity type
      let purpose: ActivityPurpose;
      let learningType: LearningActivityType | undefined;

      if (activityPurpose) {
        // If we have a specific purpose parameter, use it
        purpose = activityPurpose as ActivityPurpose;
        // If the activity type is a LearningActivityType, use it
        learningType = Object.values(LearningActivityType).includes(activityType as LearningActivityType)
          ? activityType as LearningActivityType
          : undefined;
      } else {
        // Determine if the activity type is a purpose or a learning type
        const isPurpose = Object.values(ActivityPurpose).includes(activityType as ActivityPurpose);
        purpose = isPurpose ? activityType as ActivityPurpose : ActivityPurpose.LEARNING;
        learningType = !isPurpose ? activityType as LearningActivityType : undefined;
      }

      // Create the activity with the final content
      createActivity({
        title: finalContent.title || title,
        purpose: purpose,
        learningType: learningType,
        subjectId: subjectId,
        topicId: topicId || undefined,
        classId: classId,
        content: contentWithRequiredFields,
        isGradable: false,
        useComponentSystem: true
      });
    } catch (error) {
      console.error("Error saving activity:", error);
      toast({
        title: "Error",
        description: "Failed to save activity. Please try again.",
        variant: "error",
      });
      setIsGenerating(false);
    }
  };

  // Handle going back from the conversation interface
  const handleBackFromConversation = () => {
    setShowConversation(false);
    setGeneratedContent(null);
  };

  return (
    <div className="container py-6 max-w-6xl mx-auto px-4">
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
            <BreadcrumbLink href={`/teacher/content-studio/create/activity/method?type=${activityType}${activityPurpose ? `&purpose=${activityPurpose}` : ''}`}>Select Method</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create {getActivityTypeDisplayName()}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {showConversation && generatedContent ? (
        <AgentOrchestratorProvider>
          <ContentStudioProvider
            initialState={{
              contentType: ContentType.ACTIVITY,
              creationMethod: creationMethod,
              activityType: activityType,
              activityPurpose: activityPurpose ? activityPurpose as ActivityPurpose : ActivityPurpose.LEARNING,
              subjectId: subjectId,
              topicIds: topicId ? [topicId] : [],
              classId: classId,
              initialContent: generatedContent,
              onSaveContent: handleSaveActivity,
              onBack: handleBackFromConversation
            }}
          >
            <ActivityCreationPage />
          </ContentStudioProvider>
        </AgentOrchestratorProvider>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <PageHeader
              title={`Create ${getActivityTypeDisplayName()} Activity with AI`}
              description="Generate a learning activity with AI assistance"
            />
            <Button
              variant="outline"
              asChild
              className="flex items-center"
            >
              <Link href={`/teacher/content-studio/create/activity/method?type=${activityType}${activityPurpose ? `&purpose=${activityPurpose}` : ''}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Activity Generation</CardTitle>
              <CardDescription>
                Provide details to help the AI generate your {getActivityTypeDisplayName().toLowerCase()} activity
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger id="class" className="mt-1">
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Activity Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your activity"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
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
                    placeholder={`Describe what you want in your ${getActivityTypeDisplayName().toLowerCase()} activity. Be specific about content, difficulty level, and any special instructions.`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 min-h-[150px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleGenerateActivity}
                    disabled={isGenerating || !title || !prompt || !classId || !subjectId}
                    className="flex items-center"
                  >
                    {isGenerating ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Sparkle className="h-4 w-4 mr-2" />
                        Generate Activity
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
