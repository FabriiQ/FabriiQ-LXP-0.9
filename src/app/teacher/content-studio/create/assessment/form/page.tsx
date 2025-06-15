"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronLeft, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/feedback/toast";
import { ActivityPurpose, AssessmentType } from "@/server/api/constants";
import { EnhancedAssessmentDialog } from "@/features/assessments/components/creation/EnhancedAssessmentDialog";

export default function AssessmentFormPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentType = searchParams?.get('type') || AssessmentType.QUIZ;

  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isGradable, setIsGradable] = useState(true);
  const [maxScore, setMaxScore] = useState(100);
  const [passingScore, setPassingScore] = useState(60);
  const [showEnhancedDialog, setShowEnhancedDialog] = useState(false);

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

  // Redirect if no assessment type is selected
  useEffect(() => {
    if (!searchParams?.get('type')) {
      router.push('/teacher/content-studio/create/assessment/type');
    }
  }, [searchParams, router]);

  // Mutation for creating an activity (assessment)
  const { mutate: createActivity } = api.activity.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Assessment has been created.",
        variant: "success",
      });
      router.push(`/teacher/classes/${classId}/activities/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment.",
        variant: "error",
      });
      setIsGenerating(false);
    },
  });

  const handleGenerateAssessment = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title for your assessment.",
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

    if (!classId) {
      toast({
        title: "Error",
        description: "Please select a class for this assessment.",
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
      // For now, use a placeholder content structure based on assessment type
      let generatedContent: any;

      switch (assessmentType) {
        case AssessmentType.QUIZ:
          generatedContent = {
            title: title,
            instructions: "Answer all questions below",
            shuffleQuestions: false,
            assessmentType: AssessmentType.QUIZ,
            questions: [
              {
                id: '1',
                type: 'MULTIPLE_CHOICE',
                question: 'Sample question 1?',
                options: [
                  { id: 'a', text: 'Option A', isCorrect: false },
                  { id: 'b', text: 'Option B', isCorrect: true },
                  { id: 'c', text: 'Option C', isCorrect: false },
                ],
                points: 10,
              },
              {
                id: '2',
                type: 'TRUE_FALSE',
                question: 'Sample true/false question?',
                correctAnswer: 'true',
                points: 10,
              },
              {
                id: '3',
                type: 'SHORT_ANSWER',
                question: 'Sample short answer question?',
                correctAnswer: 'Sample answer',
                points: 10,
              }
            ],
            feedback: {
              passingScore: passingScore,
              passMessage: 'Great job!',
              failMessage: 'Please try again',
              showCorrectAnswers: true,
            },
          };
          break;
        case AssessmentType.EXAM:
          generatedContent = {
            title: title,
            instructions: "Complete all sections of this exam",
            assessmentType: AssessmentType.EXAM,
            timeLimit: 60, // minutes
            sections: [
              {
                title: "Section 1",
                questions: [
                  {
                    id: '1',
                    type: 'MULTIPLE_CHOICE',
                    question: 'Sample exam question 1?',
                    options: [
                      { id: 'a', text: 'Option A', isCorrect: false },
                      { id: 'b', text: 'Option B', isCorrect: true },
                      { id: 'c', text: 'Option C', isCorrect: false },
                    ],
                    points: 10,
                  },
                  {
                    id: '2',
                    type: 'ESSAY',
                    question: 'Write a short essay about the topic.',
                    points: 20,
                  }
                ]
              }
            ]
          };
          break;
        case AssessmentType.ASSIGNMENT:
        case AssessmentType.PROJECT:
          generatedContent = {
            title: title,
            instructions: prompt,
            assessmentType: assessmentType,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
            rubric: [
              {
                criterion: "Content",
                weight: 40,
                levels: [
                  { score: 4, description: "Excellent" },
                  { score: 3, description: "Good" },
                  { score: 2, description: "Satisfactory" },
                  { score: 1, description: "Needs Improvement" }
                ]
              },
              {
                criterion: "Organization",
                weight: 30,
                levels: [
                  { score: 4, description: "Excellent" },
                  { score: 3, description: "Good" },
                  { score: 2, description: "Satisfactory" },
                  { score: 1, description: "Needs Improvement" }
                ]
              },
              {
                criterion: "Presentation",
                weight: 30,
                levels: [
                  { score: 4, description: "Excellent" },
                  { score: 3, description: "Good" },
                  { score: 2, description: "Satisfactory" },
                  { score: 1, description: "Needs Improvement" }
                ]
              }
            ]
          };
          break;
        default:
          generatedContent = {
            title: title,
            instructions: prompt,
            assessmentType: assessmentType,
            questions: []
          };
      }

      // Create the assessment
      createActivity({
        title,
        purpose: ActivityPurpose.ASSESSMENT,
        assessmentType: assessmentType as AssessmentType,
        subjectId: subjectId,
        topicId: topicId || undefined,
        classId: classId,
        content: generatedContent,
        isGradable,
        maxScore: isGradable ? maxScore : undefined,
        passingScore: isGradable ? passingScore : undefined,
        useComponentSystem: true
      });
    } catch (error) {
      console.error("Error generating assessment:", error);
      toast({
        title: "Error",
        description: "Failed to generate assessment. Please try again.",
        variant: "error",
      });
      setIsGenerating(false);
    }
  };

  // Handle enhanced dialog success
  const handleEnhancedDialogSuccess = (assessmentId: string) => {
    toast({
      title: "Success",
      description: "Assessment created successfully with learning outcomes and rubric integration.",
      variant: "success",
    });
    // Navigate to the assessment view or class activities
    router.push(`/teacher/classes/${classId}/assessments/${assessmentId}`);
  };

  // Get assessment type display name
  const getAssessmentTypeDisplayName = () => {
    switch (assessmentType) {
      case AssessmentType.QUIZ:
        return "Quiz";
      case AssessmentType.EXAM:
        return "Exam";
      case AssessmentType.ASSIGNMENT:
        return "Assignment";
      case AssessmentType.PROJECT:
        return "Project";
      case AssessmentType.PRESENTATION:
        return "Presentation";
      case AssessmentType.HOMEWORK:
        return "Homework";
      default:
        return "Assessment";
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
            <BreadcrumbLink href="/teacher/content-studio/create">Create Content</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/content-studio/create/assessment/type">Select Assessment Type</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create {getAssessmentTypeDisplayName()}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-6">
        <PageHeader
          title={`Create ${getAssessmentTypeDisplayName()}`}
          description="Generate an assessment with AI"
        />
        <Button variant="outline" asChild className="flex items-center">
          <Link href="/teacher/content-studio/create/assessment/type">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Enhanced Assessment Creation Option */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enhanced Assessment Creation
          </CardTitle>
          <CardDescription>
            Create assessments with learning outcomes, rubrics, and Bloom's Taxonomy integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Use our enhanced workflow to create assessments that are fully aligned with your curriculum:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Select learning outcomes from your topics</li>
                <li>• Choose appropriate rubrics for grading</li>
                <li>• Set Bloom's Taxonomy distribution</li>
                <li>• Automatic topic mastery tracking</li>
              </ul>
            </div>
            <Button
              onClick={() => setShowEnhancedDialog(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Create Enhanced Assessment
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center my-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or use the legacy AI generator
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Assessment Generator (Legacy)</CardTitle>
          <CardDescription>
            Generate a basic assessment using AI prompts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Assessment Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for your assessment"
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
              <Label htmlFor="prompt">Prompt for AI</Label>
              <Textarea
                id="prompt"
                placeholder={`Describe what you want in your ${getAssessmentTypeDisplayName().toLowerCase()}. Be specific about content, difficulty level, and any special instructions.`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-1 min-h-[150px]"
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isGradable" className="cursor-pointer">Gradable Assessment</Label>
                <Switch
                  id="isGradable"
                  checked={isGradable}
                  onCheckedChange={setIsGradable}
                />
              </div>

              {isGradable && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxScore">Maximum Score</Label>
                    <Input
                      id="maxScore"
                      type="number"
                      min={1}
                      value={maxScore}
                      onChange={(e) => setMaxScore(parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min={1}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(parseInt(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGenerateAssessment}
                disabled={isGenerating || !title || !prompt || !classId || !subjectId}
                className="flex items-center"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate {getAssessmentTypeDisplayName()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Assessment Dialog */}
      <EnhancedAssessmentDialog
        open={showEnhancedDialog}
        onOpenChange={setShowEnhancedDialog}
        classId={classId}
        onSuccess={handleEnhancedDialogSuccess}
      />
    </div>
  );
}
