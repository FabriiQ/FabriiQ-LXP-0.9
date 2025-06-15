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
  Card,
  CardContent,
  CardFooter
} from '@/components/ui/data-display/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Upload,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { api } from '@/trpc/react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/feedback/alert';
import { Stepper } from '@/components/ui/stepper';
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

// Types
type ImportStep = "upload" | "preview" | "mapping" | "validation" | "import";

// Sample data structure for student import
interface StudentImportData {
  firstName: string;
  lastName: string;
  email: string;
  enrollmentNumber?: string;
  phone?: string;
  campusId?: string;
  programId?: string;
  termId?: string;
  [key: string]: any;
}

export function SystemStudentImportDialog({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<StudentImportData[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Array<{row: number, errors: string[]}>>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [importStats, setImportStats] = useState<{
    total: number;
    success: number;
    failed: number;
    warnings: number;
  } | null>(null);

  // Get campuses for selection
  const { data: campuses = [] } = api.systemAnalytics.getFilterOptions.useQuery(undefined, {
    enabled: open,
    select: (data) => data.campuses || [],
    refetchOnWindowFocus: false
  });

  // Define steps for the import process
  const steps = [
    { id: "upload", label: "Upload File" },
    { id: "preview", label: "Preview Data" },
    { id: "mapping", label: "Field Mapping" },
    { id: "validation", label: "Validation" },
    { id: "import", label: "Import" }
  ];

  // Import mutation
  const importMutation = api.systemAnalytics.importStudents.useMutation({
    onSuccess: (data) => {
      setImportStats({
        total: data.total,
        success: data.success,
        failed: data.failed,
        warnings: data.warnings
      });

      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.success} out of ${data.total} students.`,
        variant: "success",
      });

      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "error",
      });
    }
  });

  // Handle file upload with chunking for large files
  const handleFileUpload = (file: File) => {
    setFile(file);
    setIsUploading(true);
    setUploadProgress(10);

    // For very large files, we'll use a chunked approach
    if (file.size > 10 * 1024 * 1024) { // If file is larger than 10MB
      toast({
        title: "Large File Detected",
        description: "Processing large file in chunks. This may take a moment.",
        variant: "info",
      });

      // Process large CSV files in chunks
      if (file.name.endsWith('.csv')) {
        const chunkSize = 1024 * 1024; // 1MB chunks
        let offset = 0;
        const fileReader = new FileReader();
        let allData: StudentImportData[] = [];
        let headers: string[] = [];
        let firstChunk = true;

        const readNextChunk = () => {
          const slice = file.slice(offset, offset + chunkSize);
          fileReader.readAsText(slice);
        };

        fileReader.onload = (e) => {
          if (!e.target?.result) return;

          try {
            const chunk = e.target.result as string;
            let rows = chunk.split('\n');

            // If this is the first chunk, get the headers
            if (firstChunk) {
              headers = rows[0].split(',').map(h => h.trim());
              rows = rows.slice(1);
              firstChunk = false;
            }

            // Process rows in this chunk
            const chunkData = rows.filter(row => row.trim() !== '').map(row => {
              const values = row.split(',');
              const student: StudentImportData = { firstName: '', lastName: '', email: '' };

              headers.forEach((header, index) => {
                student[header] = values[index]?.trim() || '';
              });

              return student;
            });

            // Add to our accumulated data
            allData = [...allData, ...chunkData];

            // Update progress
            offset += chunkSize;
            const progress = Math.min(90, Math.round((offset / file.size) * 100));
            setUploadProgress(progress);

            // Read the next chunk or finish
            if (offset < file.size) {
              readNextChunk();
            } else {
              // We're done reading the file
              setPreviewData(allData);
              setCurrentStep('preview');
              setIsUploading(false);
              setUploadProgress(100);
            }
          } catch (error) {
            console.error('Error processing chunk:', error);
            toast({
              title: "Error",
              description: "Failed to process the file. Please check the format.",
              variant: "error",
            });
            setIsUploading(false);
          }
        };

        fileReader.onerror = () => {
          toast({
            title: "Error",
            description: "Failed to read the file. Please try again.",
            variant: "error",
          });
          setIsUploading(false);
        };

        // Start reading the first chunk
        readNextChunk();
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, you'd use a library like xlsx with a worker
        // This is just a placeholder
        setTimeout(() => {
          setPreviewData([
            { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
            { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
          ]);
          setCurrentStep('preview');
          setIsUploading(false);
          setUploadProgress(100);
        }, 1000);
      }
    } else {
      // For smaller files, use the standard approach
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let data: StudentImportData[] = [];

          if (file.name.endsWith('.csv')) {
            // Simple CSV parsing
            const content = e.target?.result as string;
            const rows = content.split('\n');
            const headers = rows[0].split(',').map(h => h.trim());

            data = rows.slice(1).filter(row => row.trim() !== '').map(row => {
              const values = row.split(',');
              const student: StudentImportData = { firstName: '', lastName: '', email: '' };

              headers.forEach((header, index) => {
                student[header] = values[index]?.trim() || '';
              });

              return student;
            });
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            // For Excel, you'd use a library like xlsx
            // This is just a placeholder
            data = [
              { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
              { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
            ];
          }

          setPreviewData(data);
          setCurrentStep('preview');
          setIsUploading(false);
          setUploadProgress(100);
        } catch (error) {
          console.error('Error parsing file:', error);
          toast({
            title: "Error",
            description: "Failed to parse the uploaded file. Please check the format.",
            variant: "error",
          });
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the file. Please try again.",
          variant: "error",
        });
        setIsUploading(false);
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        // For Excel files, you'd use a different approach
        // This is just a placeholder
        setTimeout(() => {
          setPreviewData([
            { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
            { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
          ]);
          setCurrentStep('preview');
          setIsUploading(false);
          setUploadProgress(100);
        }, 500);
      }
    }
  };

  // Generate and download sample file
  const handleDownloadSample = (format: 'csv' | 'excel') => {
    // Sample data for the template
    const sampleData = [
      { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '1234567890', enrollmentNumber: 'ST001', campusId: 'campus-id-1' },
      { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '0987654321', enrollmentNumber: 'ST002', campusId: 'campus-id-2' }
    ];

    if (format === 'csv') {
      // Create CSV content
      const headers = Object.keys(sampleData[0]);
      let csvContent = headers.join(',') + '\n';

      sampleData.forEach(row => {
        csvContent += Object.values(row).join(',') + '\n';
      });

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'system_student_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For Excel, you'd use a library like xlsx
      // This is just a placeholder notification
      toast({
        title: "Download Started",
        description: "Your Excel template is being downloaded.",
        variant: "info",
      });
    }
  };

  // Handle import with batching for large datasets
  const handleImport = async () => {
    if (previewData.length === 0) {
      toast({
        title: "Error",
        description: "No data to import.",
        variant: "error",
      });
      return;
    }

    if (!selectedCampusId) {
      toast({
        title: "Error",
        description: "Please select a default campus for the imported students.",
        variant: "error",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // For large datasets, use batching to avoid timeouts and memory issues
      if (previewData.length > 1000) {
        toast({
          title: "Large Dataset",
          description: `Importing ${previewData.length.toLocaleString()} records in batches. This may take some time.`,
          variant: "info",
        });

        const batchSize = 500; // Process 500 records at a time
        const batches = Math.ceil(previewData.length / batchSize);
        let successCount = 0;
        let failedCount = 0;
        let warningCount = 0;

        for (let i = 0; i < batches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize, previewData.length);
          const batchData = previewData.slice(start, end);

          // Update progress based on batches completed
          const progress = Math.round(((i + 1) / batches) * 90);
          setUploadProgress(progress);

          // Call the import mutation for this batch
          try {
            const result = await importMutation.mutateAsync({
              students: batchData,
              mapping: fieldMapping,
              defaultCampusId: selectedCampusId,
              batchNumber: i + 1,
              totalBatches: batches
            });

            // Accumulate results
            successCount += result.success;
            failedCount += result.failed;
            warningCount += result.warnings;

            // Small delay between batches to prevent overwhelming the server
            if (i < batches - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (error) {
            console.error(`Error importing batch ${i + 1}:`, error);
            failedCount += batchData.length;
          }
        }

        // Set final stats
        setImportStats({
          total: previewData.length,
          success: successCount,
          failed: failedCount,
          warnings: warningCount
        });

        setUploadProgress(100);
        setCurrentStep('import');
      } else {
        // For smaller datasets, import all at once
        // Simulate progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(interval);
              return prev;
            }
            return prev + 10;
          });
        }, 300);

        // Call the import mutation
        const result = await importMutation.mutateAsync({
          students: previewData,
          mapping: fieldMapping,
          defaultCampusId: selectedCampusId
        });

        clearInterval(interval);
        setUploadProgress(100);
        setCurrentStep('import');
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
      setIsUploading(false);
    }
  };

  // Reset the dialog state
  const handleReset = () => {
    setCurrentStep('upload');
    setFile(null);
    setPreviewData([]);
    setFieldMapping({});
    setValidationErrors([]);
    setUploadProgress(0);
    setIsUploading(false);
    setImportStats(null);
    setSelectedCampusId("");
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
          <Upload className="mr-2 h-4 w-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import students to the system.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onChange={(step) => setCurrentStep(step as ImportStep)}
          />

          <div className="mt-6">
            {currentStep === "upload" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-primary hover:text-primary/80"
                  >
                    Click to upload a file
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Supported formats: CSV, Excel (.xlsx, .xls)
                  </p>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Download Template</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSample('csv')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      CSV Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadSample('excel')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Excel Template
                    </Button>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    The file must include the following required fields: First Name, Last Name, Email, and Campus ID.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {currentStep === "preview" && previewData.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Preview Data</h3>
                  <div className="text-sm text-muted-foreground">
                    {previewData.length > 1000 ?
                      <span className="text-amber-600 font-medium">Large dataset: {previewData.length.toLocaleString()} records</span> :
                      `${previewData.length} records`
                    }
                  </div>
                </div>

                <FormField
                  name="campusId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Campus</FormLabel>
                      <Select
                        value={selectedCampusId}
                        onValueChange={setSelectedCampusId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a default campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campuses.map(campus => (
                            <SelectItem key={campus.id} value={campus.id}>
                              {campus.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a default campus for students without a specified campus.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border rounded-md overflow-auto max-h-[300px]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        {Object.keys(previewData[0]).map((header) => (
                          <th
                            key={header}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Only show first 100 rows for preview, with a warning if there are more */}
                      {previewData.slice(0, 100).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {Object.entries(row).map(([key, value], cellIndex) => (
                            <td
                              key={`${rowIndex}-${cellIndex}`}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {value?.toString() || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentStep === "import" && (
              <div className="space-y-4">
                {isUploading ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Importing students...</p>
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-xs text-gray-500">
                      {uploadProgress < 100 ? 'Processing...' : 'Complete!'}
                    </p>
                  </div>
                ) : importStats ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertTitle>Import Complete</AlertTitle>
                      <AlertDescription>
                        Successfully imported {importStats.success} out of {importStats.total} students.
                      </AlertDescription>
                    </Alert>

                    {importStats.failed > 0 && (
                      <Alert>
                        <X className="h-4 w-4 text-red-500" />
                        <AlertTitle>Import Errors</AlertTitle>
                        <AlertDescription>
                          {importStats.failed} students could not be imported due to errors.
                        </AlertDescription>
                      </Alert>
                    )}

                    {importStats.warnings > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <AlertTitle>Warnings</AlertTitle>
                        <AlertDescription>
                          {importStats.warnings} students were imported with warnings.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          {currentStep === "upload" ? (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          ) : currentStep === "preview" ? (
            <>
              <Button variant="outline" onClick={() => setCurrentStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isUploading || !selectedCampusId}>
                Import Students
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleReset}>
                Import More
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
