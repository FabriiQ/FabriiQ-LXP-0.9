"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import { CalendarIcon, Loader2, ChevronLeft, FileText, Printer, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

// Form schema for bulk challan generation
const bulkChallanFormSchema = z.object({
  filters: z.object({
    campusId: z.string().optional(),
    programId: z.string().optional(),
    classId: z.string().optional(),
    month: z.number().min(1).max(12).optional(),
    year: z.number().min(2000).max(2100).optional(),
    hasPendingFees: z.boolean().default(true),
  }),
  templateId: z.string().min(1, "Template is required"),
  issueDate: z.date().default(() => new Date()),
  dueDate: z.date(),
  bankDetails: z.object({
    name: z.string().min(1, "Bank name is required"),
    accountNo: z.string().min(1, "Account number is required"),
    branch: z.string().min(1, "Branch is required"),
  }),
});

type BulkChallanFormValues = z.infer<typeof bulkChallanFormSchema>;

export default function BulkChallanGenerationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("generate");
  const [generatedChallans, setGeneratedChallans] = useState<any[]>([]);
  const [selectedChallans, setSelectedChallans] = useState<string[]>([]);

  // Get current month and year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = currentDate.getFullYear();

  // Fetch campuses
  const { data: campuses, isLoading: campusesLoading } = api.campus.getAllCampuses.useQuery();

  // Fetch programs (will be filtered by campus)
  const { data: programs, isLoading: programsLoading } = api.program.getAllPrograms.useQuery();

  // Fetch classes (will be filtered by program)
  const { data: classes, isLoading: classesLoading } = api.class.getAllClasses.useQuery();

  // Fetch challan templates
  const { data: templates, isLoading: templatesLoading } = api.challan.getTemplatesByInstitution.useQuery(
    { institutionId: "system" }, // Use a default value or get from context
  );

  // Initialize form
  const form = useForm<BulkChallanFormValues>({
    resolver: zodResolver(bulkChallanFormSchema),
    defaultValues: {
      filters: {
        hasPendingFees: true,
        month: currentMonth,
        year: currentYear,
      },
      issueDate: new Date(),
      dueDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 15), // Default to 15 days from now
      bankDetails: {
        name: "",
        accountNo: "",
        branch: "",
      },
    },
  });

  // Watch form values for filtering
  const selectedCampusId = form.watch("filters.campusId");
  const selectedProgramId = form.watch("filters.programId");

  // Helper function to handle potentially paginated data
  const getArrayFromData = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    return [];
  };

  // Filter programs by selected campus - using a safer approach
  const filteredPrograms = React.useMemo(() => {
    if (!selectedCampusId) return getArrayFromData(programs);
    return getArrayFromData(programs).filter(program => program.id === selectedCampusId);
  }, [selectedCampusId, programs]);

  // Filter classes by selected program - using a safer approach
  const filteredClasses = React.useMemo(() => {
    if (!selectedProgramId) return getArrayFromData(classes);
    return getArrayFromData(classes).filter(cls => cls.id === selectedProgramId);
  }, [selectedProgramId, classes]);

  // Bulk generate challans mutation
  const bulkGenerateMutation = api.challan.bulkGenerate.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setGeneratedChallans(data.challans);
        setActiveTab("results");
      } else {
        toast({
          title: "No challans generated",
          description: data.message,
          variant: "error",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error generating challans",
        description: error.message,
        variant: "error",
      });
    },
  });

  // Batch print challans mutation
  const batchPrintMutation = api.challan.batchPrint.useMutation({
    onSuccess: (data) => {
      // In a real implementation, this would open the print URL
      window.open(data.printUrl, "_blank");
    },
    onError: (error) => {
      toast({
        title: "Error printing challans",
        description: error.message,
        variant: "error",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: BulkChallanFormValues) => {
    // Add createdById from session (in a real app, this would come from the session)
    bulkGenerateMutation.mutate({
      ...values,
      createdById: "system-admin" // This would normally come from the session
    });
  };

  // Handle batch print
  const handleBatchPrint = () => {
    if (selectedChallans.length === 0) {
      toast({
        title: "No challans selected",
        description: "Please select at least one challan to print",
        variant: "error",
      });
      return;
    }

    batchPrintMutation.mutate({ ids: selectedChallans });
  };

  // Handle select all challans
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedChallans(generatedChallans.map((challan) => challan.id));
    } else {
      setSelectedChallans([]);
    }
  };

  // Handle select individual challan
  const handleSelectChallan = (challanId: string, checked: boolean) => {
    if (checked) {
      setSelectedChallans([...selectedChallans, challanId]);
    } else {
      setSelectedChallans(selectedChallans.filter((id) => id !== challanId));
    }
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Bulk Challan Generation"
        description="Generate fee challans for multiple students at once"
        action={
          <Button variant="outline" onClick={() => router.push("/admin/system/fee-management")}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Fee Management
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="generate">Generate Challans</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Challans</CardTitle>
              <CardDescription>
                Generate fee challans for multiple students based on filters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Campus Filter */}
                      <FormField
                        control={form.control}
                        name="filters.campusId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campus</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="All Campuses" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">All Campuses</SelectItem>
                                {campusesLoading ? (
                                  <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  getArrayFromData(campuses).map((campus) => (
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

                      {/* Program Filter */}
                      <FormField
                        control={form.control}
                        name="filters.programId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!selectedCampusId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="All Programs" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">All Programs</SelectItem>
                                {programsLoading ? (
                                  <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  filteredPrograms?.map((program) => (
                                    <SelectItem key={program.id} value={program.id}>
                                      {program.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Class Filter */}
                      <FormField
                        control={form.control}
                        name="filters.classId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!selectedProgramId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">All Classes</SelectItem>
                                {classesLoading ? (
                                  <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  filteredClasses?.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                      {cls.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Month Filter */}
                      <FormField
                        control={form.control}
                        name="filters.month"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Month</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">January</SelectItem>
                                <SelectItem value="2">February</SelectItem>
                                <SelectItem value="3">March</SelectItem>
                                <SelectItem value="4">April</SelectItem>
                                <SelectItem value="5">May</SelectItem>
                                <SelectItem value="6">June</SelectItem>
                                <SelectItem value="7">July</SelectItem>
                                <SelectItem value="8">August</SelectItem>
                                <SelectItem value="9">September</SelectItem>
                                <SelectItem value="10">October</SelectItem>
                                <SelectItem value="11">November</SelectItem>
                                <SelectItem value="12">December</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Year Filter */}
                      <FormField
                        control={form.control}
                        name="filters.year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Year"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Pending Fees Filter */}
                      <FormField
                        control={form.control}
                        name="filters.hasPendingFees"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-end space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel>Only students with pending fees</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Challan Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Template Selection */}
                      <FormField
                        control={form.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Challan Template</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templatesLoading ? (
                                  <div className="flex items-center justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  getArrayFromData(templates).map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                      {template.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Issue Date */}
                      <FormField
                        control={form.control}
                        name="issueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Issue Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Due Date */}
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Bank Name */}
                      <FormField
                        control={form.control}
                        name="bankDetails.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Bank Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Account Number */}
                      <FormField
                        control={form.control}
                        name="bankDetails.accountNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Account Number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Branch */}
                      <FormField
                        control={form.control}
                        name="bankDetails.branch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch</FormLabel>
                            <FormControl>
                              <Input placeholder="Branch" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={bulkGenerateMutation.isLoading}
                      className="w-full md:w-auto"
                    >
                      {bulkGenerateMutation.isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Generate Challans
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Challans</CardTitle>
              <CardDescription>
                {generatedChallans.length > 0
                  ? `${generatedChallans.length} challans generated successfully`
                  : "No challans generated yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedChallans.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedChallans.length === generatedChallans.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select All
                    </label>
                  </div>

                  <div className="rounded-md border">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="w-12 px-4 py-3"></th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Challan No</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Class</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {generatedChallans.map((challan) => (
                          <tr key={challan.id}>
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedChallans.includes(challan.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectChallan(challan.id, !!checked)
                                }
                              />
                            </td>
                            <td className="px-4 py-3 text-sm">{challan.challanNo}</td>
                            <td className="px-4 py-3 text-sm">{challan.studentName}</td>
                            <td className="px-4 py-3 text-sm">{challan.className}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              Rs. {challan.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => batchPrintMutation.mutate({ ids: [challan.id] })}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No challans generated yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("generate")}
                  >
                    Go to Generate Challans
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("generate")}>
                Generate More Challans
              </Button>
              <Button
                onClick={handleBatchPrint}
                disabled={selectedChallans.length === 0 || batchPrintMutation.isLoading}
              >
                {batchPrintMutation.isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Print Selected ({selectedChallans.length})
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
