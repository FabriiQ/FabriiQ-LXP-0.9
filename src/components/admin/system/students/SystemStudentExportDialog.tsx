'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/feedback/dialog';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Download,
  ArrowDown
} from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/feedback/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/forms/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/forms/form';
import { Checkbox } from '@/components/ui/forms/checkbox';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Form schema
const exportFormSchema = z.object({
  format: z.enum(['CSV', 'EXCEL']),
  campusId: z.string().optional(),
  programId: z.string().optional(),
  includeInactive: z.boolean().default(false),
  includeDetails: z.boolean().default(true),
  fileName: z.string().min(1, 'File name is required'),
});

type ExportFormValues = z.infer<typeof exportFormSchema>;

export function SystemStudentExportDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  // Get filter options
  const { data: filterOptions } = api.systemAnalytics.getFilterOptions.useQuery(undefined, {
    enabled: open,
    refetchOnWindowFocus: false
  });

  // Form setup
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      format: 'CSV',
      includeInactive: false,
      includeDetails: true,
      fileName: `system_students_export_${new Date().toISOString().split('T')[0]}`,
    },
  });

  // Export mutation with streaming support for large datasets
  const exportMutation = api.systemAnalytics.exportStudents.useMutation({
    onSuccess: (data) => {
      setExportProgress(95); // Almost done, just handling the file now
      setExportComplete(true);

      // For very large datasets, we need to handle the download differently
      if (data.isLargeDataset) {
        // For large datasets, the server returns a download URL instead of content
        toast({
          title: "Large Dataset Export",
          description: "Your export is ready. The download will begin automatically.",
          variant: "info",
        });

        // Open the download URL in a new tab
        window.open(data.downloadUrl, '_blank');
        setExportProgress(100);
      } else {
        // For smaller datasets, handle the download in the browser
        try {
          // Create download link
          const content = data.content || '';
          const blob = new Blob([content], {
            type: form.getValues('format') === 'CSV'
              ? 'text/csv;charset=utf-8;'
              : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.setAttribute('href', url);
          link.setAttribute('download', `${form.getValues('fileName')}.${form.getValues('format').toLowerCase()}`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url); // Clean up
          setExportProgress(100);
        } catch (error) {
          console.error('Error creating download:', error);
          toast({
            title: "Download Error",
            description: "There was an error preparing your download. Please try again.",
            variant: "error",
          });
          setIsExporting(false);
          return;
        }
      }

      toast({
        title: "Export Successful",
        description: `${data.totalRecords?.toLocaleString() || 'All'} student records have been exported successfully.`,
        variant: "success",
      });
    },
    onError: (error) => {
      setIsExporting(false);

      toast({
        title: "Export Failed",
        description: error.message,
        variant: "error",
      });
    }
  });

  // Handle export
  const onSubmit = (values: ExportFormValues) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    // Simulate progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    // Call the export mutation
    exportMutation.mutate({
      format: values.format,
      campusId: values.campusId,
      programId: values.programId,
      includeInactive: values.includeInactive,
      includeDetails: values.includeDetails,
      fileName: values.fileName,
    });
  };

  // Reset the dialog state
  const handleReset = () => {
    form.reset();
    setIsExporting(false);
    setExportProgress(0);
    setExportComplete(false);
  };

  // Close dialog and reset state
  const handleClose = () => {
    setOpen(false);
    handleReset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Export Students</DialogTitle>
          <DialogDescription>
            Export student data from all campuses in CSV or Excel format.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex-1 overflow-y-auto">
          {!isExporting ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pr-1">
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Export Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CSV">CSV</SelectItem>
                          <SelectItem value="EXCEL">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the format for your exported data.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="campusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Campuses" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Campuses</SelectItem>
                          {filterOptions?.campuses?.map(campus => (
                            <SelectItem key={campus.id} value={campus.id}>
                              {campus.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Filter students by campus.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Programs" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Programs</SelectItem>
                          {filterOptions?.programs?.map(program => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Filter students by program.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeInactive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm sm:text-base">Include Inactive Students</FormLabel>
                        <FormDescription className="text-xs sm:text-sm">
                          Include students who are no longer active in the system.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeDetails"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm sm:text-base">Include Detailed Information</FormLabel>
                        <FormDescription className="text-xs sm:text-sm">
                          Include additional details like contact information and enrollment dates.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fileName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Name for the exported file (without extension).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sticky bottom-0 bg-background pt-4 mt-4 border-t">
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <ArrowDown className="mr-2 h-4 w-4" /> Export Data
                    </Button>
                  </DialogFooter>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {exportComplete ? 'Export Complete!' : 'Preparing your export...'}
                </p>
                <Progress value={exportProgress} className="w-full" />
                <p className="text-xs text-gray-500">
                  {exportProgress < 100 ? 'Processing...' : 'Complete!'}
                </p>
              </div>

              {exportComplete && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Export Successful</AlertTitle>
                  <AlertDescription>
                    Your file has been exported and downloaded successfully.
                  </AlertDescription>
                </Alert>
              )}

              <div className="sticky bottom-0 bg-background pt-4 mt-4 border-t">
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                  <Button onClick={handleReset} disabled={!exportComplete}>
                    Export Again
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
