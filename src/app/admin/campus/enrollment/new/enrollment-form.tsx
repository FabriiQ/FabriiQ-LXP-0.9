"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/atoms/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/forms/form";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";

const enrollmentFormSchema = z.object({
  studentId: z.string({
    required_error: "Student is required",
  }),
  classId: z.string({
    required_error: "Class is required",
  }),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date().optional(),
  status: z.enum(["ACTIVE", "PENDING", "COMPLETED", "WITHDRAWN"], {
    required_error: "Status is required",
  }).default("ACTIVE"),
  notes: z.string().optional(),
  paymentStatus: z.enum(["PAID", "PENDING", "PARTIAL", "WAIVED"], {
    required_error: "Payment status is required",
  }).default("PENDING"),
  paymentAmount: z.number().optional(),
  paymentDueDate: z.date().optional(),
  documents: z.array(z.string()).optional(),
});

type Student = {
  id: string;
  name: string;
  email: string;
};

type Class = {
  id: string;
  name: string;
  programName: string;
};

type EnrollmentFormProps = {
  campusId: string;
  campusName: string;
  students: Student[];
  classes: Class[];
  userId: string;
};

export function EnrollmentForm({ campusId, campusName, students, classes, userId }: EnrollmentFormProps) {
  const [activeTab, setActiveTab] = useState<string>("single");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // tRPC mutations
  const createEnrollment = api.enrollment.createEnrollment.useMutation({
    onSuccess: () => {
      window.location.href = "/admin/campus/enrollment";
    },
    onError: (error: any) => {
      setError(error.message || "An error occurred while creating the enrollment");
      setIsSubmitting(false);
    }
  });

  const bulkEnroll = api.enrollment.bulkEnroll.useMutation({
    onSuccess: () => {
      window.location.href = "/admin/campus/enrollment";
    },
    onError: (error: any) => {
      setError(error.message || "An error occurred while creating the enrollments");
      setIsSubmitting(false);
    }
  });

  const singleForm = useForm({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      studentId: "",
      classId: "",
      startDate: new Date(),
      endDate: undefined,
      status: "ACTIVE",
      notes: "",
      paymentStatus: "PENDING",
      paymentAmount: undefined,
      paymentDueDate: undefined,
      documents: [],
    },
  });

  const bulkForm = useForm({
    resolver: zodResolver(
      z.object({
        classId: z.string({
          required_error: "Class is required",
        }),
        startDate: z.date({
          required_error: "Start date is required",
        }),
        endDate: z.date().optional(),
        status: z.enum(["ACTIVE", "PENDING"], {
          required_error: "Status is required",
        }).default("ACTIVE"),
      })
    ),
    defaultValues: {
      classId: "",
      startDate: new Date(),
      endDate: undefined,
      status: "ACTIVE",
    },
  });

  function handleSelectAllStudents(checked: boolean) {
    setSelectAll(checked);
    if (checked) {
      // If there's a search term, only select filtered students
      if (searchTerm.trim()) {
        setSelectedStudents(prev => {
          const filteredIds = filteredStudents.map(student => student.id);
          // Combine previously selected students with newly selected filtered students
          return [...new Set([...prev, ...filteredIds])];
        });
      } else {
        // If no search term, select all students
        setSelectedStudents(students.map(student => student.id));
      }
    } else {
      // If unchecking "Select All" with a search term, only deselect filtered students
      if (searchTerm.trim()) {
        setSelectedStudents(prev =>
          prev.filter(id => !filteredStudents.some(student => student.id === id))
        );
      } else {
        // If no search term, deselect all students
        setSelectedStudents([]);
      }
    }
  }

  function handleSelectStudent(studentId: string, checked: boolean) {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
      setSelectAll(false);
    }
  }

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    const name = student.name.toLowerCase();
    const email = student.email.toLowerCase();

    return name.includes(term) || email.includes(term);
  });

  async function onSubmitSingle(data: z.infer<typeof enrollmentFormSchema>) {
    setIsSubmitting(true);
    setError("");

    createEnrollment.mutate({
      studentId: data.studentId,
      classId: data.classId,
      startDate: data.startDate,
      createdById: userId,
      notes: data.notes,
    });
  }

  async function onSubmitBulk(data: any) {
    if (selectedStudents.length === 0) {
      setError("Please select at least one student");
      return;
    }

    setIsSubmitting(true);
    setError("");

    bulkEnroll.mutate({
      studentIds: selectedStudents,
      classId: data.classId,
      startDate: data.startDate,
      createdById: userId,
    });
  }

  return (
    <Tabs defaultValue="single" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="single">Single Enrollment</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Enrollment</TabsTrigger>
      </TabsList>

      <TabsContent value="single">
        <Card>
          <CardHeader>
            <CardTitle>Student Enrollment</CardTitle>
            <CardDescription>Enroll a student in a class at {campusName}</CardDescription>
          </CardHeader>
          <Form {...singleForm}>
            <form onSubmit={singleForm.handleSubmit(onSubmitSingle)}>
              <CardContent>
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Enrollment Details</h3>

                    <FormField
                      control={singleForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Student *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.name} ({student.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={singleForm.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Class *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name} ({cls.programName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={singleForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={singleForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={singleForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Enrollment Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={singleForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Add any additional notes about this enrollment"
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Payment Information</h3>

                    <FormField
                      control={singleForm.control}
                      name="paymentStatus"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Payment Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payment status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PAID">Paid</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="PARTIAL">Partial</SelectItem>
                              <SelectItem value="WAIVED">Waived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={singleForm.control}
                        name="paymentAmount"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Payment Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={singleForm.control}
                        name="paymentDueDate"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Payment Due Date</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/admin/campus/enrollment">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Processing...</span>
                      <span className="animate-spin">⏳</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Create Enrollment
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>

      <TabsContent value="bulk">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Enrollment</CardTitle>
            <CardDescription>Enroll multiple students at once</CardDescription>
          </CardHeader>
          <Form {...bulkForm}>
            <form onSubmit={bulkForm.handleSubmit(onSubmitBulk)}>
              <CardContent>
                <div className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bulk Enrollment Options</h3>

                    <FormField
                      control={bulkForm.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Class *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name} ({cls.programName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bulkForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bulkForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>End Date (Optional)</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={bulkForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Enrollment Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Student Selection</h3>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Students</Label>
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{selectedStudents.length}</span> students selected
                        </div>
                      </div>

                      {/* Search input */}
                      <div className="flex items-center space-x-2 mb-2">
                        <Input
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full"
                        />
                        {searchTerm && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                            className="shrink-0"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      <div className="border rounded-md max-h-[300px] overflow-y-auto">
                        <div className="p-2 border-b bg-muted">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all"
                              checked={selectAll}
                              onCheckedChange={handleSelectAllStudents}
                            />
                            <label htmlFor="select-all" className="font-medium">Select All{searchTerm ? " Filtered" : ""}</label>
                          </div>
                        </div>
                        <div className="p-2 space-y-2">
                          {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                              <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                                <Checkbox
                                  id={`student-${student.id}`}
                                  checked={selectedStudents.includes(student.id)}
                                  onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                                />
                                <label htmlFor={`student-${student.id}`}>{student.name} ({student.email})</label>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              No students found matching your search criteria
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/admin/campus/enrollment">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Processing...</span>
                      <span className="animate-spin">⏳</span>
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Create Bulk Enrollment
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}