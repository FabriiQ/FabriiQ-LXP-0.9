'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { BloomsTaxonomyLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { GradingFormValues, gradingFormSchema, GradingContext } from '../../types/grading';
import { RubricGrading } from './RubricGrading';

interface GradingFormProps {
  gradingContext: GradingContext;
  initialValues?: GradingFormValues;
  onSubmit: (values: GradingFormValues) => void;
  isSubmitting?: boolean;
  showRubricGrading?: boolean;
  showSimpleGrading?: boolean;
  showBloomsLevels?: boolean;
  maxScore: number;
  className?: string;
}

/**
 * Centralized grading form component with Bloom's Taxonomy integration
 */
export function GradingForm({
  gradingContext,
  initialValues,
  onSubmit,
  isSubmitting = false,
  showRubricGrading = true,
  showSimpleGrading = true,
  showBloomsLevels = true,
  maxScore,
  className = '',
}: GradingFormProps) {
  const [activeTab, setActiveTab] = useState<string>(
    showRubricGrading && gradingContext.rubric ? 'rubric' : 'simple'
  );

  // Initialize form with schema validation
  const form = useForm<z.infer<typeof gradingFormSchema>>({
    resolver: zodResolver(gradingFormSchema),
    defaultValues: {
      score: initialValues?.score || 0,
      feedback: initialValues?.feedback || '',
      bloomsLevelScores: initialValues?.bloomsLevelScores || {},
      criteriaGrades: initialValues?.criteriaGrades || [],
      questionGrades: initialValues?.questionGrades || [],
    },
  });

  // Handle rubric grading changes
  const handleRubricGradeChange = (values: GradingFormValues) => {
    if (values.score !== undefined) {
      form.setValue('score', values.score);
    }

    if (values.criteriaGrades) {
      form.setValue('criteriaGrades', values.criteriaGrades);
    }

    if (values.bloomsLevelScores) {
      form.setValue('bloomsLevelScores', values.bloomsLevelScores);
    }
  };

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof gradingFormSchema>) => {
    onSubmit(values);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Grade Submission</CardTitle>
        <CardDescription>
          Provide feedback and scoring for this submission
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {(showRubricGrading && gradingContext.rubric) && showSimpleGrading ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  {showRubricGrading && gradingContext.rubric && (
                    <TabsTrigger value="rubric">Rubric Grading</TabsTrigger>
                  )}
                  {showSimpleGrading && (
                    <TabsTrigger value="simple">Simple Grading</TabsTrigger>
                  )}
                </TabsList>

                {showRubricGrading && gradingContext.rubric && (
                  <TabsContent value="rubric" className="space-y-4">
                    <RubricGrading
                      rubricId={gradingContext.rubric.id}
                      rubricType={gradingContext.rubric.type}
                      criteria={gradingContext.rubric.criteria}
                      performanceLevels={gradingContext.rubric.performanceLevels}
                      maxScore={gradingContext.rubric.maxScore}
                      initialValues={initialValues}
                      onGradeChange={handleRubricGradeChange}
                      showBloomsLevels={showBloomsLevels}
                    />
                  </TabsContent>
                )}

                {showSimpleGrading && (
                  <TabsContent value="simple" className="space-y-4">
                    {renderSimpleGradingForm()}
                  </TabsContent>
                )}
              </Tabs>
            ) : showRubricGrading && gradingContext.rubric ? (
              <RubricGrading
                rubricId={gradingContext.rubric.id}
                rubricType={gradingContext.rubric.type}
                criteria={gradingContext.rubric.criteria}
                performanceLevels={gradingContext.rubric.performanceLevels}
                maxScore={gradingContext.rubric.maxScore}
                initialValues={initialValues}
                onGradeChange={handleRubricGradeChange}
                showBloomsLevels={showBloomsLevels}
              />
            ) : (
              renderSimpleGradingForm()
            )}

            <div className="flex justify-end space-x-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  // Helper function to render the simple grading form
  function renderSimpleGradingForm() {
    return (
      <>
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Score</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={maxScore}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Maximum score: {maxScore}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showBloomsLevels && gradingContext.bloomsLevels && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Bloom's Taxonomy Level Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gradingContext.bloomsLevels.map((level) => (
                <FormField
                  key={level}
                  control={form.control}
                  name={`bloomsLevelScores.${level}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        style={{ color: BLOOMS_LEVEL_METADATA[level].color }}
                      >
                        {BLOOMS_LEVEL_METADATA[level].name}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={maxScore}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide feedback to the student..."
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );
  }
}
