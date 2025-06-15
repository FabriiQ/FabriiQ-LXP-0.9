'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Save, Loader2 } from 'lucide-react';

// Form schema for validation
const scoreGradingSchema = z.object({
  score: z.number().min(0, 'Score must be at least 0').max(100, 'Score cannot exceed 100'),
  feedback: z.string().optional(),
});

type ScoreGradingFormValues = z.infer<typeof scoreGradingSchema>;

interface ScoreGradingFormProps {
  initialScore?: number;
  initialFeedback?: string;
  maxScore?: number;
  onSubmit: (data: { score: number, feedback?: string }) => void;
  readOnly?: boolean;
}

/**
 * ScoreGradingForm component for score-based grading
 */
export function ScoreGradingForm({
  initialScore = 0,
  initialFeedback = '',
  maxScore = 100,
  onSubmit,
  readOnly = false,
}: ScoreGradingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with schema validation
  const form = useForm<ScoreGradingFormValues>({
    resolver: zodResolver(scoreGradingSchema),
    defaultValues: {
      score: initialScore,
      feedback: initialFeedback,
    },
  });

  // Handle form submission
  const handleSubmit = (values: ScoreGradingFormValues) => {
    setIsSubmitting(true);

    try {
      onSubmit({
        score: values.score,
        feedback: values.feedback,
      });
    } catch (error) {
      console.error('Error submitting score:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score</FormLabel>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      min={0}
                      max={maxScore}
                      step={1}
                      onValueChange={(values) => field.onChange(values[0])}
                      disabled={readOnly}
                    />
                  </FormControl>
                  <div className="w-16 ml-4">
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      min={0}
                      max={maxScore}
                      disabled={readOnly}
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{maxScore}</span>
                </div>
              </div>
              <FormDescription>
                Score out of {maxScore} points
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide feedback to the student..."
                  {...field}
                  disabled={readOnly}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                Provide constructive feedback to help the student improve
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!readOnly && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Submit Grade
              </>
            )}
          </Button>
        )}
      </form>
    </Form>
  );
}
