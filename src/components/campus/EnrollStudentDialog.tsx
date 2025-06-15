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
import { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '@/server/api/root';

interface FieldProps {
  field: {
    value: any;
    onChange: (value: any) => void;
  };
}

// Form schema
const formSchema = z.object({
  userId: z.string({
    required_error: 'Please select a student',
  }),
  startDate: z.date({
    required_error: 'Please select a start date',
  }),
  endDate: z.date().optional(),
  programCampusId: z.string({
    required_error: 'Please select a program',
  }),
  termId: z.string({
    required_error: 'Please select a term',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgramOption {
  id: string;
  name: string;
  code: string;
}

interface EnrollStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campusId: string;
  availableStudents: User[];
  availablePrograms: ProgramOption[];
  returnUrl: string;
}

export function EnrollStudentDialog({
  open,
  onOpenChange,
  campusId,
  availableStudents,
  availablePrograms,
  returnUrl,
}: EnrollStudentDialogProps) {
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
      programCampusId: '',
      termId: '',
    },
  });

  // Mutation for assigning student to campus
  const assignStudent = api.user.assignToCampus.useMutation({
    onSuccess: (data) => {
      // After assigning to campus, enroll in program
      if (form.getValues().programCampusId) {
        enrollInProgram.mutate({
          studentId: form.getValues().userId,
          campusId,
          programId: form.getValues().programCampusId,
          termId: form.getValues().termId,
          startDate: form.getValues().startDate,
          status: 'ACTIVE',
        });
      } else {
        toast({
          title: 'Student enrolled',
          description: 'The student has been successfully enrolled to the campus',
        });
        onOpenChange(false);
        router.refresh();
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll student to campus',
      });
    },
  });

  // Mutation for enrolling student in program
  const enrollInProgram = api.student.enrollInProgram.useMutation({
    onSuccess: () => {
      toast({
        title: 'Student enrolled',
        description: 'The student has been successfully enrolled to the campus and program',
      });
      onOpenChange(false);
      router.refresh();
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to enroll student in program',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    assignStudent.mutate({
      userId: values.userId,
      campusId,
      roleType: 'CAMPUS_STUDENT',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enroll Student to Campus</DialogTitle>
          <DialogDescription>
            Select a student and program to enroll
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the student to enroll to this campus
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="programCampusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePrograms.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name} ({program.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the program to enroll the student in
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
                    When will this student start at this campus?
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
                    When will this student end at this campus?
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
                {isSubmitting ? "Enrolling..." : "Enroll Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 
