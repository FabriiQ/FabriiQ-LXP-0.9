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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';

// Form schema for feedback response
const responseFormSchema = z.object({
  content: z.string().min(1, 'Response is required'),
});

type ResponseFormValues = z.infer<typeof responseFormSchema>;

interface FeedbackResponseDialogProps {
  feedbackId: string;
  isOpen: boolean;
  onClose: () => void;
  onResponseAdded: () => void;
}

export function FeedbackResponseDialog({
  feedbackId,
  isOpen,
  onClose,
  onResponseAdded
}: FeedbackResponseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<ResponseFormValues>({
    resolver: zodResolver(responseFormSchema),
    defaultValues: {
      content: '',
    },
  });

  // Add response mutation
  const addResponse = api.feedback.addResponse.useMutation({
    onSuccess: () => {
      toast({
        title: 'Response added',
        description: 'Your response has been added successfully.',
        variant: 'default',
      });
      form.reset();
      setIsSubmitting(false);
      onResponseAdded();
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add response',
        variant: 'default',
      });
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (values: ResponseFormValues) => {
    setIsSubmitting(true);

    addResponse.mutate({
      content: values.content,
      teacherFeedbackId: feedbackId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Response</DialogTitle>
          <DialogDescription>
            Add your response to this feedback. This will be visible to the teacher and other coordinators.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your response"
                      className="min-h-[150px]"
                      {...field}
                    />
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
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
