'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Plus, MessageCircle, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

// Form schema for teacher feedback
const feedbackFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['ACADEMIC_PERFORMANCE', 'BEHAVIORAL', 'ATTENDANCE', 'PARTICIPATION', 'IMPROVEMENT_AREA', 'ACHIEVEMENT', 'DISCIPLINARY']),
  severity: z.enum(['POSITIVE', 'NEUTRAL', 'CONCERN', 'CRITICAL']),
  tags: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface TeacherFeedbackTabProps {
  teacherId: string;
  existingFeedback: any[];
}

export function TeacherFeedbackTab({ teacherId, existingFeedback }: TeacherFeedbackTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Form setup
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

  // Create feedback mutation
  const createFeedback = api.feedback.createTeacherFeedback.useMutation({
    onSuccess: () => {
      toast({
        title: 'Feedback submitted',
        description: 'Your feedback has been submitted successfully.',
        variant: 'success',
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit feedback',
        variant: 'error',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: FeedbackFormValues) => {
    createFeedback.mutate({
      feedbackBase: {
        title: values.title,
        description: values.description,
        type: values.type,
        severity: values.severity,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
      },
      teacher: {
        teacherId,
      },
    });
  };

  // Filter feedback based on active tab
  const filteredFeedback = activeTab === 'all'
    ? existingFeedback
    : existingFeedback.filter(feedback =>
        activeTab === 'positive'
          ? feedback.feedbackBase.severity === 'POSITIVE'
          : activeTab === 'concern'
            ? ['CONCERN', 'CRITICAL'].includes(feedback.feedbackBase.severity)
            : feedback.feedbackBase.severity === 'NEUTRAL'
      );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Teacher Feedback</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add Teacher Feedback</DialogTitle>
              <DialogDescription>
                Provide feedback for this teacher. This will be visible to administrators and the teacher.
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
                          placeholder="Detailed feedback description"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tags separated by commas" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional: Add tags to categorize feedback (e.g., "professional development, communication")
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createFeedback.isLoading}>
                    {createFeedback.isLoading ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="positive">Positive</TabsTrigger>
          <TabsTrigger value="neutral">Neutral</TabsTrigger>
          <TabsTrigger value="concern">Concerns</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredFeedback.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No feedback found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'all'
                ? 'No feedback has been provided for this teacher yet.'
                : `No ${activeTab} feedback has been provided for this teacher yet.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: any }) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'POSITIVE':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'NEUTRAL':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'CONCERN':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'CRITICAL':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'POSITIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'NEUTRAL':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'CONCERN':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {getSeverityIcon(feedback.feedbackBase.severity)}
            <div>
              <CardTitle>{feedback.feedbackBase.title}</CardTitle>
              <CardDescription>
                {format(new Date(feedback.feedbackBase.createdAt), 'PPP')} by {feedback.feedbackBase.createdBy?.name || 'Unknown'}
              </CardDescription>
            </div>
          </div>
          <Badge className={getSeverityColor(feedback.feedbackBase.severity)}>
            {feedback.feedbackBase.severity.charAt(0) + feedback.feedbackBase.severity.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line">{feedback.feedbackBase.description}</p>

        {feedback.feedbackBase.tags && feedback.feedbackBase.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {feedback.feedbackBase.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
      {feedback.responses && feedback.responses.length > 0 && (
        <CardFooter className="flex flex-col items-start border-t pt-4">
          <h4 className="text-sm font-medium mb-2">Responses</h4>
          <div className="space-y-3 w-full">
            {feedback.responses.map((response: any) => (
              <div key={response.id} className="flex items-start gap-3 bg-muted p-3 rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {response.responder?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{response.responder?.name || 'Unknown'}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(response.createdAt), 'PPP')}
                    </span>
                  </div>
                  <p className="text-sm">{response.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
