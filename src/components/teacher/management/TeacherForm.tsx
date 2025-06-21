'use client';

import { useState, useEffect } from "react";
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
} from "~/components/ui/forms/form";
import { Input } from "~/components/ui/forms/input";
import { Button } from "~/components/ui/button";
import { CreateButton, UpdateButton } from "@/components/ui/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/forms/select";
import { Textarea } from "~/components/ui/forms/textarea";
import { DatePicker } from "~/components/ui/forms/date-picker";
import { Checkbox } from "~/components/ui/forms/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/data-display/card";
import { useToast, type ToastVariant } from "~/components/ui/feedback/toast";
import { api } from "~/trpc/react";
import { useRouter } from 'next/navigation';

// Update DatePickerProps interface to match component props
interface DatePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const teacherFormSchema = z.object({
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
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

type Subject = {
  id: string;
  name: string;
};

interface TeacherFormProps {
  campusId: string;
  campusName: string;
  subjects: Subject[];
  userId: string;
  onSuccess?: () => void;
  teacherId?: string;
  initialData?: any;
}

export function TeacherForm({ campusId, campusName, subjects, userId, teacherId, initialData }: TeacherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!teacherId && !!initialData;

  const createTeacher = api.teacher.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher created successfully",
        variant: "success"
      });
      router.push('/admin/campus/teachers');
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

  const updateTeacher = api.teacher.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher updated successfully",
        variant: "success"
      });
      router.push(`/admin/campus/teachers/${teacherId}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update teacher",
        variant: "error"
      });
      setIsSubmitting(false);
    }
  });

  // Set up default values based on whether we're editing or creating
  const defaultValues: TeacherFormData = isEditing
    ? {
        firstName: initialData.user?.firstName || initialData.user?.name?.split(' ')[0] || "",
        lastName: initialData.user?.lastName || initialData.user?.name?.split(' ').slice(1).join(' ') || "",
        email: initialData.user?.email || "",
        phone: initialData.user?.phoneNumber || "",
        specialization: initialData.specialization || "",
        qualifications: initialData.qualifications || "",
        joinDate: initialData.joinDate ? new Date(initialData.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        address: initialData.address || "",
        city: initialData.city || "",
        state: initialData.state || "",
        postalCode: initialData.postalCode || "",
        country: initialData.country || "United States",
        bio: initialData.bio || "",
        subjects: initialData.subjectQualifications?.map((sq: any) => sq.subjectId) || [],
        sendInvitation: false,
        requirePasswordChange: false
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
        sendInvitation: true,
        requirePasswordChange: true
      };

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues
  });

  // Display current form values during development
  useEffect(() => {
    if (isEditing) {
      console.log('Form values:', form.getValues());
      console.log('Initial data:', initialData);
    }
  }, [form, initialData, isEditing]);

  async function onSubmit(data: TeacherFormData) {
    setIsSubmitting(true);
    console.log('Submitting data:', data);
    
    if (isEditing && teacherId) {
      updateTeacher.mutate({
        ...data,
        id: teacherId,
        campusId,
        userId,
      });
    } else {
      createTeacher.mutate({
        ...data,
        campusId,
        userId,
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Teacher Information" : "Teacher Information"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? `Update teacher details for ${initialData.user?.name || ''} at ${campusName}`
            : `Enter the details for the new teacher at ${campusName}`
          }
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
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

            <div className="space-y-4">
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
            </div>
          </CardContent>
          
          <CardContent className="flex justify-end space-x-4 pt-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => isEditing ? router.push(`/admin/campus/teachers/${teacherId}`) : router.push('/admin/campus/teachers')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {isEditing ? (
              <UpdateButton type="submit" loading={isSubmitting}>
                Update Teacher
              </UpdateButton>
            ) : (
              <CreateButton type="submit" loading={isSubmitting}>
                Create Teacher
              </CreateButton>
            )}
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
