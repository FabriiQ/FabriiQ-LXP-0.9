'use client';

/**
 * Manual Grading Activity Viewer Component
 *
 * This component allows students to view and submit manual grading activities
 * and teachers to view and grade submissions.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/core/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Textarea } from '@/components/ui/core/textarea';
import { Input } from '@/components/ui/core/input';
import { Label } from '@/components/ui/core/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/feedback/alert';
import { Badge } from '@/components/ui/data-display/badge';
import { Separator } from '@/components/ui/separator';
import { FileUploader } from '@/components/ui/core/file-uploader';
import { RubricPreview } from '@/features/bloom/components/rubric/RubricPreview';
import { BloomsTaxonomyBadge } from '@/features/bloom/components/taxonomy/BloomsTaxonomyBadge';
import { ManualGradingActivity, ManualGradingAttachment, ManualGradingSubmission } from '../../models/manual-grading';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';

interface ManualGradingViewerProps {
  activity: ManualGradingActivity;
  studentId?: string;
  isTeacher?: boolean;
  onSubmit?: (submission: Partial<ManualGradingSubmission>) => Promise<void>;
  className?: string;
}

/**
 * ManualGradingViewer component
 */
export function ManualGradingViewer({
  activity,
  studentId,
  isTeacher = false,
  onSubmit,
  className = '',
}: ManualGradingViewerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('instructions');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textSubmission, setTextSubmission] = useState<string>('');
  const [linkSubmission, setLinkSubmission] = useState<string>('');
  const [fileSubmissions, setFileSubmissions] = useState<File[]>([]);

  // Fetch rubric if available
  const { data: rubric, isLoading: rubricLoading } = api.rubric.getById.useQuery(
    { id: activity.rubricId || '' },
    { enabled: !!activity.rubricId }
  );

  // Fetch submission if student is viewing
  const { data: submission, isLoading: submissionLoading } = api.activityGrade.get.useQuery(
    { activityId: activity.id, studentId: studentId || '' },
    { enabled: !!studentId }
  );

  // Handle file upload
  const handleFileUpload = (files: File[]) => {
    // Check if adding these files would exceed the max files limit
    if (activity.settings?.maxFiles && files.length + fileSubmissions.length > activity.settings.maxFiles) {
      toast({
        title: 'Too many files',
        description: `You can only upload a maximum of ${activity.settings.maxFiles} files`,
        variant: 'error',
      });
      return;
    }

    // Check file sizes
    const maxSize = (activity.settings?.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast({
        title: 'Files too large',
        description: `Some files exceed the maximum size of ${activity.settings?.maxFileSize || 10}MB`,
        variant: 'error',
      });
      return;
    }

    // Add files to state
    setFileSubmissions(prev => [...prev, ...files]);
  };

  // Handle file removal
  const handleFileRemove = (index: number) => {
    setFileSubmissions(prev => prev.filter((_, i) => i !== index));
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!studentId || !onSubmit) return;

    setIsSubmitting(true);

    try {
      // Create attachments array
      const attachments: Partial<ManualGradingAttachment>[] = [];

      // Add text submission if enabled and provided
      if (activity.settings?.allowTextSubmission && textSubmission.trim()) {
        attachments.push({
          name: 'Text Submission',
          type: 'text',
          content: textSubmission,
        });
      }

      // Add link submission if enabled and provided
      if (activity.settings?.allowLinkSubmission && linkSubmission.trim()) {
        attachments.push({
          name: 'Link Submission',
          type: 'link',
          content: linkSubmission,
        });
      }

      // Add file submissions if enabled and provided
      // In a real implementation, you would upload the files to storage and store the URLs
      if (activity.settings?.allowFileUpload && fileSubmissions.length > 0) {
        // This is a placeholder - in a real implementation, you would upload the files
        // and store the URLs
        for (const file of fileSubmissions) {
          attachments.push({
            name: file.name,
            type: 'file',
            content: 'file://placeholder-url', // Placeholder
            size: file.size,
          });
        }
      }

      // Create submission object
      const submissionData: Partial<ManualGradingSubmission> = {
        studentId,
        activityId: activity.id,
        attachments: attachments as ManualGradingAttachment[],
        submittedAt: new Date(),
        status: 'submitted',
      };

      // Call the onSubmit callback
      await onSubmit(submissionData);

      toast({
        title: 'Submission successful',
        description: 'Your work has been submitted successfully',
      });

      // Reset form
      setTextSubmission('');
      setLinkSubmission('');
      setFileSubmissions([]);

      // Switch to instructions tab
      setActiveTab('instructions');
    } catch (error) {
      console.error('Error submitting activity:', error);
      toast({
        title: 'Submission failed',
        description: 'There was an error submitting your work. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the activity instructions
  const renderInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{activity.title}</h2>
        <BloomsTaxonomyBadge level={activity.bloomsLevel} />
      </div>

      {activity.description && (
        <div className="text-muted-foreground">
          {activity.description}
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Instructions</h3>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {activity.instructions}
        </div>
      </div>

      {activity.submissionInstructions && (
        <div className="space-y-2 mt-4">
          <h3 className="text-lg font-medium">Submission Instructions</h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {activity.submissionInstructions}
          </div>
        </div>
      )}

      {activity.settings?.dueDate && (
        <Alert>
          <AlertTitle>Due Date</AlertTitle>
          <AlertDescription>
            This activity is due on {new Date(activity.settings.dueDate).toLocaleDateString()} at {new Date(activity.settings.dueDate).toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Render the submission form
  const renderSubmissionForm = () => {
    // If the student has already submitted and it's graded, show the graded submission
    if (submission && submission.status === 'GRADED') {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Submission Graded</AlertTitle>
            <AlertDescription>
              Your submission has been graded. Score: {submission.score} / {activity.maxScore || 100}
            </AlertDescription>
          </Alert>

          {submission.feedback && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Feedback</h3>
              <div className="p-4 border rounded-md bg-muted">
                {submission.feedback}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Your Submission</h3>
            {/* Display the submission content */}
            {/* This would need to be adapted based on your actual submission structure */}
          </div>
        </div>
      );
    }

    // If the student has already submitted but it's not graded yet
    if (submission && submission.status === 'SUBMITTED') {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Submission Received</AlertTitle>
            <AlertDescription>
              Your submission has been received and is pending grading.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Your Submission</h3>
            {/* Display the submission content */}
            {/* This would need to be adapted based on your actual submission structure */}
          </div>
        </div>
      );
    }

    // If the student hasn't submitted yet, show the submission form
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Submit Your Work</h2>

        {activity.settings?.allowTextSubmission && (
          <div className="space-y-2">
            <Label htmlFor="text-submission">Text Submission</Label>
            <Textarea
              id="text-submission"
              placeholder="Enter your response here..."
              className="min-h-[200px]"
              value={textSubmission}
              onChange={(e) => setTextSubmission(e.target.value)}
            />
          </div>
        )}

        {activity.settings?.allowLinkSubmission && (
          <div className="space-y-2">
            <Label htmlFor="link-submission">Link Submission</Label>
            <Input
              id="link-submission"
              type="url"
              placeholder="https://example.com"
              value={linkSubmission}
              onChange={(e) => setLinkSubmission(e.target.value)}
            />
          </div>
        )}

        {activity.settings?.allowFileUpload && (
          <div className="space-y-2">
            <Label>File Submission</Label>
            <FileUploader
              onFilesAdded={handleFileUpload}
              maxFiles={activity.settings.maxFiles}
              maxSize={activity.settings.maxFileSize}
              acceptedFileTypes={activity.settings.allowedFileTypes}
              files={fileSubmissions}
              onFileRemove={handleFileRemove}
            />
            <p className="text-xs text-muted-foreground">
              Max {activity.settings.maxFiles} files, {activity.settings.maxFileSize}MB each
            </p>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting ||
              (!textSubmission && !linkSubmission && fileSubmissions.length === 0)}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Work'}
          </Button>
        </div>
      </div>
    );
  };

  // Render the rubric
  const renderRubric = () => {
    if (rubricLoading) {
      return <div>Loading rubric...</div>;
    }

    if (!rubric) {
      return (
        <Alert>
          <AlertTitle>No Rubric Available</AlertTitle>
          <AlertDescription>
            This activity does not have a rubric attached.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Grading Rubric</h2>
        <RubricPreview
          rubric={{
            ...rubric,
            learningOutcomeIds: rubric.learningOutcomes?.map(lo => lo.learningOutcome.id) || []
          }}
          showBloomsLevels={true}
        />
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>
          {activity.title}
        </CardTitle>
        <CardDescription>
          Manual Grading Activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="submission">
              Submission
              {submission && (
                <Badge className="ml-2">
                  {submission.status}
                </Badge>
              )}
            </TabsTrigger>
            {(activity.rubricId && (isTeacher || activity.settings?.showRubricToStudents)) && (
              <TabsTrigger value="rubric">Rubric</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="instructions" className="pt-4">
            {renderInstructions()}
          </TabsContent>

          <TabsContent value="submission" className="pt-4">
            {renderSubmissionForm()}
          </TabsContent>

          {(activity.rubricId && (isTeacher || activity.settings?.showRubricToStudents)) && (
            <TabsContent value="rubric" className="pt-4">
              {renderRubric()}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
