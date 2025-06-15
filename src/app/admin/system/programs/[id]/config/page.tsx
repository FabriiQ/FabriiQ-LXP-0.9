'use client';

import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/forms/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { PageHeader } from '@/components/ui/atoms/page-header';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';

// Define the configuration schema
const configSchema = z.object({
  settings: z.object({
    allowConcurrentEnrollment: z.boolean().default(false),
    requirePrerequisites: z.boolean().default(true),
    gradingScheme: z.enum(['STANDARD', 'CUSTOM', 'PASS_FAIL']).default('STANDARD'),
    autoEnrollPrerequisites: z.boolean().default(false),
    allowLateEnrollment: z.boolean().default(true),
    maxCreditsPerTerm: z.number().min(0).default(18),
  }),
});

type ConfigFormValues = z.infer<typeof configSchema>;

export default function ProgramConfigPage() {
  const params = useParams() || {};
  const programId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  
  // Fetch program data
  const { data: program, isLoading } = api.program.getById.useQuery({ id: programId }, {
    enabled: !!programId,
  });
  
  // Update program mutation
  const updateProgram = api.program.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Program configuration updated successfully',
        variant: 'success',
      });
      router.push(`/admin/system/programs`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update program configuration',
        variant: 'error',
      });
    },
  });

  // Create form with default values
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      settings: program?.settings && typeof program.settings === 'object' ? 
        {
          allowConcurrentEnrollment: (program.settings as any).allowConcurrentEnrollment ?? false,
          requirePrerequisites: (program.settings as any).requirePrerequisites ?? true,
          gradingScheme: (program.settings as any).gradingScheme ?? 'STANDARD',
          autoEnrollPrerequisites: (program.settings as any).autoEnrollPrerequisites ?? false,
          allowLateEnrollment: (program.settings as any).allowLateEnrollment ?? true,
          maxCreditsPerTerm: (program.settings as any).maxCreditsPerTerm ?? 18,
        } : {
          allowConcurrentEnrollment: false,
          requirePrerequisites: true,
          gradingScheme: 'STANDARD',
          autoEnrollPrerequisites: false,
          allowLateEnrollment: true,
          maxCreditsPerTerm: 18,
        }
    },
  });

  // Submit handler
  const onSubmit = async (data: ConfigFormValues) => {
    if (!programId) return;
    
    updateProgram.mutate({
      id: programId,
      settings: data.settings,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Program not found</h2>
        <p className="mt-2 text-muted-foreground">
          The program you are looking for does not exist or has been removed.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push('/admin/system/programs')}
        >
          Go back to programs
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Program Configuration"
        description={`Configure settings for ${program.name}`}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/admin/system/programs')}
          >
            Cancel
          </Button>
        }
      />

      <Card className="mt-6 p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Enrollment Settings</h3>
              
              <FormField
                control={form.control}
                name="settings.allowConcurrentEnrollment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Concurrent Enrollment
                      </FormLabel>
                      <FormDescription>
                        Students can enroll in multiple courses at the same time
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="settings.requirePrerequisites"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Prerequisites
                      </FormLabel>
                      <FormDescription>
                        Students must complete prerequisites before enrolling in advanced courses
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="settings.autoEnrollPrerequisites"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-enroll Prerequisites
                      </FormLabel>
                      <FormDescription>
                        Automatically enroll students in prerequisites when they select an advanced course
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="settings.allowLateEnrollment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Late Enrollment
                      </FormLabel>
                      <FormDescription>
                        Students can enroll after the term has started
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Academic Settings</h3>
              
              <FormField
                control={form.control}
                name="settings.gradingScheme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grading Scheme</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a grading scheme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard (A-F)</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                        <SelectItem value="PASS_FAIL">Pass/Fail</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The grading system used for this program
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="settings.maxCreditsPerTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Credits Per Term</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of credits a student can take in a single term
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/system/programs')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProgram.isLoading}
              >
                {updateProgram.isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
} 