'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
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
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';

// Form schema for student feedback
const feedbackFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['ACADEMIC_PERFORMANCE', 'BEHAVIORAL', 'ATTENDANCE', 'PARTICIPATION', 'IMPROVEMENT_AREA', 'ACHIEVEMENT', 'DISCIPLINARY']),
  severity: z.enum(['POSITIVE', 'NEUTRAL', 'CONCERN', 'CRITICAL']),
  tags: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface StudentFeedbackDialogProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onFeedbackAdded: () => void;
}

export function StudentFeedbackDialog({
  studentId,
  isOpen,
  onClose,
  onFeedbackAdded
}: StudentFeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'ACADEMIC_PERFORMANCE',
      severity: 'NEUTRAL',
      tags: '',
    },
  });

  // Create student feedback mutation
  const createStudentFeedback = api.feedback.createStudentFeedback.useMutation({
    onSuccess: () => {
      toast({
        title: 'Feedback added',
        description: 'The feedback has been added successfully.',
        variant: 'default',
      });
      form.reset();
      setIsSubmitting(false);
      onFeedbackAdded();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add feedback',
        variant: 'default',
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (values: FeedbackFormValues) => {
    setIsSubmitting(true);
    
    // Convert tags string to array
    const tagsArray = values.tags 
      ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) 
      : [];
    
    createStudentFeedback.mutate({
      feedbackBase: {
        title: values.title,
        description: values.description,
        type: values.type,
        severity: values.severity,
        tags: tagsArray,
      },
      student: {
        studentId,
        feedbackBaseId: '', // This will be created by the server
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Student Feedback</DialogTitle>
          <DialogDescription>
            Provide feedback for this student. This will be visible to the student and other coordinators.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Feedback title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide detailed feedback" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACADEMIC_PERFORMANCE">Academic Performance</SelectItem>
                        <SelectItem value="BEHAVIORAL">Behavioral</SelectItem>
                        <SelectItem value="ATTENDANCE">Attendance</SelectItem>
                        <SelectItem value="PARTICIPATION">Participation</SelectItem>
                        <SelectItem value="IMPROVEMENT_AREA">Improvement Area</SelectItem>
                        <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                        <SelectItem value="DISCIPLINARY">Disciplinary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POSITIVE">Positive</SelectItem>
                        <SelectItem value="NEUTRAL">Neutral</SelectItem>
                        <SelectItem value="CONCERN">Concern</SelectItem>
                        <SelectItem value="CRITICAL">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. performance, improvement, attendance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
