'use client';

import { z } from "zod";
import { useState } from "react";
import { useForm as useHookForm, useFieldArray as useHookFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/forms/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/forms/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/forms/select";
import { api } from "@/trpc/react";
import { SystemStatus } from "@/server/api/constants";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/feedback/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { SubjectList } from "./SubjectList";

const courseFormSchema = z.object({
  code: z.string().min(2, "Code must be at least 2 characters"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  level: z.number().min(1, "Level must be at least 1"),
  credits: z.number().min(0, "Credits must be at least 0"),
  programId: z.string().min(1, "Program is required"),
  status: z.nativeEnum(SystemStatus).default(SystemStatus.ACTIVE),
  objectives: z.array(
    z.object({
      description: z.string().min(1, "Objective description is required"),
    })
  ).optional().default([]),
  resources: z.array(
    z.object({
      name: z.string().min(1, "Resource name is required"),
      url: z.string().url("Must be a valid URL"),
      type: z.string().min(1, "Resource type is required"),
      description: z.string().optional(),
      isRequired: z.boolean().default(false),
    })
  ).optional().default([]),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

type CourseFormProps = {
  initialData?: CourseFormValues;
  courseId?: string;
  onSubmit?: (data: CourseFormValues) => Promise<void>;
  isLoading?: boolean;
};

// Define the Program type to match the API response
interface Program {
  id: string;
  name: string;
  code: string;
  type: string;
  status: SystemStatus;
  _count?: {
    courses: number;
    campusOfferings: number;
  };
}

export const CourseForm = ({
  initialData,
  courseId,
  onSubmit: externalSubmit,
  isLoading = false
}: CourseFormProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!courseId;

  // Fetch programs for the dropdown
  const { data: programs } = api.program.list.useQuery({
    status: SystemStatus.ACTIVE,
  });

  const createCourse = api.course.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course created successfully",
        variant: "success",
      });
      router.push("/admin/system/courses");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "error",
      });
    },
  });

  const updateCourse = api.course.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully",
        variant: "success",
      });
      router.push("/admin/system/courses");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "error",
      });
    },
  });

  const form = useHookForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: initialData || {
      code: "",
      name: "",
      description: "",
      level: 1,
      credits: 3,
      programId: "",
      status: SystemStatus.ACTIVE,
      objectives: [{ description: "" }],
      resources: [{ name: "", url: "", type: "TEXTBOOK" }],
    },
  });

  // Use the correct generic type parameters for the field arrays
  const objectivesArray = useHookFieldArray({
    control: form.control,
    name: "objectives" as const
  });

  const resourcesArray = useHookFieldArray({
    control: form.control,
    name: "resources" as const
  });

  // Helper function to add an objective
  const addObjective = () => {
    objectivesArray.append({ description: "" });
  };

  // Helper function to add a resource
  const addResource = () => {
    resourcesArray.append({ name: "", url: "", type: "TEXTBOOK" });
  };

  const onSubmit = (data: CourseFormValues) => {
    if (externalSubmit) {
      externalSubmit(data);
    } else if (isEditing && courseId) {
      updateCourse.mutate({
        id: courseId,
        ...data,
      });
    } else {
      createCourse.mutate(data);
    }
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState("details");

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">Course Details</TabsTrigger>
        <TabsTrigger value="subjects" disabled={!isEditing}>Subjects</TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="programId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {programs?.programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              <h3 className="text-lg font-semibold">Course Objectives</h3>
              {objectivesArray.fields.map((field, index) => (
                <FormField
                  key={field.id}
                  name={`objectives.${index}.description`}
                  control={form.control}
                  render={({ field: objectiveField }) => (
                    <FormItem>
                      <FormLabel>Objective {index + 1}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...objectiveField} />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => objectivesArray.remove(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
              <Button
                type="button"
                onClick={addObjective}
              >
                Add Objective
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resource Requirements</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                {resourcesArray.fields.map((field, index) => (
                  <div key={field.id} className="mb-6 p-4 border border-gray-200 rounded-md bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Resource {index + 1}</h4>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => resourcesArray.remove(index)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormField
                        name={`resources.${index}.name`}
                        control={form.control}
                        render={({ field: resourceField }) => (
                          <FormItem>
                            <FormLabel>Resource Name</FormLabel>
                            <FormControl>
                              <Input {...resourceField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                    )}
                  />

                      <FormField
                        name={`resources.${index}.type`}
                        control={form.control}
                        render={({ field: typeField }) => (
                          <FormItem>
                            <FormLabel>Resource Type</FormLabel>
                            <Select
                              onValueChange={typeField.onChange}
                              value={typeField.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select resource type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="TEXTBOOK">Textbook</SelectItem>
                                <SelectItem value="EBOOK">E-Book</SelectItem>
                                <SelectItem value="VIDEO">Video</SelectItem>
                                <SelectItem value="ARTICLE">Article</SelectItem>
                                <SelectItem value="WEBSITE">Website</SelectItem>
                                <SelectItem value="SOFTWARE">Software</SelectItem>
                                <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      name={`resources.${index}.url`}
                      control={form.control}
                      render={({ field: urlField }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Resource URL</FormLabel>
                          <FormControl>
                            <Input {...urlField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`resources.${index}.description`}
                      control={form.control}
                      render={({ field: descField }) => (
                        <FormItem className="mb-4">
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...descField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`resources.${index}.isRequired`}
                      control={form.control}
                      render={({ field: requiredField }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={requiredField.value}
                              onChange={requiredField.onChange}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">Required resource for this course</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addResource}
                  className="w-full"
                >
                  Add Resource
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading || createCourse.isLoading || updateCourse.isLoading}
            >
              {isLoading || createCourse.isLoading || updateCourse.isLoading ? (
                <>Loading...</>
              ) : (
                isEditing ? "Update Course" : "Create Course"
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="subjects" className="pt-4">
        {courseId ? (
          <SubjectList courseId={courseId} />
        ) : (
          <div className="text-center p-6 bg-muted rounded-md">
            <p className="text-muted-foreground">Save the course first to manage subjects.</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};