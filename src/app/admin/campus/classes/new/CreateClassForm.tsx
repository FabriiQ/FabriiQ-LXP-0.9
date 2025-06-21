'use client';

import { type FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/feedback/toast';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/forms/input";
import { Button } from "@/components/ui/button";
import { CreateButton } from "@/components/ui/loading-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/forms/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CreateTermDialog } from './CreateTermDialog';
import { GradingType, GradingScale, type CourseCampus } from '@prisma/client';

import { useRouter } from 'next/navigation';
import { api } from '@/utils/api';

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  programId: string;
}

export interface Term {
  id: string;
  name: string;
  code: string;
  description: string | null;
  termType: string;
  termPeriod: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  schedulePatternId: string | null;
  academicCycle: {
    id: string;
    name: string;
    code: string;
    startDate: Date;
    endDate: Date | null;
  };
}

interface CreateClassFormProps {
  campusId: string;
  courseCampuses: (CourseCampus & {
    course: Course;
    programCampus: {
      id: string;
      program: Program;
    };
  })[];
  terms: Term[];
  academicCycles: {
    id: string;
    name: string;
    code: string;
    startDate: Date;
    endDate: Date | null;
  }[];
  selectedCourseId?: string;
}

const createClassSchema = z.object({
  code: z.string().min(1, "Class code is required"),
  name: z.string().min(1, "Class name is required"),
  courseCampusId: z.string().min(1, "Course is required"),
  termId: z.string().min(1, "Term is required"), // Changed from optional to required
  minCapacity: z.number().min(1, "Minimum capacity must be at least 1").optional(),
  maxCapacity: z.number().min(1, "Maximum capacity must be at least 1").optional(),
  classTeacherId: z.string().optional(),
  facilityId: z.string().optional(),
  programCampusId: z.string().min(1, "Program is required"),
  // Gradebook settings
  gradebook: z.object({
    gradingType: z.nativeEnum(GradingType),
    gradingScale: z.nativeEnum(GradingScale),
    settings: z.object({
      passingGrade: z.number().min(0).max(100).optional(),
      weights: z.object({
        attendance: z.number().min(0).max(100).optional(),
        activities: z.number().min(0).max(100).optional(),
        assessments: z.number().min(0).max(100).optional()
      }).optional()
    }).optional()
  }).optional()
});

type CreateClassFormValues = z.infer<typeof createClassSchema>;

