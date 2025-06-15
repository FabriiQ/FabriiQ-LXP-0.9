'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';
import { QuestionType, DifficultyLevel, SystemStatus } from '../../models/types';
import { parseCSV, generateSampleCSV } from '../../utils/csv-parser';
import { parseExcel, generateSampleExcel } from '../../utils/excel-parser';
import { parseJSON, generateSampleJSON } from '../../utils/json-parser';
import { Download, FileText, AlertCircle, CheckCircle, X, CloudUpload } from 'lucide-react';

interface BulkUploadFormProps {
  questionBankId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

type FileFormat = 'csv' | 'excel' | 'json';

interface ValidationError {
  row: number;
  errors: string[];
}

/**
 * Bulk Upload Form Component
 *
 * This component provides a form for uploading questions in bulk to a question bank.
 * It supports CSV, Excel, and JSON file formats.
 */
export const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  questionBankId,
  onSuccess,
  onCancel,
  className = '',
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for form
  const [fileFormat, setFileFormat] = useState<FileFormat>('csv');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validateOnly, setValidateOnly] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [uploadStats, setUploadStats] = useState<{
    totalRows: number;
    successfulRows: number;
    errorRows: number;
  } | null>(null);

  // Get question bank details
  const { data: questionBank } = api.questionBank.getQuestion.useQuery(
    { id: questionBankId },
    { enabled: !!questionBankId }
  );

  // Bulk upload mutation
  const bulkUploadMutation = api.questionBank.bulkUploadQuestions.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Successfully uploaded ${data.successful} questions.`,
      });
      setUploadProgress(100);
      setUploadStats({
        totalRows: data.total,
        successfulRows: data.successful,
        errorRows: data.failed
      });
      setIsUploading(false);

      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to upload questions: ${error.message}`,
        variant: 'error',
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationErrors([]);
      setValidationSuccess(false);
      setUploadStats(null);
    }
  };

  // Handle file format change
  const handleFileFormatChange = (value: string) => {
    setFileFormat(value as FileFormat);
    setSelectedFile(null);
    setValidationErrors([]);
    setValidationSuccess(false);
    setUploadStats(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle question type change
  const handleQuestionTypeChange = (value: string) => {
    setQuestionType(value as QuestionType);
  };

  // Handle validate only change
  const handleValidateOnlyChange = (checked: boolean) => {
    setValidateOnly(checked);
  };

  // Handle download sample
  const handleDownloadSample = () => {
    let sampleData: string | Blob;
    let fileName: string;
    let mimeType: string;

    switch (fileFormat) {
      case 'csv':
        sampleData = generateSampleCSV(questionType);
        fileName = `sample_${questionType.toLowerCase()}_questions.csv`;
        mimeType = 'text/csv';
        break;
      case 'excel':
        sampleData = generateSampleExcel(questionType);
        fileName = `sample_${questionType.toLowerCase()}_questions.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'json':
        sampleData = generateSampleJSON(questionType);
        fileName = `sample_${questionType.toLowerCase()}_questions.json`;
        mimeType = 'application/json';
        break;
      default:
        return;
    }

    // Create download link
    const blob = sampleData instanceof Blob ? sampleData : new Blob([sampleData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle validate
  const handleValidate = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to validate.',
        variant: 'error',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setValidationErrors([]);
    setValidationSuccess(false);
    setUploadStats(null);

    try {
      let parseResult;

      switch (fileFormat) {
        case 'csv':
          parseResult = await parseCSV(selectedFile, questionBankId);
          break;
        case 'excel':
          parseResult = await parseExcel(selectedFile, questionBankId);
          break;
        case 'json':
          parseResult = await parseJSON(selectedFile, questionBankId);
          break;
        default:
          throw new Error('Unsupported file format');
      }

      setUploadProgress(50);

      if (parseResult.errors.length > 0) {
        setValidationErrors(parseResult.errors);
        setValidationSuccess(false);
        toast({
          title: 'Validation Failed',
          description: `Found ${parseResult.errors.length} errors in the file.`,
          variant: 'error',
        });
      } else {
        setValidationSuccess(true);
        toast({
          title: 'Validation Successful',
          description: `Successfully validated ${parseResult.successfulRows} questions.`,
        });
      }

      setUploadStats({
        totalRows: parseResult.totalRows,
        successfulRows: parseResult.successfulRows,
        errorRows: parseResult.errors.length
      });

      setUploadProgress(100);
      setIsUploading(false);

      // If not validate only and no errors, proceed with upload
      if (!validateOnly && parseResult.errors.length === 0) {
        handleUpload(parseResult.questions);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to validate file: ${(error as Error).message}`,
        variant: 'error',
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle upload
  const handleUpload = (questions: any[]) => {
    if (questions.length === 0) {
      toast({
        title: 'Error',
        description: 'No valid questions to upload.',
        variant: 'error',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    bulkUploadMutation.mutate({
      questionBankId,
      questions,
      validateOnly: false
    });
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload.',
        variant: 'error',
      });
      return;
    }

    await handleValidate();
  };

  // Get file input accept attribute based on file format
  const getAcceptAttribute = () => {
    switch (fileFormat) {
      case 'csv':
        return '.csv';
      case 'excel':
        return '.xlsx,.xls';
      case 'json':
        return '.json';
      default:
        return '';
    }
  };

  // Get file format icon
  const getFileFormatIcon = () => {
    switch (fileFormat) {
      case 'csv':
        return <FileText className="h-5 w-5" />;
      case 'excel':
        return <FileText className="h-5 w-5" />;
      case 'json':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bulk Upload Questions</CardTitle>
        <CardDescription>
          Upload multiple questions to {questionBank?.title || 'the question bank'} at once.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="results" disabled={!uploadStats}>Results</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* File Format Selection */}
              <div className="space-y-2">
                <Label htmlFor="fileFormat">File Format</Label>
                <Select
                  value={fileFormat}
                  onValueChange={handleFileFormatChange}
                  disabled={isUploading}
                >
                  <SelectTrigger id="fileFormat">
                    <SelectValue placeholder="Select file format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question Type Selection (for sample download) */}
              <div className="space-y-2">
                <Label htmlFor="questionType">Question Type (for sample download)</Label>
                <Select
                  value={questionType}
                  onValueChange={handleQuestionTypeChange}
                  disabled={isUploading}
                >
                  <SelectTrigger id="questionType">
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(QuestionType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Download Sample Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadSample}
                disabled={isUploading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample {fileFormat.toUpperCase()} File
              </Button>

              <Separator />

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept={getAcceptAttribute()}
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    className="flex-1"
                  />
                </div>
                {selectedFile && (
                  <div className="text-sm text-muted-foreground flex items-center mt-1">
                    {getFileFormatIcon()}
                    <span className="ml-1">{selectedFile.name}</span>
                    <span className="ml-2 text-xs">({Math.round(selectedFile.size / 1024)} KB)</span>
                  </div>
                )}
              </div>

              {/* Validate Only Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validateOnly"
                  checked={validateOnly}
                  onCheckedChange={handleValidateOnlyChange}
                  disabled={isUploading}
                />
                <Label htmlFor="validateOnly" className="text-sm font-normal">
                  Validate only (don't upload to question bank)
                </Label>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Validation Success */}
              {validationSuccess && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Validation Successful</AlertTitle>
                  <AlertDescription>
                    All {uploadStats?.successfulRows} questions are valid and ready to be uploaded.
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Errors Summary */}
              {validationErrors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Failed</AlertTitle>
                  <AlertDescription>
                    Found {validationErrors.length} errors in the file.
                    {uploadStats && (
                      <div className="mt-2">
                        <span className="font-medium">Total rows:</span> {uploadStats.totalRows}<br />
                        <span className="font-medium">Valid rows:</span> {uploadStats.successfulRows}<br />
                        <span className="font-medium">Error rows:</span> {uploadStats.errorRows}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {/* Upload Stats */}
              {uploadStats && (
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{uploadStats.totalRows}</div>
                        <div className="text-sm text-muted-foreground">Total Rows</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{uploadStats.successfulRows}</div>
                        <div className="text-sm text-muted-foreground">Successful</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{uploadStats.errorRows}</div>
                        <div className="text-sm text-muted-foreground">Errors</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Validation Errors Detail */}
              {validationErrors.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Validation Errors</h3>
                  <div className="max-h-[300px] overflow-y-auto border rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left">Row</th>
                          <th className="px-4 py-2 text-left">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationErrors.map((error, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-4 py-2 text-center">{error.row}</td>
                            <td className="px-4 py-2">
                              <ul className="list-disc list-inside">
                                {error.errors.map((err, i) => (
                                  <li key={i} className="text-sm text-red-600 dark:text-red-400">{err}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {uploadStats && uploadStats.errorRows === 0 && (
                <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle>Upload Successful</AlertTitle>
                  <AlertDescription>
                    Successfully uploaded {uploadStats.successfulRows} questions to the question bank.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>

      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
        )}
        <div className="flex gap-2">
          {!validateOnly && validationSuccess && (
            <Button
              type="button"
              onClick={() => handleUpload([])}
              disabled={isUploading || !selectedFile || validationErrors.length > 0}
            >
              <CloudUpload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          )}
          <Button
            type="button"
            onClick={handleValidate}
            disabled={isUploading || !selectedFile}
          >
            {validateOnly ? 'Validate' : 'Validate & Upload'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BulkUploadForm;
