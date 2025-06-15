"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { CampusAssignmentManager } from "./CampusAssignmentManager";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  userType: z.string(),
  status: z.string(),
  campusId: z.string().optional(),
  accessScope: z.string().default("SINGLE_CAMPUS"),
  password: z.string().min(6).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
  initialData: any;
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading?: boolean;
}

export function EditUserForm({ initialData, onSubmit, isLoading = false }: EditUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTab, setSelectedTab] = useState("basic");

  // Fetch campuses for assignment
  const { data: campusesData, isLoading: isLoadingCampuses } = api.campus.getAllCampuses.useQuery(
    undefined,
    { enabled: true }
  );

  // Initialize form with initial data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      username: initialData?.username || "",
      userType: initialData?.userType || "STUDENT",
      status: initialData?.status || "ACTIVE",
      campusId: initialData?.primaryCampusId || "",
      accessScope: initialData?.accessScope || "SINGLE_CAMPUS",
      password: "",
    },
  });

  const userType = form.watch("userType");

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    try {
      // Only include password if it's provided and not empty
      const dataToSubmit = { ...values };
      if (!dataToSubmit.password || dataToSubmit.password.trim() === '') {
        delete dataToSubmit.password;
      }

      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="access">Access & Permissions</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <TabsContent value="basic" className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the user's full name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the user's email address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                      <SelectItem value="COORDINATOR">Campus Coordinator</SelectItem>
                      <SelectItem value="CAMPUS_PRINCIPAL">Campus Principal</SelectItem>
                      <SelectItem value="ADMIN">Campus Admin</SelectItem>
                      <SelectItem value="SYSTEM_ADMIN">System Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the type of user.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the user's account status.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            {(userType === "ADMIN" || userType === "COORDINATOR" || userType === "TEACHER") && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="campusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Campus</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCampuses ? (
                            <SelectItem value="loading" disabled>
                              Loading campuses...
                            </SelectItem>
                          ) : campusesData && campusesData.length > 0 ? (
                            campusesData.map((campus) => (
                              <SelectItem key={campus.id} value={campus.id}>
                                {campus.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-campus" disabled>
                              No campuses available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The primary campus this user belongs to. This is used for default views and permissions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />

                {initialData?.id && (
                  <CampusAssignmentManager
                    userId={initialData.id}
                    primaryCampusId={form.watch("campusId")}
                    onPrimaryCampusChange={(campusId) => form.setValue("campusId", campusId)}
                  />
                )}
              </div>
            )}

            {userType === "SYSTEM_ADMIN" && (
              <FormField
                control={form.control}
                name="accessScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Scope</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SINGLE_CAMPUS">Single Campus</SelectItem>
                        <SelectItem value="MULTI_CAMPUS">Multiple Campuses</SelectItem>
                        <SelectItem value="INSTITUTION">Institution-wide</SelectItem>
                        <SelectItem value="GLOBAL">Global Access</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define the scope of access for this system administrator.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="rounded-md border p-4">
              <h3 className="text-sm font-medium mb-2">Role Permissions</h3>
              <div className="space-y-2">
                {userType === "STUDENT" && (
                  <div>
                    <Badge variant="outline">Student Portal Access</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Can access student dashboard, courses, and assessments
                    </p>
                  </div>
                )}
                {userType === "TEACHER" && (
                  <div>
                    <Badge variant="outline">Teacher Portal Access</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Can manage classes, assessments, and student grades
                    </p>
                  </div>
                )}
                {userType === "COORDINATOR" && (
                  <div>
                    <Badge variant="outline">Coordinator Portal Access</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Can coordinate programs, teachers, and campus activities
                    </p>
                  </div>
                )}
                {userType === "ADMIN" && (
                  <div>
                    <Badge variant="outline">Campus Admin Access</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Can manage all campus resources, users, and settings
                    </p>
                  </div>
                )}
                {userType === "SYSTEM_ADMIN" && (
                  <div>
                    <Badge variant="outline">System Admin Access</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Has full system access and can manage all settings
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormDescription>
                    The username is used for login and cannot be changed by the user.
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
                  <FormLabel>New Password</FormLabel>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Leave blank to keep current password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                  </div>
                  <FormDescription>
                    Enter a new password only if you want to change it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-md border p-4 bg-muted/50">
              <h3 className="text-sm font-medium mb-2">Account Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">User ID:</span> {initialData?.id}
                </p>
                <p>
                  <span className="font-medium">Created:</span> {initialData?.createdAt ? new Date(initialData.createdAt).toLocaleString() : 'Unknown'}
                </p>
                <p>
                  <span className="font-medium">Last Updated:</span> {initialData?.updatedAt ? new Date(initialData.updatedAt).toLocaleString() : 'Unknown'}
                </p>
                <p>
                  <span className="font-medium">Last Login:</span> {initialData?.lastLoginAt ? new Date(initialData.lastLoginAt).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          </TabsContent>

          <div className="pt-4 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Tabs>
  );
}
