"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface WorksheetCanvasPageProps {
  subjectId?: string;
  topicId?: string;
}

export function WorksheetCanvasPage({ subjectId: initialSubjectId, topicId: initialTopicId }: WorksheetCanvasPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.0-flash");
  const [subjectId, setSubjectId] = useState<string | undefined>(initialSubjectId);
  const [topicId, setTopicId] = useState<string | undefined>(initialTopicId);
  const [activeTab, setActiveTab] = useState<string>("ai-generation");

  // Get the teacher ID from the session
  api.user.getById.useQuery(session?.user?.id || "", {
    enabled: !!session?.user?.id,
    onSuccess: (data) => {
      if (data?.teacherProfile?.id) {
        setTeacherId(data.teacherProfile.id);
      }
    },
    onError: (error) => {
      console.error("Error fetching teacher profile:", error);
    }
  });

  // Fetch all subjects
  const { data: subjects } = api.subject.getAllSubjects.useQuery();

  // Fetch topics for the selected subject
  const { data: topics } = api.subject.getTopics.useQuery(
    { subjectId: subjectId || "" },
    { enabled: !!subjectId }
  );

  // Update subject and topic when props change
  useEffect(() => {
    if (initialSubjectId) {
      setSubjectId(initialSubjectId);
    }
    if (initialTopicId) {
      setTopicId(initialTopicId);
    }
  }, [initialSubjectId, initialTopicId]);

  // Mutation for creating a worksheet
  const { mutate: createWorksheet } = api.worksheet.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Worksheet has been created.",
        variant: "success",
      });
      router.push(`/worksheets/${data.id}`);
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

  /**
   * Generates a sample worksheet based on the provided prompt and title
   */
  const generateSampleWorksheet = (prompt: string, title: string) => {
    // Extract potential subject from the prompt
    const subjects = [
      { name: "Math", keywords: ["math", "mathematics", "algebra", "geometry", "calculus", "arithmetic", "fractions", "equations"] },
      { name: "Science", keywords: ["science", "biology", "chemistry", "physics", "earth", "environment", "cells", "atoms", "molecules"] },
      { name: "English", keywords: ["english", "language", "grammar", "writing", "reading", "literature", "essay", "vocabulary"] },
      { name: "History", keywords: ["history", "social studies", "civilization", "world war", "ancient", "medieval", "revolution"] },
      { name: "Geography", keywords: ["geography", "maps", "countries", "continents", "landforms", "climate"] },
    ];

    // Determine the subject based on keywords in the prompt
    const promptLower = prompt.toLowerCase();
    const detectedSubject = subjects.find(subject =>
      subject.keywords.some(keyword => promptLower.includes(keyword))
    ) || subjects[0]; // Default to Math if no subject is detected

    // Extract grade level from the prompt if present
    const gradeMatch = promptLower.match(/grade (\d+)|\b(\d+)(st|nd|rd|th) grade\b/);
    const grade = gradeMatch ? parseInt(gradeMatch[1] || gradeMatch[2]) : 5; // Default to 5th grade

    // Generate questions based on the detected subject
    let questions = [];

    if (detectedSubject.name === "Math") {
      questions = [
        {
          type: "multiple_choice",
          question: `What is the result of ${grade * 2} × ${grade}?`,
          options: [
            `${grade * grade * 2}`,
            `${grade * grade}`,
            `${grade * 2 + grade}`,
            `${grade * 3}`
          ],
          correctAnswer: 0
        },
        {
          type: "short_answer",
          question: `If you have ${grade * 3} apples and give ${grade} to your friend, how many do you have left?`,
          expectedAnswer: `${grade * 3 - grade}`
        },
        {
          type: "multiple_choice",
          question: `What is ${grade * 10} divided by ${grade}?`,
          options: [`${grade}`, `${grade * 2}`, `10`, `${grade + 10}`],
          correctAnswer: 2
        },
        {
          type: "fill_in_blank",
          question: `Complete the sequence: ${grade}, ${grade * 2}, ${grade * 3}, ___`,
          expectedAnswer: `${grade * 4}`
        },
        {
          type: "true_false",
          question: `${grade} × ${grade} = ${grade * grade + 1}`,
          correctAnswer: false
        }
      ];
    } else if (detectedSubject.name === "Science") {
      questions = [
        {
          type: "multiple_choice",
          question: "Which of the following is NOT a state of matter?",
          options: ["Solid", "Liquid", "Gas", "Energy"],
          correctAnswer: 3
        },
        {
          type: "short_answer",
          question: "What is the process called when a liquid turns into a gas?",
          expectedAnswer: "Evaporation"
        },
        {
          type: "true_false",
          question: "Plants produce oxygen during photosynthesis.",
          correctAnswer: true
        },
        {
          type: "multiple_choice",
          question: "Which planet is known as the Red Planet?",
          options: ["Earth", "Mars", "Venus", "Jupiter"],
          correctAnswer: 1
        },
        {
          type: "fill_in_blank",
          question: "The force that pulls objects toward the center of the Earth is called ___.",
          expectedAnswer: "gravity"
        }
      ];
    } else if (detectedSubject.name === "English") {
      questions = [
        {
          type: "multiple_choice",
          question: "Which of the following is a proper noun?",
          options: ["book", "city", "London", "building"],
          correctAnswer: 2
        },
        {
          type: "short_answer",
          question: "What is the past tense of the verb 'run'?",
          expectedAnswer: "ran"
        },
        {
          type: "fill_in_blank",
          question: "The opposite of 'happy' is ___.",
          expectedAnswer: "sad"
        },
        {
          type: "true_false",
          question: "A verb is a person, place, or thing.",
          correctAnswer: false
        },
        {
          type: "multiple_choice",
          question: "Which sentence is punctuated correctly?",
          options: [
            "Where are you going.",
            "Where are you going?",
            "where are you going?",
            "Where are you going"
          ],
          correctAnswer: 1
        }
      ];
    } else {
      // Generic questions for other subjects
      questions = [
        {
          type: "multiple_choice",
          question: `Question 1 about ${detectedSubject.name} for grade ${grade}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: 0
        },
        {
          type: "short_answer",
          question: `Question 2 about ${detectedSubject.name} for grade ${grade}?`,
          expectedAnswer: "Sample answer"
        },
        {
          type: "true_false",
          question: `This is a true/false question about ${detectedSubject.name}.`,
          correctAnswer: true
        },
        {
          type: "fill_in_blank",
          question: `Complete this ${detectedSubject.name} fact: The capital of France is ___.`,
          expectedAnswer: "Paris"
        },
        {
          type: "multiple_choice",
          question: `Another question about ${detectedSubject.name}?`,
          options: ["First option", "Second option", "Third option", "Fourth option"],
          correctAnswer: 2
        }
      ];
    }

    // Create the worksheet content
    return {
      version: 1,
      type: "worksheet",
      title: title,
      subject: detectedSubject.name,
      grade: grade,
      prompt: prompt,
      sections: [
        {
          type: "instructions",
          content: `This is a ${detectedSubject.name} worksheet for Grade ${grade} students. ${title}. Answer all questions carefully.`
        },
        {
          type: "questions",
          questions: questions
        }
      ]
    };
  };

  const handleGenerate = async () => {
    if (!title) {
      toast({
        title: "Error",
        description: "Please enter a title for the worksheet.",
        variant: "error",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt for the worksheet.",
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

    // This is a placeholder for the actual AI generation
    // In the future, this will call the LangGraph API to generate the worksheet
    setTimeout(() => {
      // Generate sample worksheet content based on the prompt
      const sampleContent = generateSampleWorksheet(prompt, title);

      // Log the generated content for debugging
      console.log("Generated worksheet content:", sampleContent);

      // Create the worksheet
      createWorksheet({
        title,
        content: sampleContent,
        teacherId,
        subjectId,
        topicId
      });
    }, 2000);
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <Tabs defaultValue="ai-generation" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-generation">AI Generation</TabsTrigger>
            <TabsTrigger value="manual-creation">Manual Creation</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-generation" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Worksheet Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your worksheet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subjectId} onValueChange={(value) => {
                  setSubjectId(value);
                  setTopicId(undefined); // Reset topic when subject changes
                }}>
                  <SelectTrigger id="subject">
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

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Select
                  value={topicId}
                  onValueChange={setTopicId}
                  disabled={!subjectId || !topics?.length}
                >
                  <SelectTrigger id="topic">
                    <SelectValue placeholder="Select a topic" />
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

              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    <SelectItem value="gemini-2.0-pro">Gemini 2.0 Pro</SelectItem>
                    <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt for AI Generation</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what kind of worksheet you want to generate..."
                  rows={5}
                />
                <p className="text-sm text-muted-foreground">
                  Example: "Create a math worksheet for 5th grade students on fractions with 10 problems of increasing difficulty."
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || !title || !prompt}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Worksheet"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual-creation" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-title">Worksheet Title</Label>
                <Input
                  id="manual-title"
                  placeholder="Enter a title for your worksheet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-subject">Subject</Label>
                <Select value={subjectId} onValueChange={(value) => {
                  setSubjectId(value);
                  setTopicId(undefined); // Reset topic when subject changes
                }}>
                  <SelectTrigger id="manual-subject">
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

              <div className="space-y-2">
                <Label htmlFor="manual-topic">Topic</Label>
                <Select
                  value={topicId}
                  onValueChange={setTopicId}
                  disabled={!subjectId || !topics?.length}
                >
                  <SelectTrigger id="manual-topic">
                    <SelectValue placeholder="Select a topic" />
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

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Enter instructions for the worksheet..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Questions</Label>
                <Card className="p-4">
                  <p className="text-center text-muted-foreground">
                    Manual question creation interface will be implemented soon.
                  </p>
                </Card>
              </div>

              <Button className="w-full" disabled>
                Create Worksheet (Coming Soon)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
