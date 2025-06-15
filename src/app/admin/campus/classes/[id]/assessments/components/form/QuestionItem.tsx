'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash as TrashIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./types";
import { MultipleChoiceOptions } from "./MultipleChoiceOptions";

interface QuestionItemProps {
  form: UseFormReturn<FormValues>;
  questionIndex: number;
  onRemove: () => void;
}

export function QuestionItem({ form, questionIndex, onRemove }: QuestionItemProps) {
  return (
    <Card className="relative">
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={onRemove}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>

      <CardHeader>
        <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name={`questions.${questionIndex}.text`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text*</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter your question" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`questions.${questionIndex}.type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question Type*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                    <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                    <SelectItem value="ESSAY">Essay</SelectItem>
                    <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`questions.${questionIndex}.maxScore`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points*</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="10"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Multiple choice options */}
        {form.watch(`questions.${questionIndex}.type`) === 'MULTIPLE_CHOICE' && (
          <MultipleChoiceOptions form={form} questionIndex={questionIndex} />
        )}
      </CardContent>
    </Card>
  );
}
