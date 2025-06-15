'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';
import { QuestionType, DifficultyLevel, SystemStatus } from '../../models/types';
import { downloadQuestions, ExportFormat } from '../../utils/export-utils';
import { asQuestions } from '../../utils/type-adapters';
import { Download, FileText } from 'lucide-react';
import { QuestionFilter } from '../filters/QuestionFilter';

interface ExportFormProps {
  questionBankId: string;
  onCancel?: () => void;
  className?: string;
}

/**
 * Export Form Component
 *
 * This component provides a form for exporting questions from a question bank.
 * It supports CSV, Excel, and JSON file formats.
 */
export const ExportForm: React.FC<ExportFormProps> = ({
  questionBankId,
  onCancel,
  className = '',
}) => {
  const { toast } = useToast();

  // State for form
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [fileName, setFileName] = useState('questions');
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<{
    questionType?: QuestionType;
    difficulty?: DifficultyLevel;
    subjectId?: string;
    courseId?: string;
    topicId?: string;
    gradeLevel?: number;
    year?: number;
    status?: SystemStatus;
  }>({
    status: SystemStatus.ACTIVE,
  });

  // Get question bank details
  const { data: questionBankData } = api.questionBank.getQuestion.useQuery(
    { id: questionBankId },
    { enabled: !!questionBankId }
  );

  // Create a default question bank object
  const defaultQuestionBank = {
    id: questionBankId,
    name: 'Question Bank',
    description: 'Manage questions in this question bank',
    institutionId: '',
    status: SystemStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    partitionKey: '',
  };

  // Use the default if data is not available
  const questionBank = questionBankData ? {
    ...defaultQuestionBank,
    ...(questionBankData as any),
  } : defaultQuestionBank;

  // Get questions query
  const questionsQuery = api.questionBank.getQuestions.useQuery(
    {
      questionBankId,
      filters,
      pagination: {
        page: 1,
        pageSize: 1000, // Limit to 1000 questions for export
      },
      sorting: {
        field: 'createdAt',
        direction: 'desc',
      },
    },
    {
      enabled: false, // Don't fetch automatically
    }
  );

  // Handle export format change
  const handleExportFormatChange = (value: string) => {
    setExportFormat(value as ExportFormat);
  };

  // Handle file name change
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(e.target.value);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Handle export
  const handleExport = async () => {
    if (!fileName) {
      toast({
        title: 'Error',
        description: 'Please enter a file name.',
        variant: 'error',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Fetch questions
      const result = await questionsQuery.refetch();

      if (!result.data || !result.data.items || result.data.items.length === 0) {
        toast({
          title: 'Error',
          description: 'No questions found with the selected filters.',
          variant: 'error',
        });
        setIsExporting(false);
        return;
      }

      // Download questions
      // Convert the items to the Question type using our adapter
      const questions = asQuestions(result.data.items);
      downloadQuestions(questions, exportFormat, fileName);

      toast({
        title: 'Success',
        description: `Successfully exported ${result.data.items.length} questions.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to export questions: ${(error as Error).message}`,
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Get file format icon
  const getFileFormatIcon = () => {
    // Use FileText for all formats since the other icons are not available
    return <FileText className="h-5 w-5" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Export Questions</CardTitle>
        <CardDescription>
          Export questions from {questionBank?.name || 'the question bank'} to a file.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="exportFormat">Export Format</Label>
            <Select
              value={exportFormat}
              onValueChange={handleExportFormatChange}
              disabled={isExporting}
            >
              <SelectTrigger id="exportFormat">
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fileName"
                value={fileName}
                onChange={handleFileNameChange}
                disabled={isExporting}
                placeholder="Enter file name"
              />
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                .{exportFormat === 'excel' ? 'xlsx' : exportFormat}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <Label>Filters</Label>
            <QuestionFilter
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>

          {/* Export Preview */}
          <div className="p-4 border rounded-md bg-muted">
            <div className="flex items-center gap-2">
              {getFileFormatIcon()}
              <span className="font-medium">{fileName}.{exportFormat === 'excel' ? 'xlsx' : exportFormat}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {questionsQuery.data ? (
                <span>This will export {questionsQuery.data.total} questions.</span>
              ) : (
                <span>Click "Preview" to see how many questions will be exported.</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isExporting}
          >
            Cancel
          </Button>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => questionsQuery.refetch()}
            disabled={isExporting}
          >
            Preview
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExportForm;