const CreateClassForm: FC<CreateClassFormProps> = ({
  campusId,
  courseCampuses,
  terms,
  academicCycles,
  selectedCourseId
}) => {
  const [error, setError] = useState<string | null>(null);
  const [filteredTerms, setFilteredTerms] = useState<Term[]>(terms);
  const [isCreateTermDialogOpen, setIsCreateTermDialogOpen] = useState(false);
  const router = useRouter();

  const createClassMutation = api.class.create.useMutation({
    onSuccess: (newClass) => {
      toast({
        title: "Success",
        description: "Class created successfully",
        variant: "success"
      });
      // Fix the navigation path to use the correct URL structure
      router.push(`/admin/campus/classes/${newClass.id}`);
      router.refresh();
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating the class';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error"
      });
    }
  });

  const form = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      courseCampusId: selectedCourseId || '',
      code: "",
      name: "",
      minCapacity: 1,
      maxCapacity: 30,
      gradebook: {
        gradingType: GradingType.MANUAL,
        gradingScale: GradingScale.PERCENTAGE,
        settings: {
          passingGrade: 60,
          weights: {
            attendance: 10,
            activities: 40,
            assessments: 50
          }
        }
      }
    }
  });

  const onSubmit = async (data: CreateClassFormValues) => {
    try {
      setError(null);
      console.log('Form submission started with data:', data);

      const courseCampus = courseCampuses.find(cc => cc.id === data.courseCampusId);
      console.log('Found courseCampus:', courseCampus);

      if (!courseCampus) {
        throw new Error('Selected course not found');
      }

      const submitData = {
        ...data,
        campusId: courseCampus.campusId,
      };

      console.log('Submitting data to API:', submitData);

      await createClassMutation.mutateAsync(submitData);
    } catch (err) {
      console.error('Error creating class:', err);
      setError(err instanceof Error ? err.message : 'Failed to create class');
    }
  };

  const handleCourseChange = (courseId: string) => {
    const courseCampus = courseCampuses.find(cc => cc.id === courseId);
    if (courseCampus) {
      form.setValue('programCampusId', courseCampus.programCampus.id);

      const filtered = terms.filter(term => term.courseId === courseCampus.course.id);
      setFilteredTerms(filtered);
      form.setValue('termId', '');
    }
  };

  const handleCreateTerm = (newTerm: Term) => {
    if (newTerm && newTerm.id && newTerm.academicCycle) {
      setFilteredTerms(prev => [...prev, newTerm]);
      form.setValue('termId', newTerm.id);
    }
  };

  return (
    <div>
      <div className="hidden">
        Debug Info:
        <pre>
          {JSON.stringify({
            courseCampusesCount: courseCampuses.length,
            selectedCourseId,
            filteredTermsCount: filteredTerms.length,
          }, null, 2)}
        </pre>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <h2 className="text-2xl font-bold mb-4">Class Details</h2>
        <p className="text-gray-600 mb-6">Enter the details for the new class</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter class code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter class name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseCampusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCourseChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courseCampuses.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.course.name} ({cc.course.code}) - {cc.programCampus.program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a term" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredTerms.length > 0 ? (
                            filteredTerms.map((term) => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.name} ({term.code})
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-4 text-center">
                              <p className="text-sm text-gray-500">No terms available for this course.</p>
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateTermDialogOpen(true)}
                        disabled={!form.getValues('courseCampusId') || createClassMutation.isLoading}
                        className="transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        {filteredTerms.length > 0 ? "Add Term" : "Create Term"}
                      </Button>
                    </div>
                    {filteredTerms.length > 0 && (
                      <FormDescription>
                        Select an existing term or create a new one if needed
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter minimum capacity"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter maximum capacity"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Gradebook Settings */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Gradebook Settings</h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure the gradebook that will be automatically created for this class.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="gradebook.gradingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grading Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grading type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={GradingType.MANUAL}>Manual</SelectItem>
                          <SelectItem value={GradingType.AUTOMATIC}>Automatic</SelectItem>
                          <SelectItem value={GradingType.HYBRID}>Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How grades will be calculated for this class
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gradebook.gradingScale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grading Scale</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grading scale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={GradingScale.PERCENTAGE}>Percentage (0-100%)</SelectItem>
                          <SelectItem value={GradingScale.LETTER_GRADE}>Letter Grade (A-F)</SelectItem>
                          <SelectItem value={GradingScale.GPA}>GPA (0.0-4.0)</SelectItem>
                          <SelectItem value={GradingScale.CUSTOM}>Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The scale used to display grades
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="gradebook.settings.passingGrade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Grade (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter passing grade percentage"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum percentage required to pass the class
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-6">
                <h4 className="text-md font-medium mb-2">Grade Component Weights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="gradebook.settings.weights.attendance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attendance Weight (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter weight"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gradebook.settings.weights.activities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activities Weight (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter weight"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gradebook.settings.weights.assessments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessments Weight (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter weight"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Note: The total of all weights should equal 100%
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createClassMutation.isLoading}
              >
                Cancel
              </Button>
              <CreateButton
                type="submit"
                loading={createClassMutation.isLoading}
                onClick={() => {
                  console.log('Create Class button clicked');
                  console.log('Form values:', form.getValues());
                  console.log('Form errors:', form.formState.errors);
                }}
              >
                Create Class
              </CreateButton>
            </div>
          </form>
        </Form>
      </Card>

      <CreateTermDialog
        open={isCreateTermDialogOpen}
        onOpenChange={setIsCreateTermDialogOpen}
        courseId={courseCampuses.find(cc => cc.id === form.getValues('courseCampusId'))?.course.id || ''}
        academicCycleId={academicCycles[0]?.id || ''}
        onTermCreated={handleCreateTerm}
        academicCycles={academicCycles}
      />
    </div>
  );
};

export default CreateClassForm;
































