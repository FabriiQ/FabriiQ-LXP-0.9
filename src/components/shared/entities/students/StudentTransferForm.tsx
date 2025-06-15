'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/forms/date-picker';
import { Textarea } from '@/components/ui/forms/textarea';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '@/server/api/root';
import { Loader2 } from 'lucide-react';

// Form schema for class transfer
const classTransferSchema = z.object({
  fromClassId: z.string({
    required_error: 'Please select the current class',
  }),
  toClassId: z.string({
    required_error: 'Please select the target class',
  }),
  transferDate: z.date({
    required_error: 'Please select a transfer date',
  }),
  reason: z.string().optional(),
});

// Form schema for campus transfer
const campusTransferSchema = z.object({
  fromCampusId: z.string({
    required_error: 'Please select the current campus',
  }),
  toCampusId: z.string({
    required_error: 'Please select the target campus',
  }),
  toClassId: z.string().optional(),
  transferDate: z.date({
    required_error: 'Please select a transfer date',
  }),
  reason: z.string().optional(),
});

type ClassTransferFormValues = z.infer<typeof classTransferSchema>;
type CampusTransferFormValues = z.infer<typeof campusTransferSchema>;

interface Class {
  id: string;
  name: string;
  code: string;
  campusId: string;
  campusName?: string;
}

interface Campus {
  id: string;
  name: string;
  code: string;
}

interface StudentTransferFormProps {
  studentId: string;
  studentName: string;
  transferType: 'class' | 'campus';
  currentClasses?: Class[];
  availableClasses?: Class[];
  currentCampusId?: string;
  availableCampuses?: Campus[];
  userId: string;
  onSuccess?: () => void;
}

export function StudentTransferForm({
  studentId,
  studentName,
  transferType,
  currentClasses = [],
  availableClasses = [],
  currentCampusId,
  availableCampuses = [],
  userId,
  onSuccess,
}: StudentTransferFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFromClassId, setSelectedFromClassId] = useState<string>('');
  const [selectedToCampusId, setSelectedToCampusId] = useState<string>('');
  
  // Initialize form for class transfer
  const classTransferForm = useForm<ClassTransferFormValues>({
    resolver: zodResolver(classTransferSchema),
    defaultValues: {
      fromClassId: '',
      toClassId: '',
      transferDate: new Date(),
      reason: '',
    },
  });

  // Initialize form for campus transfer
  const campusTransferForm = useForm<CampusTransferFormValues>({
    resolver: zodResolver(campusTransferSchema),
    defaultValues: {
      fromCampusId: currentCampusId || '',
      toCampusId: '',
      toClassId: '',
      transferDate: new Date(),
      reason: '',
    },
  });

  // Get available target classes based on selected source class (for class transfer)
  const filteredTargetClasses = availableClasses.filter(
    (cls) => {
      if (!selectedFromClassId) return false;
      
      // Find the campus ID of the selected source class
      const sourceClass = currentClasses.find(c => c.id === selectedFromClassId);
      if (!sourceClass) return false;
      
      // Only show classes in the same campus as the source class
      return cls.campusId === sourceClass.campusId && cls.id !== selectedFromClassId;
    }
  );

  // Get available target classes based on selected target campus (for campus transfer)
  const filteredCampusClasses = availableClasses.filter(
    (cls) => cls.campusId === selectedToCampusId
  );

  // Mutation for transferring student to another class
  const transferToClassMutation = api.enrollment.transferStudentToClass.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: 'Success',
        description: `${studentName} has been transferred to the new class`,
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Mutation for transferring student to another campus
  const transferToCampusMutation = api.enrollment.transferStudentToCampus.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: 'Success',
        description: `${studentName} has been transferred to the new campus`,
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setIsSubmitting(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'error',
      });
    },
  });

  // Handle class transfer form submission
  const onClassTransferSubmit = (data: ClassTransferFormValues) => {
    setIsSubmitting(true);
    transferToClassMutation.mutate({
      studentId,
      fromClassId: data.fromClassId,
      toClassId: data.toClassId,
      transferDate: data.transferDate,
      reason: data.reason,
      transferById: userId,
    });
  };

  // Handle campus transfer form submission
  const onCampusTransferSubmit = (data: CampusTransferFormValues) => {
    setIsSubmitting(true);
    transferToCampusMutation.mutate({
      studentId,
      fromCampusId: data.fromCampusId,
      toCampusId: data.toCampusId,
      toClassId: data.toClassId,
      transferDate: data.transferDate,
      reason: data.reason,
      transferById: userId,
    });
  };

  // Handle from class selection change
  const handleFromClassChange = (value: string) => {
    setSelectedFromClassId(value);
    classTransferForm.setValue('fromClassId', value);
  };

  // Handle to campus selection change
  const handleToCampusChange = (value: string) => {
    setSelectedToCampusId(value);
    campusTransferForm.setValue('toCampusId', value);
    // Reset the class selection when campus changes
    campusTransferForm.setValue('toClassId', '');
  };

  return (
    <div className="space-y-6">
      {transferType === 'class' ? (
        <Form {...classTransferForm}>
          <form onSubmit={classTransferForm.handleSubmit(onClassTransferSubmit)} className="space-y-4">
            <FormField
              control={classTransferForm.control}
              name="fromClassId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Class</FormLabel>
                  <Select
                    onValueChange={(value) => handleFromClassChange(value)}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select current class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currentClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the class the student is currently enrolled in
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={classTransferForm.control}
              name="toClassId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Class</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || !selectedFromClassId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredTargetClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the class to transfer the student to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={classTransferForm.control}
              name="transferDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Transfer Date</FormLabel>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FormDescription>
                    Date when the transfer becomes effective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={classTransferForm.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Transfer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for transfer (optional)"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a reason for the transfer (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transfer Student
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...campusTransferForm}>
          <form onSubmit={campusTransferForm.handleSubmit(onCampusTransferSubmit)} className="space-y-4">
            <FormField
              control={campusTransferForm.control}
              name="fromCampusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Campus</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={true} // Current campus is fixed
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select current campus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCampuses
                        .filter(campus => campus.id === currentCampusId)
                        .map((campus) => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name} ({campus.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The campus the student is currently enrolled in
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={campusTransferForm.control}
              name="toCampusId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Campus</FormLabel>
                  <Select
                    onValueChange={(value) => handleToCampusChange(value)}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target campus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCampuses
                        .filter(campus => campus.id !== currentCampusId)
                        .map((campus) => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name} ({campus.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the campus to transfer the student to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={campusTransferForm.control}
              name="toClassId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Class (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || !selectedToCampusId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target class (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCampusClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} ({cls.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optionally select a specific class in the target campus. If not selected, a suitable class will be automatically assigned.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={campusTransferForm.control}
              name="transferDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Transfer Date</FormLabel>
                  <DatePicker
                    date={field.value}
                    setDate={field.onChange}
                    disabled={isSubmitting}
                  />
                  <FormDescription>
                    Date when the transfer becomes effective
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={campusTransferForm.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Transfer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter reason for transfer (optional)"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a reason for the transfer (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transfer Student
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
