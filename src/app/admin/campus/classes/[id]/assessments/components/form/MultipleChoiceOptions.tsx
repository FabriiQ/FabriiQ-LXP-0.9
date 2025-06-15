'use client';

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus as PlusIcon, Trash as TrashIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./types";

interface MultipleChoiceOptionsProps {
  form: UseFormReturn<FormValues>;
  questionIndex: number;
}

export function MultipleChoiceOptions({ form, questionIndex }: MultipleChoiceOptionsProps) {
  const { toast } = useToast();

  // Add an option to a multiple choice question
  function addOption() {
    const currentQuestions = form.getValues('questions') || [];
    const currentOptions = currentQuestions[questionIndex]?.options || [];

    const updatedQuestions = [...currentQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: [...currentOptions, { text: '', isCorrect: false }],
    };

    form.setValue('questions', updatedQuestions);
  }

  // Remove an option from a multiple choice question
  function removeOption(optionIndex: number) {
    const currentQuestions = form.getValues('questions') || [];
    const currentOptions = currentQuestions[questionIndex]?.options || [];

    if (currentOptions.length <= 2) {
      toast({
        title: 'Error',
        description: 'Multiple choice questions must have at least 2 options.',
        variant: 'error',
      });
      return;
    }

    const updatedQuestions = [...currentQuestions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: currentOptions.filter((_: any, i: number) => i !== optionIndex),
    };

    form.setValue('questions', updatedQuestions);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel>Answer Options*</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
        >
          <PlusIcon className="h-3 w-3 mr-1" />
          Add Option
        </Button>
      </div>

      {form.watch(`questions.${questionIndex}.options`)?.map((_: any, optionIndex: number) => (
        <div
          key={optionIndex}
          className="flex items-center gap-2"
        >
          <FormField
            control={form.control}
            name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`questions.${questionIndex}.options.${optionIndex}.text`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder={`Option ${optionIndex + 1}`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeOption(optionIndex)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
