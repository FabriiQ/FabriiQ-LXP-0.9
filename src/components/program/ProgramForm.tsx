'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Program, Prisma } from "@prisma/client";
import { SystemStatus } from "@/server/api/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/forms/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { toast } from "react-hot-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import { ControllerRenderProps } from "react-hook-form";

// Form validation schema
const programFormSchema = z.object({
  name: z.string().min(1, "Program name is required").max(200, "Program name must be less than 200 characters"),
  code: z.string().min(1, "Program code is required").max(50, "Program code must be less than 50 characters"),
  type: z.string().min(1, "Program type is required"),
  level: z.number().min(1, "Program level is required"),
  duration: z.number().min(1, "Program duration is required"),
  description: z.string().optional(),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.ACTIVE),
  settings: z.object({
    allowConcurrentEnrollment: z.boolean().default(false),
    requirePrerequisites: z.boolean().default(true),
    gradingScheme: z.string().default("STANDARD"),
  }).optional(),
  institutionId: z.string(),
});

type ProgramFormValues = z.infer<typeof programFormSchema>;

// Extended Program type to match what we expect from the database
interface ExtendedProgram extends Omit<Program, 'settings' | 'curriculum'> {
  description?: string | null;
  settings?: Prisma.JsonValue | null;
  curriculum?: Prisma.JsonValue | null;
}

interface ProgramFormProps {
  program?: ExtendedProgram;
  initialData?: ProgramFormValues & { id: string };
  institutionId: string;
  onSuccess?: () => void;
}

export function ProgramForm({ program, initialData, institutionId, onSuccess }: ProgramFormProps) {
  const router = useRouter();
  const { toast: useToastToast } = useToast();
  const isEditing = !!program;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the current institution
  const { data: institution } = api.institution.getCurrent.useQuery();

  const utils = api.useContext();
  const { mutateAsync: createProgram } = api.program.create.useMutation({
    onSuccess: () => {
      void utils.program.list.invalidate();
      toast.success("Program created successfully");
      onSuccess?.();
    },
    onError: () => toast.error("Failed to create program"),
  });

  const { mutateAsync: updateProgram } = api.program.update.useMutation({
    onSuccess: () => {
      void utils.program.list.invalidate();
      toast.success("Program updated successfully");
      onSuccess?.();
    },
    onError: () => toast.error("Failed to update program"),
  });

  // Set up form with default values
  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          code: initialData.code,
          type: initialData.type,
          level: initialData.level,
          duration: initialData.duration,
          description: initialData.description || "",
          status: initialData.status,
          settings: (initialData.settings as any) || {
            allowConcurrentEnrollment: false,
            requirePrerequisites: true,
            gradingScheme: "STANDARD",
          },
          institutionId,
        }
      : program
      ? {
          name: program.name || "",
          code: program.code || "",
          type: program.type || "",
          level: program.level || 1,
          duration: program.duration || 12,
          description: program.description || "",
          status: program.status || SystemStatus.ACTIVE,
          settings: (program.settings as any) || {
            allowConcurrentEnrollment: false,
            requirePrerequisites: true,
            gradingScheme: "STANDARD",
          },
          institutionId: program.institutionId || institutionId,
        }
      : {
          name: "",
          code: "",
          type: "",
          level: 1,
          duration: 12,
          description: "",
          status: SystemStatus.ACTIVE,
          settings: {
            allowConcurrentEnrollment: false,
            requirePrerequisites: true,
            gradingScheme: "STANDARD",
          },
          institutionId,
        },
  });

  const { handleSubmit, formState: { errors, isSubmitting: formIsSubmitting } } = form;

  // Form submission handler
  const onSubmit = async (data: ProgramFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Remove the description field as it's not in the Prisma schema
      const { description, ...programData } = data;
      
      if (program?.id) {
        await updateProgram({
          id: program.id,
          ...programData,
        });
      } else {
        // Make sure institutionId is always a string
        const finalInstitutionId = institutionId || institution?.id;
        if (!finalInstitutionId) {
          useToastToast({
            title: "Error",
            description: "No institution found",
            variant: "error"
          });
          return;
        }
        
        await createProgram({
          ...programData,
          institutionId: finalInstitutionId,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/system/programs");
      }
    } catch (error) {
      console.error("Error submitting program form:", error);
      toast.error("Failed to save program");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!institution) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Program Name <span className="text-destructive">*</span>
            </label>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Program Code <span className="text-destructive">*</span>
            </label>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Program Type <span className="text-destructive">*</span>
            </label>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="level" className="text-sm font-medium">
              Program Level <span className="text-destructive">*</span>
            </label>
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="number" {...field} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium">
              Duration (months) <span className="text-destructive">*</span>
            </label>
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="number" {...field} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status <span className="text-destructive">*</span>
            </label>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(value as SystemStatus)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SystemStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <input type="hidden" {...form.register("institutionId")} value={institution.id} />

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isEditing) {
                router.push(`/admin/system/programs/${program?.id}`);
              } else {
                router.push("/admin/system/programs");
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Program" : "Create Program"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 
