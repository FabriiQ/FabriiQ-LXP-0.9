'use client';

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/forms/form";
import { Input } from "@/components/ui/forms/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { useRouter } from 'next/navigation';

const teacherFormSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface EditTeacherFormProps {
  teacherId: string;
  campusId: string;
  userId: string;
  initialData: any;
}

export function EditTeacherForm({ teacherId, campusId, userId, initialData }: EditTeacherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Set up default values from existing teacher data
  const defaultValues = {
    firstName: initialData.user?.firstName || initialData.user?.name?.split(' ')[0] || "",
    lastName: initialData.user?.lastName || initialData.user?.name?.split(' ').slice(1).join(' ') || "",
    email: initialData.user?.email || "",
    phone: initialData.user?.phoneNumber || "",
    specialization: initialData.specialization || "",
  };

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues
  });

  // Simple mutation to update teacher
  const updateTeacher = api.teacher.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher updated successfully",
        variant: "success"
      });
      router.push(`/admin/campus/teachers/${teacherId}`);
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

  // Submit handler
  async function onSubmit(data: TeacherFormData) {
    setIsSubmitting(true);
    
    updateTeacher.mutate({
      ...data,
      id: teacherId,
      campusId,
      userId,
      // Include required fields for the update mutation
      subjects: initialData.subjectQualifications?.map((sq: any) => sq.subjectId) || [],
      joinDate: initialData.joinDate || new Date().toISOString().split('T')[0],
      qualifications: initialData.qualifications || "",
      address: initialData.address || "",
      city: initialData.city || "",
      state: initialData.state || "",
      postalCode: initialData.postalCode || "",
      country: initialData.country || "",
      bio: initialData.bio || "",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Teacher Information</CardTitle>
        <CardDescription>
          Update teacher details for {initialData.user?.name || ''}
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
          </CardContent>
          
          <CardContent className="flex justify-end space-x-4 pt-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/admin/campus/teachers/${teacherId}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></div>
              )}
              Update Teacher
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
} 