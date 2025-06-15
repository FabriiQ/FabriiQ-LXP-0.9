'use client';

// @ts-nocheck - Disable TypeScript checking for this file due to issues with the teacher router

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/forms/form";
import { Input } from "@/components/ui/forms/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { Textarea } from "@/components/ui/forms/textarea";
import { DatePicker } from "@/components/ui/forms/date-picker";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/atoms/badge";
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the schema for the form
const systemTeacherFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.string().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  campusId: z.string({
    required_error: "Please select a campus",
  }),
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
  // New fields for manual account creation
  createManualAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Add conditional validation for username and password
const systemTeacherFormSchemaWithValidation = systemTeacherFormSchema.refine(
  (data) => {
    // If createManualAccount is true, username and password are required
    if (data.createManualAccount) {
      return !!data.username && !!data.password && data.password.length >= 8;
    }
    return true;
  },
  {
    message: "Username and password (min 8 characters) are required when creating a manual account",
    path: ["password"],
  }
);

type SystemTeacherFormData = z.infer<typeof systemTeacherFormSchema>;

type Campus = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
};

interface SystemTeacherFormProps {
  userId: string;
  campuses: Campus[];
  subjects: Subject[];
  isLoadingCampuses: boolean;
  isLoadingSubjects: boolean;
  teacherId?: string;
  initialData?: any;
}

export function SystemTeacherForm({
  userId,
  campuses,
  subjects, // Used in the subjects field
  isLoadingCampuses,
  isLoadingSubjects, // Used in the subjects field
  teacherId,
  initialData
}: SystemTeacherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!teacherId && !!initialData;

  // Create teacher mutation
  const createSystemTeacher = api.teacher.createSystemTeacher.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher created successfully",
        variant: "success"
      });
      router.push('/admin/system/teachers');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create teacher",
        variant: "error"
      });
      setIsSubmitting(false);
    }
  });

  // Update teacher mutation
  const updateSystemTeacher = (api.teacher as any).update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher updated successfully",
        variant: "success"
      });
      router.push(`/admin/system/teachers/${teacherId}`);
      router.refresh();
    },
    // @ts-ignore
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher",
        variant: "error"
      });
      setIsSubmitting(false);
    }
  });

  // Set up default values based on whether we're editing or creating
  const defaultValues: SystemTeacherFormData = isEditing && initialData
    ? {
        firstName: initialData.user?.profileData?.firstName || "",
        lastName: initialData.user?.profileData?.lastName || "",
        email: initialData.user?.email || "",
        phone: initialData.user?.phoneNumber || "",
        specialization: initialData.specialization || "",
        qualifications: Array.isArray(initialData.qualifications) && initialData.qualifications.length > 0
          ? initialData.qualifications[0]?.value || ""
          : "",
        joinDate: initialData.user?.profileData?.joinDate || new Date().toISOString().split('T')[0],
        address: initialData.user?.profileData?.address || "",
        city: initialData.user?.profileData?.city || "",
        state: initialData.user?.profileData?.state || "",
        postalCode: initialData.user?.profileData?.postalCode || "",
        country: initialData.user?.profileData?.country || "United States",
        bio: initialData.user?.profileData?.bio || "",
        subjects: initialData.subjectQualifications?.map((sq: any) => sq.subjectId) || [],
        campusId: initialData.user?.primaryCampusId || "",
        sendInvitation: false,
        requirePasswordChange: false,
        createManualAccount: false,
        username: initialData.user?.username || "",
        password: "",
      }
    : {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        specialization: "",
        qualifications: "",
        joinDate: new Date().toISOString().split('T')[0],
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
        bio: "",
        subjects: [],
        campusId: "",
        sendInvitation: true,
        requirePasswordChange: true,
        createManualAccount: false,
        username: "",
        password: "",
      };

  const form = useForm<SystemTeacherFormData>({
    resolver: zodResolver(systemTeacherFormSchemaWithValidation),
    defaultValues
  });

  // Watch for createManualAccount changes to update form validation
  const createManualAccount = form.watch("createManualAccount");

  async function onSubmit(data: SystemTeacherFormData) {
    setIsSubmitting(true);
    console.log('Submitting data:', data);

    if (isEditing && teacherId) {
      // Update existing teacher
      // @ts-ignore - Bypass TypeScript error
      updateSystemTeacher.mutate({
        id: teacherId,
        ...data,
        userId: userId, // Add the userId parameter
      });
    } else {
      // Create new teacher
      createSystemTeacher.mutate({
        ...data,
        userId,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Teacher' : 'Teacher Information'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update the teacher details' : 'Enter the details for the new teacher'}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
            <CardContent>
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="contact">Contact Details</TabsTrigger>
                <TabsTrigger value="account">Account Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="campusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Campus</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCampuses ? (
                            <SelectItem value="loading" disabled>Loading campuses...</SelectItem>
                          ) : campuses.length === 0 ? (
                            <SelectItem value="none" disabled>No campuses available</SelectItem>
                          ) : (
                            campuses.map((campus) => (
                              <SelectItem key={campus.id} value={campus.id}>
                                {campus.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => field.onChange([...field.value || [], value])}
                          value=""
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subjects" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingSubjects ? (
                              <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                            ) : subjects.length === 0 ? (
                              <SelectItem value="none" disabled>No subjects available</SelectItem>
                            ) : (
                              subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value?.map((subjectId) => {
                          const subject = subjects.find(s => s.id === subjectId);
                          return (
                            <Badge key={subjectId} variant="secondary" className="flex items-center gap-1">
                              {subject?.name || subjectId}
                              <button
                                type="button"
                                onClick={() => field.onChange(field.value?.filter(id => id !== subjectId))}
                                className="ml-1 rounded-full hover:bg-gray-200 p-1"
                              >
                                ×
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joinDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Join Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          setDate={(newDate: Date | undefined) =>
                            field.onChange(newDate?.toISOString().split('T')[0])
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
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
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="account" className="space-y-6">
                <FormField
                  control={form.control}
                  name="createManualAccount"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Create manual username and password</FormLabel>
                      <FormDescription>
                        If unchecked, the teacher will receive an invitation email to set up their account.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {createManualAccount && (
                  <>
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            If left empty, email will be used as username
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {!createManualAccount && (
                  <>
                    <FormField
                      control={form.control}
                      name="sendInvitation"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Send invitation email</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requirePasswordChange"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Require password change on first login</FormLabel>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>

          <CardContent className="flex justify-end space-x-4 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/system/teachers')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
              )}
              {isEditing ? 'Update Teacher' : 'Create Teacher'}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
