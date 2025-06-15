'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus as PlusIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./types";
import { QuestionItem } from "./QuestionItem";

interface QuestionsSectionProps {
  form: UseFormReturn<FormValues>;
}

export function QuestionsSection({ form }: QuestionsSectionProps) {
  // Add a question to the form
  function addQuestion() {
    const currentQuestions = form.getValues('questions') || [];
    form.setValue('questions', [
      ...currentQuestions,
      {
        text: '',
        type: 'MULTIPLE_CHOICE',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
        maxScore: 10,
      },
    ]);
  }

  // Remove a question from the form
  function removeQuestion(index: number) {
    const currentQuestions = form.getValues('questions') || [];
    form.setValue(
      'questions',
      currentQuestions.filter((_: any, i: number) => i !== index)
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Add questions to your assessment</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {form.watch('questions')?.map((_: any, questionIndex: number) => (
            <QuestionItem
              key={questionIndex}
              form={form}
              questionIndex={questionIndex}
              onRemove={() => removeQuestion(questionIndex)}
            />
          ))}

          {(!form.watch('questions') || form.watch('questions')?.length === 0) && (
            <div className="text-center p-6 border rounded-lg border-dashed">
              <p className="text-muted-foreground mb-2">No questions added yet</p>
              <Button type="button" variant="secondary" onClick={addQuestion}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </div>
          )}

          {/* Add Question button at the bottom */}
          {form.watch('questions')?.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button type="button" variant="secondary" onClick={addQuestion}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Another Question
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
