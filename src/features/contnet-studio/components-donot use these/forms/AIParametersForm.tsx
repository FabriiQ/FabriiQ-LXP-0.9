'use client';

/**
 * AIParametersForm
 * 
 * A reusable form component for configuring AI generation parameters.
 * Used across all content types for AI-assisted content generation.
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

// Define the base schema for AI parameters
const baseAIParametersSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  tone: z.enum(['formal', 'casual', 'friendly', 'professional']).default('professional'),
  includeExamples: z.boolean().default(true),
  includeExplanations: z.boolean().default(true),
  maxLength: z.number().int().min(100).max(5000).default(1000),
});

// Export the schema for extension by specific content types
export const aiParametersSchema = baseAIParametersSchema;

// Define the form values type
export type AIParametersFormValues = z.infer<typeof aiParametersSchema>;

export interface AIParametersFormProps {
  onSubmit: (values: AIParametersFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<AIParametersFormValues>;
  className?: string;
  contentType: 'activity' | 'assessment' | 'worksheet' | 'lessonPlan';
  // Allow extending the schema with additional fields
  extendedSchema?: z.ZodType<any, any>;
  // Render additional form fields
  renderAdditionalFields?: (form: any) => React.ReactNode;
}

export function AIParametersForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
  className,
  contentType,
  extendedSchema,
  renderAdditionalFields,
}: AIParametersFormProps) {
  // Use the extended schema if provided, otherwise use the base schema
  const schema = extendedSchema || aiParametersSchema;
  
  // Create form with default values
  const form = useForm<AIParametersFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      prompt: '',
      complexity: 'intermediate',
      tone: 'professional',
      includeExamples: true,
      includeExplanations: true,
      maxLength: 1000,
      ...defaultValues,
    },
  });
  
  // Get content type specific labels
  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'activity':
        return 'Activity';
      case 'assessment':
        return 'Assessment';
      case 'worksheet':
        return 'Worksheet';
      case 'lessonPlan':
        return 'Lesson Plan';
      default:
        return 'Content';
    }
  };
  
  // Get content type specific prompt placeholder
  const getPromptPlaceholder = () => {
    switch (contentType) {
      case 'activity':
        return `Describe what you want in your activity. Be specific about the type of questions, difficulty level, and any special requirements.`;
      case 'assessment':
        return `Describe what you want in your assessment. Include information about topics to cover, question types, and difficulty level.`;
      case 'worksheet':
        return `Describe what you want in your worksheet. Include information about topics, question types, and any specific formatting requirements.`;
      case 'lessonPlan':
        return `Describe what you want in your lesson plan. Include information about teaching methods, activities, and any specific learning objectives.`;
      default:
        return `Describe what you want the AI to generate.`;
    }
  };
  
  // Handle form submission
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });
  
  return (
    <div className={cn("space-y-6", className)}>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{getContentTypeLabel()} Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={`Enter a title for your ${getContentTypeLabel().toLowerCase()}`} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt for AI</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={getPromptPlaceholder()}
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Be specific about what you want the AI to generate. The more details you provide, the better the results.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="complexity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complexity Level</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The complexity level determines the difficulty of the content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The tone affects the language style used in the content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="includeExamples"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Include Examples</FormLabel>
                    <FormDescription>
                      Include example questions or activities in the generated content.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="includeExplanations"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Include Explanations</FormLabel>
                    <FormDescription>
                      Include explanations and teaching notes in the generated content.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="maxLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Length</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={100}
                    max={5000}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormDescription>
                  The maximum length of the generated content in words.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Render additional fields if provided */}
          {renderAdditionalFields && renderAdditionalFields(form)}
          
          <div className="flex justify-between pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Generate {getContentTypeLabel()}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
