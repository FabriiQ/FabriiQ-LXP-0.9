'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Textarea } from '@/components/ui/forms/textarea';
import { Switch } from '@/components/ui/atoms/switch';
import { toast } from 'react-hot-toast';
import { SystemStatus } from '@/server/api/constants';
import { useRouter } from 'next/navigation';

const policySchema = z.object({
  name: z.string().min(1, "Policy name is required").max(100, "Policy name must be less than 100 characters"),
  description: z.string().min(1, "Description is required"),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.ACTIVE),
  rules: z.array(z.object({
    name: z.string(),
    description: z.string(),
    isRequired: z.boolean(),
    validationRule: z.string().optional(),
    errorMessage: z.string().optional(),
  })).min(1, "At least one rule is required"),
  settings: z.object({
    allowRetake: z.boolean().default(false),
    maxRetakes: z.number().min(0).optional(),
    requireApproval: z.boolean().default(false),
    autoGrade: z.boolean().default(true),
    showResults: z.boolean().default(true),
    passingScore: z.number().min(0).max(100).optional(),
  }),
});

type PolicyFormValues = z.infer<typeof policySchema>;

interface PolicyFormProps {
  initialData?: PolicyFormValues;
  policyId?: string;
}

export const PolicyForm: React.FC<PolicyFormProps> = ({
  initialData,
  policyId
}) => {
  const router = useRouter();
  const isEditing = Boolean(policyId);

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      status: SystemStatus.ACTIVE,
      rules: [
        {
          name: 'Submission Deadline',
          description: 'Assessment must be submitted before the deadline',
          isRequired: true,
          validationRule: '',
          errorMessage: 'Late submissions are not accepted'
        }
      ],
      settings: {
        allowRetake: false,
        maxRetakes: 0,
        requireApproval: false,
        autoGrade: true,
        showResults: true,
        passingScore: 60,
      }
    }
  });

  // Mock API functions
  const createPolicy = {
    mutateAsync: async (data: PolicyFormValues) => {
      console.log('Creating policy with data:', data);
      toast.success('Assessment policy created successfully');
      router.push('/assessment/policies');
      return { id: 'new-policy-id', ...data };
    }
  };

  const updatePolicy = {
    mutateAsync: async (data: { id: string } & PolicyFormValues) => {
      console.log('Updating policy with data:', data);
      toast.success('Assessment policy updated successfully');
      router.push('/assessment/policies');
      return data;
    }
  };

  const onSubmit = async (data: PolicyFormValues) => {
    try {
      if (isEditing && policyId) {
        await updatePolicy.mutateAsync({ id: policyId, ...data });
      } else {
        await createPolicy.mutateAsync(data);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error saving assessment policy:', errorMessage);
      toast.error(`Failed to save assessment policy: ${errorMessage}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Assessment Policy' : 'Create Assessment Policy'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rules</h3>
              {form.watch('rules')?.map((_, index) => (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`rules.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`rules.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`rules.${index}.isRequired`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel>Required</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`rules.${index}.validationRule`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validation Rule</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`rules.${index}.errorMessage`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Error Message</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const rules = form.getValues('rules') || [];
                  form.setValue('rules', [
                    ...rules,
                    {
                      name: '',
                      description: '',
                      isRequired: false,
                      validationRule: '',
                      errorMessage: ''
                    }
                  ]);
                }}
              >
                Add Rule
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Settings</h3>

              <FormField
                control={form.control}
                name="settings.allowRetake"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Allow Retake</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('settings.allowRetake') && (
                <FormField
                  control={form.control}
                  name="settings.maxRetakes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Retakes</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="settings.requireApproval"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Require Approval</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.autoGrade"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Auto Grade</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.showResults"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormLabel>Show Results</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SystemStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/assessment/policies')}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? 'Update Policy' : 'Create Policy'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PolicyForm; 