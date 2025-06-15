'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Program } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/forms/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/forms/select";
import { DatePicker } from "@/components/ui/forms/date-picker";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";

// Form schema
const formSchema = z.object({
  programId: z.string({
    required_error: "Please select a program",
  }),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  endDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgramAssignmentFormProps {
  campusId: string;
  availablePrograms: Program[];
  selectedProgramId?: string;
  returnUrl: string;
}

export function ProgramAssignmentForm({
  campusId,
  availablePrograms,
  selectedProgramId,
  returnUrl,
}: ProgramAssignmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programId: selectedProgramId || (availablePrograms && availablePrograms.length > 0 ? availablePrograms[0].id : ""),
      startDate: new Date(),
      endDate: undefined,
    },
  });

  // Log available programs for debugging
  console.log('ProgramAssignmentForm - Available programs:', availablePrograms?.length || 0);
  console.log('ProgramAssignmentForm - Available programs data:', availablePrograms);
  console.log('ProgramAssignmentForm - Selected program ID:', selectedProgramId);

  // Update form when availablePrograms changes
  useEffect(() => {
    if (availablePrograms && availablePrograms.length > 0) {
      // If no program is selected or the selected program is not in the available programs list
      const currentProgramId = form.getValues().programId;
      const programExists = currentProgramId && availablePrograms.some(p => p.id === currentProgramId);

      if (!currentProgramId || !programExists) {
        console.log('Setting default program ID to:', availablePrograms[0].id);
        form.setValue('programId', availablePrograms[0].id);
      }
    }
  }, [availablePrograms, form]);

  // Use the TRPC mutation to assign a program to a campus
  const assignProgram = api.campus.assignProgram.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program assigned successfully",
        variant: "success",
      });
      router.push(returnUrl);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign program",
        variant: "error",
      });
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      await assignProgram.mutateAsync({
        campusId,
        programId: values.programId,
        startDate: values.startDate,
        endDate: values.endDate,
      });
    } catch (error) {
      // Error is handled by the mutation
      console.error("Error assigning program:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Program</CardTitle>
        <CardDescription>
          {availablePrograms && availablePrograms.length > 0
            ? "Select a program to assign to this campus"
            : "All programs are already assigned to this campus."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="programId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePrograms && availablePrograms.length > 0 ? (
                          availablePrograms.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name} ({program.code})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-programs" disabled>
                            Loading programs...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    When will this program start at this campus?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    When will this program end at this campus? Leave blank for indefinite.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting || !form.getValues().programId}>
                {isSubmitting ? "Assigning..." : "Assign Program"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
