"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { CreateButton } from "@/components/ui/loading-button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/forms/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ChevronLeft, UserPlus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/feedback/toast";
import { TRPCClientErrorLike } from '@trpc/client';
import { AppRouter } from '@/server/api/root';
import { generateEnrollmentNumber } from '@/utils/enrollment-number';



const studentFormSchema = z.object({
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
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], {
    required_error: "Please select a gender.",
  }).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  classId: z.string().optional(),
  enrollmentDate: z.string(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  notes: z.string().optional(),
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
  // Manual credential creation fields
  createManualAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Add conditional validation for username and password
const studentFormSchemaWithValidation = studentFormSchema.refine(
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

interface StudentFormProps {
  campusId: string;
  campusName: string;
  institutionId: string;
  programs: {
    id: string;
    name: string;
  }[];
  terms: {
    id: string;
    name: string;
  }[];
  classes: {
    id: string;
    name: string;
    courseCampus: {
      course: {
        name: string;
      };
    };
    term: {
      name: string;
    };
  }[];
  userId: string;
}

export function StudentFormClient({
  campusId,
  campusName,
  institutionId,
  programs,
  terms,
  classes,
  userId
}: StudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  // Add enrollment mutation
  const enrollStudentMutation = api.enrollment.createEnrollment.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      toast({
        title: "Success",
        description: "Student enrolled successfully",
      });
      router.push("/admin/campus/students");
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setIsSubmitting(false);
      toast({
        title: "Error enrolling student",
        description: error.message,
        variant: "error",
      });
    }
  });

  const form = useForm<z.infer<typeof studentFormSchemaWithValidation>>({
    resolver: zodResolver(studentFormSchemaWithValidation),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: undefined,
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "United States",
      classId: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      notes: "",
      sendInvitation: true,
      requirePasswordChange: true,
      createManualAccount: false,
      username: "",
      password: "",
    },
  });

  // Watch for createManualAccount changes to update form validation
  const createManualAccount = form.watch("createManualAccount");

  const createStudentMutation = api.user.createStudent.useMutation({
    onSuccess: (result) => {
      setIsSubmitting(false);

      if (result.success && result.student) {
        // Student creation and class enrollment (if selected) are handled in the service
        toast({
          title: "Success",
          description: result.message,
        });
        router.push("/admin/campus/students");
      } else {
        // Handle validation errors gracefully
        setError(result.message);

        if (result.validation.errors.email) {
          form.setError("email", {
            type: "manual",
            message: result.validation.errors.email
          });
        }

        if (result.validation.errors.username) {
          form.setError("username", {
            type: "manual",
            message: result.validation.errors.username
          });
        }

        // Show existing student information if available
        if (result.validation.existingStudent) {
          toast({
            title: "Student Already Exists",
            description: `A student with this ${result.validation.errors.email ? 'email' : 'enrollment number'} already exists: ${result.validation.existingStudent.name} (${result.validation.existingStudent.email})`,
            variant: "warning",
          });
        } else {
          toast({
            title: "Validation Failed",
            description: result.message,
            variant: "error",
          });
        }
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setIsSubmitting(false);
      setError(error.message);

      toast({
        title: "Error creating student",
        description: error.message,
        variant: "error",
      });
    }
  });

  // Update the email validation function to be more robust
  const handleEmailBlur = async (email: string) => {
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/validate-email?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        throw new Error('Failed to validate email');
      }
      
      const { isAvailable } = await response.json();
      
      if (!isAvailable) {
        form.setError("email", {
          type: "manual",
          message: "This email is already registered in the system"
        });
        // Clear the email field
        form.setValue("email", "");
      } else {
        // Clear any existing errors if email is valid and available
        form.clearErrors("email");
      }
    } catch (error) {
      console.error("Error validating email:", error);
      toast({
        title: "Error",
        description: "Failed to validate email address",
        variant: "error",
      });
    }
  };

  // Update the onSubmit function to prevent submission if email is already taken
  const onSubmit = async (data: z.infer<typeof studentFormSchema>) => {
    if (form.formState.errors.email) {
      toast({
        title: "Error",
        description: "Please fix the email validation errors before submitting",
        variant: "error",
      });
      return;
    }

    // Reset retry count on new submission (not retries)
    if (!isSubmitting) {
      setRetryCount(0);
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      // Create the student using the new graceful endpoint
      const result = await createStudentMutation.mutateAsync({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        username: data.createManualAccount && data.username ? data.username : undefined,
        phoneNumber: data.phone,
        campusId: campusId,
        classId: data.classId, // Include class enrollment
        profileData: {
          // enrollmentNumber will be generated server-side with proper institution/campus codes
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: data.country,
          gender: data.gender,
          emergencyContact: {
            name: data.emergencyContactName,
            phone: data.emergencyContactPhone,
            relationship: data.emergencyContactRelationship,
          },
          notes: data.notes,
          sendInvitation: data.sendInvitation,
          requirePasswordChange: data.requirePasswordChange,
          createManualAccount: data.createManualAccount,
        }
      });

      // The result handling is now done in the mutation's onSuccess callback
      // If we reach here, the mutation was successful
      if (result.success && result.student) {
        setIsSubmitting(false);
        const redirectId = result.student.studentProfileId || result.student.id;
        router.push(`/admin/campus/students/${redirectId}`);
      }

    } catch (error: unknown) {
      // This catch block should rarely be reached since we handle errors gracefully in the service
      setIsSubmitting(false);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "error",
      });
    }
  };



  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
        <CardDescription>Enter the student's details to create a new account</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
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
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Email address" 
                        {...field} 
                        onBlur={(e) => {
                          field.onBlur();
                          handleEmailBlur(e.target.value);
                        }}
                        className={form.formState.errors.email ? "border-red-500" : ""}
                      />
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
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Street address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
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
                      <Input placeholder="State/Province" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.name} - {classItem.courseCampus.course.name} ({classItem.term.name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional: Select a class to enroll the student
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Emergency contact phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="emergencyContactRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="Relationship to student" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional notes about this student"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Account Settings</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="createManualAccount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Create manual username and password</FormLabel>
                        <FormDescription>
                          If unchecked, the student will receive an invitation email to set up their account.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {createManualAccount && (
                  <div className="space-y-4 pl-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter username" {...field} />
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
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="sendInvitation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Send Invitation Email</FormLabel>
                        <FormDescription>
                          Send an email invitation to the student with login instructions
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirePasswordChange"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Require Password Change</FormLabel>
                        <FormDescription>
                          Student will be required to set a new password on first login
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/admin/campus/students">Cancel</Link>
            </Button>
            <CreateButton
              type="submit"
              loading={isSubmitting}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Create Student
            </CreateButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}





















