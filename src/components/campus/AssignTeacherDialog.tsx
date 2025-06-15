'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/feedback/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/forms/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/forms/select';
import { DatePicker } from '@/components/ui/forms/date-picker';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { User } from '@prisma/client';

// Add FieldProps interface to fix implicit 'any' type errors
interface FieldProps {
  field: {
    value: any;
    onChange: (value: any) => void;
  };
}

// Form schema
const formSchema = z.object({
  userId: z.string({
    required_error: 'Please select a teacher',
  }),
  startDate: z.date({
    required_error: 'Please select a start date',
  }),
  endDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campusId: string;
  availableTeachers: User[];
  returnUrl: string;
}

export function AssignTeacherDialog({
  open,
  onOpenChange,
  campusId,
  availableTeachers,
  returnUrl,
}: AssignTeacherDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      startDate: new Date(),
      endDate: undefined,
    },
  });

  // Mutation for assigning teacher to campus
  const assignTeacher = api.user.assignToCampus.useMutation({
    onSuccess: () => {
      toast({
        title: 'Teacher assigned',
        description: 'The teacher has been successfully assigned to the campus',
      });
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign teacher to campus',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    assignTeacher.mutate({
      userId: values.userId,
      campusId,
      roleType: 'CAMPUS_TEACHER',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Teacher to Campus</DialogTitle>
          <DialogDescription>
            Select a teacher and set the assignment period
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the teacher to assign to this campus
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FormDescription>
                    When will this teacher start at this campus?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FormDescription>
                    When will this teacher end at this campus?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Assigning..." : "Assign Teacher"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
