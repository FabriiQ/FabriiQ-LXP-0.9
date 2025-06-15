"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

interface WorksheetCanvasProps {
  subjectId?: string;
  topicId?: string;
}

export function WorksheetCanvas({ subjectId, topicId }: WorksheetCanvasProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

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

  // Mutation for creating a worksheet
  const { mutate: createWorksheet } = api.worksheet.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Worksheet has been created.",
        variant: "default",
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
    <Card>
      <CardContent className="p-6">
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
            {isGenerating ? "Generating..." : "Generate Worksheet"}
          </Button>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>
              The AI-powered worksheet canvas is now generating sample worksheets. In the future, this component will integrate with the LangGraph agents to generate more sophisticated worksheets based on your prompts.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
