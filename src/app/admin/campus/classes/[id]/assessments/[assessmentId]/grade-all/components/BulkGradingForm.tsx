'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { api } from '@/utils/api';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Loader2 } from 'lucide-react';

// Define custom toast interface since the UI library might not have it
interface ToastProps {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

// Define the form schema for bulk grading
const formSchema = z.object({
  submissions: z.array(
    z.object({
      id: z.string(),
      studentId: z.string(),
      studentName: z.string(),
      selected: z.boolean().default(true),
      score: z.coerce.number().min(0).optional(),
      feedback: z.string().optional(),
    })
  ),
  applyToAll: z.object({
    score: z.coerce.number().min(0).optional(),
    feedback: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface Submission {
  id: string;
  studentId: string;
  student: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  status: string;
  submittedAt?: Date;
  answers?: any[];
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  maxScore: number;
  questions?: any[];
  dueDate?: Date;
  [key: string]: any;
}

interface BulkGradingFormProps {
  classId: string;
  assessmentId: string;
  submissions: Submission[];
  assessment: Assessment;
}

export function BulkGradingForm({ 
  classId, 
  assessmentId, 
  submissions, 
  assessment 
}: BulkGradingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectAll, setSelectAll] = useState(true);
  
  // Create initial form values from submissions
  const defaultValues: FormValues = {
    submissions: submissions.map(sub => ({
      id: sub.id,
      studentId: sub.student.id,
      studentName: sub.student.user.name,
      selected: true,
      score: undefined,
      feedback: '',
    })),
    applyToAll: {
      score: undefined,
      feedback: '',
    },
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Get current form values
  const watchedSubmissions = form.watch('submissions');
  const watchedApplyToAll = form.watch('applyToAll');
  
  // Handle "Select All" checkbox
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    const currentSubmissions = form.getValues('submissions');
    form.setValue(
      'submissions',
      currentSubmissions.map(sub => ({
        ...sub,
        selected: checked,
      }))
    );
  };
  
  // Apply score and feedback to all selected submissions
  const handleApplyToAll = () => {
    const { score, feedback } = watchedApplyToAll;
    const currentSubmissions = form.getValues('submissions');
    
    form.setValue(
      'submissions',
      currentSubmissions.map(sub => ({
        ...sub,
        score: sub.selected && score !== undefined ? score : sub.score,
        feedback: sub.selected && feedback ? feedback : sub.feedback,
      }))
    );
  };
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const selectedSubmissions = values.submissions.filter(sub => sub.selected);
      
      if (selectedSubmissions.length === 0) {
        // Use console.log instead of toast for now
        console.error("No submissions selected");
        setIsSubmitting(false);
        return;
      }
      
      // Format the data for the API
      const submissionsData = selectedSubmissions.map(sub => ({
        submissionId: sub.id,
        score: sub.score ?? 0,
        feedback: sub.feedback ?? '',
      }));
      
      // Call the bulk grade API using useMutation
      const bulkGradeMutation = api.assessment.bulkGradeSubmissions.useMutation();
      await bulkGradeMutation.mutateAsync({
        assessmentId,
        grades: submissionsData,
      });
      
      // Show success message
      console.log(`Successfully graded ${selectedSubmissions.length} submissions.`);
      
      // Redirect to submissions page
      router.push(`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`);
      router.refresh();
    } catch (error) {
      console.error('Error grading submissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Apply to All Section */}
        <div className="bg-muted p-4 rounded-md mb-6">
          <h3 className="text-lg font-medium mb-4">Apply to Selected</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <FormLabel htmlFor="applyToAll.score">Score (out of {assessment.maxScore})</FormLabel>
              <Input
                id="applyToAll.score"
                type="number"
                min={0}
                max={assessment.maxScore}
                value={watchedApplyToAll.score ?? ''}
                onChange={e => 
                  form.setValue('applyToAll.score', e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <FormLabel htmlFor="applyToAll.feedback">Feedback</FormLabel>
              <Textarea
                id="applyToAll.feedback"
                value={watchedApplyToAll.feedback ?? ''}
                onChange={e => form.setValue('applyToAll.feedback', e.target.value)}
                className="w-full"
                placeholder="Enter feedback to apply to all selected submissions..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyToAll}
              disabled={
                (!watchedApplyToAll.score && !watchedApplyToAll.feedback) ||
                !watchedSubmissions.some(sub => sub.selected)
              }
            >
              Apply to Selected
            </Button>
          </div>
        </div>
        
        {/* Submissions Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead className="w-[120px]">Score</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchedSubmissions.map((submission, index) => {
                const originalSubmission = submissions.find(s => s.id === submission.id);
                
                return (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <Checkbox
                        checked={submission.selected}
                        onCheckedChange={(checked) => {
                          const currentSubmissions = [...form.getValues('submissions')];
                          currentSubmissions[index] = {
                            ...currentSubmissions[index],
                            selected: !!checked,
                          };
                          form.setValue('submissions', currentSubmissions);
                          
                          // Update selectAll state based on all checkboxes
                          const allSelected = currentSubmissions.every(s => s.selected);
                          setSelectAll(allSelected);
                        }}
                        aria-label={`Select ${submission.studentName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{submission.studentName}</div>
                    </TableCell>
                    <TableCell>
                      {originalSubmission?.submittedAt
                        ? new Date(originalSubmission.submittedAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={assessment.maxScore}
                        value={submission.score ?? ''}
                        onChange={(e) => {
                          const currentSubmissions = [...form.getValues('submissions')];
                          currentSubmissions[index] = {
                            ...currentSubmissions[index],
                            score: e.target.value ? Number(e.target.value) : undefined,
                          };
                          form.setValue('submissions', currentSubmissions);
                        }}
                        disabled={!submission.selected}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={submission.feedback ?? ''}
                        onChange={(e) => {
                          const currentSubmissions = [...form.getValues('submissions')];
                          currentSubmissions[index] = {
                            ...currentSubmissions[index],
                            feedback: e.target.value,
                          };
                          form.setValue('submissions', currentSubmissions);
                        }}
                        disabled={!submission.selected}
                        className="min-h-[60px] w-full"
                        placeholder="Enter feedback..."
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Form Errors */}
        {form.formState.errors.submissions && (
          <div className="text-destructive text-sm">
            Please check the form for errors
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Grading Submissions...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {watchedSubmissions.filter(s => s.selected).length > 0
                  ? `Grade ${watchedSubmissions.filter(s => s.selected).length} Submissions`
                  : 'Grade Submissions'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 