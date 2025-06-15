'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { api } from '@/trpc/react';
import { toast } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tree } from '@/components/ui/tree';

// Schema definitions
const courseSchema = z.object({
  id: z.string(),
  termNumber: z.number().min(1),
  credits: z.number().min(0),
  isRequired: z.boolean(),
  prerequisites: z.array(z.string())
});

const termSchema = z.object({
  number: z.number().min(1),
  name: z.string(),
  minimumCredits: z.number().min(0)
});

const requirementsSchema = z.object({
  totalCredits: z.number().min(0),
  minimumGPA: z.number().min(0),
  requiredCourses: z.array(z.string()),
  electiveCreditHours: z.number().min(0)
});

const teachingAssignmentSchema = z.object({
  courseId: z.string(),
  teacherId: z.string()
});

const campusSettingSchema = z.object({
  campusId: z.string(),
  resourceRequirements: z.array(z.string()),
  teachingAssignments: z.array(teachingAssignmentSchema)
});

const programConfigSchema = z.object({
  curriculum: z.object({
    courses: z.array(courseSchema),
    terms: z.array(termSchema)
  }),
  requirements: requirementsSchema,
  campusSettings: z.array(campusSettingSchema)
});

type ProgramConfigFormValues = z.infer<typeof programConfigSchema>;

interface ProgramConfigurationProps {
  programId: string;
  initialData?: ProgramConfigFormValues;
}

export const ProgramConfiguration: React.FC<ProgramConfigurationProps> = ({
  programId,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState('curriculum');
  const form = useForm<ProgramConfigFormValues>({
    resolver: zodResolver(programConfigSchema),
    defaultValues: initialData
  });

  const updateCurriculum = api.program.updateCurriculum.useMutation({
    onSuccess: () => {
      toast.success('Curriculum updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update curriculum: ${error.message}`);
    }
  });

  const updateRequirements = api.program.updateRequirements.useMutation({
    onSuccess: () => {
      toast.success('Requirements updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update requirements: ${error.message}`);
    }
  });

  const updateCampusSettings = api.program.updateCampusSettings.useMutation({
    onSuccess: () => {
      toast.success('Campus settings updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update campus settings: ${error.message}`);
    }
  });

  const onSubmit = async (data: ProgramConfigFormValues) => {
    try {
      switch (activeTab) {
        case 'curriculum':
          await updateCurriculum.mutateAsync({
            programId,
            curriculum: data.curriculum
          });
          break;
        case 'requirements':
          await updateRequirements.mutateAsync({
            programId,
            requirements: data.requirements
          });
          break;
        case 'campus':
          await updateCampusSettings.mutateAsync({
            programId,
            campusSettings: data.campusSettings
          });
          break;
      }
    } catch (error) {
      console.error('Error updating program configuration:', error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle>Program Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="curriculum">Curriculum Structure</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="campus">Campus Settings</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="curriculum">
                  <Card>
                    <CardHeader>
                      <CardTitle>Curriculum Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Terms Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Terms</h3>
                        {form.watch('curriculum.terms')?.map((term, index) => (
                          <div key={index} className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`curriculum.terms.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Term Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`curriculum.terms.${index}.minimumCredits`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Minimum Credits</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={() => {
                            const terms = form.getValues('curriculum.terms') || [];
                            form.setValue('curriculum.terms', [
                              ...terms,
                              { number: terms.length + 1, name: '', minimumCredits: 0 }
                            ]);
                          }}
                        >
                          Add Term
                        </Button>
                      </div>

                      {/* Courses Section */}
                      <div className="mt-8 space-y-4">
                        <h3 className="text-lg font-medium">Courses</h3>
                        <Tree
                          items={form.watch('curriculum.courses')?.map((course) => ({
                            id: course.id,
                            name: course.id,
                            children: course.prerequisites.map((prereq) => ({
                              id: prereq,
                              name: prereq
                            }))
                          }))}
                          onMove={(dragId, dropId) => {
                            // Handle prerequisite reordering
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="requirements">
                  <Card>
                    <CardHeader>
                      <CardTitle>Requirements Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="requirements.totalCredits"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Credits Required</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="requirements.minimumGPA"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minimum GPA</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="requirements.electiveCreditHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Elective Credit Hours</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="campus">
                  <Card>
                    <CardHeader>
                      <CardTitle>Campus Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {form.watch('campusSettings')?.map((campus, index) => (
                        <div key={index} className="space-y-4 mb-6">
                          <FormField
                            control={form.control}
                            name={`campusSettings.${index}.campusId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Campus</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select campus" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Campus options would be populated here */}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Teaching Assignments</h4>
                            {campus.teachingAssignments.map((_, assignmentIndex) => (
                              <div key={assignmentIndex} className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`campusSettings.${index}.teachingAssignments.${assignmentIndex}.courseId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Course</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {/* Course options would be populated here */}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`campusSettings.${index}.teachingAssignments.${assignmentIndex}.teacherId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Teacher</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {/* Teacher options would be populated here */}
                                        </SelectContent>
                                      </Select>
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
                                const assignments = form.getValues(`campusSettings.${index}.teachingAssignments`) || [];
                                form.setValue(`campusSettings.${index}.teachingAssignments`, [
                                  ...assignments,
                                  { courseId: '', teacherId: '' }
                                ]);
                              }}
                            >
                              Add Teaching Assignment
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => {
                          const settings = form.getValues('campusSettings') || [];
                          form.setValue('campusSettings', [
                            ...settings,
                            {
                              campusId: '',
                              resourceRequirements: [],
                              teachingAssignments: []
                            }
                          ]);
                        }}
                      >
                        Add Campus
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <div className="mt-6 flex justify-end">
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </Tabs>
        </CardContent>
      </Card>
    </DndProvider>
  );
};

export default ProgramConfiguration; 