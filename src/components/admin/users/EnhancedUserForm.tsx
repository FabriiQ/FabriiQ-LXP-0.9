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
import { Eye, EyeOff, Copy, Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  userType: z.string(),
  generateCredentials: z.boolean().default(true),
  username: z.string().optional(),
  password: z.string().optional(),
  campusId: z.string().optional(),
  accessScope: z.string().default("SINGLE_CAMPUS"),
});

type FormValues = z.infer<typeof formSchema>;

interface EnhancedUserFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading?: boolean;
}

export function EnhancedUserForm({ onSubmit, isLoading = false }: EnhancedUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [selectedTab, setSelectedTab] = useState("basic");

  // Fetch campuses for assignment
  const { data: campusesData, isLoading: isLoadingCampuses } = api.campus.getAll.useQuery(
    undefined,
    { enabled: true }
  );

  // Debug campus data
  useEffect(() => {
    console.log('Campus data:', campusesData);
  }, [campusesData]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      userType: "STUDENT",
      generateCredentials: true,
      username: "",
      password: "",
      campusId: "",
      accessScope: "SINGLE_CAMPUS",
    },
  });

  // Watch for changes to generate credentials checkbox
  const generateCredentials = form.watch("generateCredentials");
  const userType = form.watch("userType");

  // Generate username and password when name or email changes if generateCredentials is true
  useEffect(() => {
    if (generateCredentials) {
      const name = form.getValues("name");
      const email = form.getValues("email");

      if (name && email) {
        // Generate username from name (first letter of first name + last name, lowercase)
        const nameParts = name.trim().split(" ");
        let username = "";

        if (nameParts.length > 1) {
          username = (nameParts[0][0] + nameParts[nameParts.length - 1]).toLowerCase();
        } else {
          username = name.toLowerCase().replace(/\s+/g, "");
        }

        // Add random numbers to make it unique
        username += Math.floor(1000 + Math.random() * 9000);

        // Generate a random password
        const password = generateRandomPassword();

        setGeneratedUsername(username);
        setGeneratedPassword(password);

        // Set the values in the form
        form.setValue("username", username);
        form.setValue("password", password);
      }
    }
  }, [form.getValues("name"), form.getValues("email"), generateCredentials, form]);

  // Function to generate a random password
  function generateRandomPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // Function to copy text to clipboard
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // Show feedback using console log (you can replace with toast if available)
    console.log('Copied to clipboard:', text);
  }

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Tabs value={selectedTab} onValueChange={setSelectedTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="basic">Basic Information</TabsTrigger>
        <TabsTrigger value="credentials">Credentials</TabsTrigger>
        <TabsTrigger value="access">Access & Permissions</TabsTrigger>
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
                    Select the type of user you want to create.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6">
            <FormField
              control={form.control}
              name="generateCredentials"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Generate Credentials
                    </FormLabel>
                    <FormDescription>
                      Automatically generate a username and password for this user.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Separator className="my-4" />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <Input
                          placeholder="username"
                          {...field}
                          disabled={generateCredentials}
                          value={generateCredentials ? generatedUsername : field.value}
                        />
                      </FormControl>
                      {generateCredentials && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(generatedUsername)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      {generateCredentials ? "Auto-generated username" : "Enter a username for this user"}
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
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="password"
                            {...field}
                            disabled={generateCredentials}
                            value={generateCredentials ? generatedPassword : field.value}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0"
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
                      {generateCredentials && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(generatedPassword)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      {generateCredentials ? "Auto-generated password" : "Enter a password for this user"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            {(userType === "ADMIN" || userType === "COORDINATOR" || userType === "TEACHER") && (
              <FormField
                control={form.control}
                name="campusId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign to Campus</FormLabel>
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
                      Select the campus this user will be assigned to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

          <div className="pt-4 border-t">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Tabs>
  );
}
