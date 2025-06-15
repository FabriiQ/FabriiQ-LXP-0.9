'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SubmissionStatus } from '@prisma/client';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Form schema
const formSchema = z.object({
  score: z.coerce.number()
    .min(0, 'Score must be at least 0')
    .refine((val) => !Number.isNaN(val), {
      message: 'Score must be a valid number',
    }),
  feedback: z.string().optional(),
  status: z.nativeEnum(SubmissionStatus).default(SubmissionStatus.GRADED),
});

type FormValues = z.infer<typeof formSchema>;

interface GradingFormProps {
  classId: string;
  assessmentId: string;
  submissionId: string;
  assessment: any;
  submission: any;
}

export function GradingForm({ 
  classId, 
  assessmentId, 
  submissionId, 
  assessment,
  submission 
}: GradingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with existing values if available
  const defaultValues: FormValues = {
    score: submission.score ?? 0,
    feedback: submission.feedback ?? '',
    status: submission.status ?? SubmissionStatus.GRADED,
  };
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Grade submission mutation
  const gradeSubmission = api.assessment.grade.useMutation({
    onSuccess: () => {
      toast({
        title: 'Submission graded',
        description: 'The submission has been graded successfully.',
        variant: 'success',
      });
      router.push(`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
      setIsSubmitting(false);
    },
  });
  
  // Form submission handler
  function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    
    // Validate score against max score
    if (values.score > assessment.maxScore) {
      toast({
        title: 'Error',
        description: `Score cannot exceed the maximum score of ${assessment.maxScore}`,
        variant: 'error',
      });
      setIsSubmitting(false);
      return;
    }
    
    gradeSubmission.mutate({
      submissionId,
      score: values.score,
      feedback: values.feedback,
      status: values.status,
    });
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="score"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Score*</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={0} 
                    max={assessment.maxScore} 
                    step={0.1}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Maximum score: {assessment.maxScore}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={SubmissionStatus.GRADED}>Graded</SelectItem>
                    <SelectItem value={SubmissionStatus.RETURNED}>Returned</SelectItem>
                    <SelectItem value={SubmissionStatus.REJECTED}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide feedback to the student"
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Grade'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 