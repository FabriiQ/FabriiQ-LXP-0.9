'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { api } from '@/utils/api';
import { QuestionType, DifficultyLevel, SystemStatus, Question } from '../../models/types';
import { asQuestions, asQuestion } from '../../utils/type-adapters';
import { QuestionFilter } from '../filters/QuestionFilter';
import { QuestionSearch } from '../filters/QuestionSearch';
import { QuestionSort } from '../filters/QuestionSort';
import { QuestionPagination } from '../filters/QuestionPagination';
import VirtualizedQuestionList from '../viewer/VirtualizedQuestionList';
import QuestionDetail from '../viewer/QuestionDetail';
import { Search, Filter, SortAsc } from 'lucide-react';

interface QuestionBankSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectQuestions: (questions: Question[]) => void;
  subjectId?: string;
  topicId?: string;
  questionType?: QuestionType;
  multiSelect?: boolean;
  maxSelections?: number;
  title?: string;
  description?: string;
}

/**
 * Question Bank Selector Component
 *
 * This component provides a dialog for selecting questions from the question bank
 * to use in activities or assessments.
 */
export const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({
  open,
  onOpenChange,
  onSelectQuestions,
  subjectId,
  topicId,
  questionType,
  multiSelect = true,
  maxSelections = 0,
  title = 'Select Questions',
  description = 'Select questions from the question bank to use in your activity.',
}) => {
  // State for filters, sorting, and pagination
  const [filters, setFilters] = useState<{
    questionType?: QuestionType;
    difficulty?: DifficultyLevel;
    subjectId?: string;
    courseId?: string;
    topicId?: string;
    gradeLevel?: number;
    year?: number;
    search?: string;
    status?: SystemStatus | string;
  }>({
    questionType,
    subjectId,
    topicId,
    status: 'ACTIVE', // Use string value instead of enum
  });

  const [sorting, setSorting] = useState<{
    field: 'title' | 'createdAt' | 'updatedAt' | 'difficulty' | 'year';
    direction: 'asc' | 'desc';
  }>({
    field: 'createdAt',
    direction: 'desc',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });

  // State for selected questions and UI state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [showFilters, setShowFilters] = useState(false);

  // Get all question banks
  // Since there's no specific endpoint for getting all question banks,
  // we'll use a dummy ID and handle the response appropriately
  const { data: questionBanks } = api.questionBank.getQuestions.useQuery({
    questionBankId: 'all', // This is a dummy ID that will be handled on the server
    filters: {
      status: 'ACTIVE', // Use string value instead of enum
    },
    pagination: {
      page: 1,
      pageSize: 100,
    },
    sorting: {
      field: 'createdAt',
      direction: 'desc',
    },
  }, {
    onError: (error) => {
      console.error('Error fetching question banks:', error);
    }
  });

  // State for selected question bank
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState<string>('');

  // Set default question bank when data is loaded
  useEffect(() => {
    if (questionBanks?.items.length && !selectedQuestionBankId) {
      setSelectedQuestionBankId(questionBanks.items[0].id);
    }
  }, [questionBanks, selectedQuestionBankId]);

  // Fetch questions with filters, sorting, and pagination
  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
  } = api.questionBank.getQuestions.useQuery(
    {
      questionBankId: selectedQuestionBankId,
      filters,
      pagination,
      sorting,
    },
    {
      enabled: !!selectedQuestionBankId,
      keepPreviousData: true,
    }
  );

  // Fetch selected question details
  const {
    data: selectedQuestion,
    isLoading: isLoadingSelectedQuestion
  } = api.questionBank.getQuestion.useQuery(
    { id: selectedQuestionId || '' },
    {
      enabled: !!selectedQuestionId,
      keepPreviousData: false,
    }
  );

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  // Handle sort changes
  const handleSortChange = (newSorting: typeof sorting) => {
    setSorting(newSorting);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Handle page size changes
  const handlePageSizeChange = (pageSize: number) => {
    setPagination({ page: 1, pageSize }); // Reset to first page on page size change
  };

  // Handle question bank change
  const handleQuestionBankChange = (value: string) => {
    setSelectedQuestionBankId(value);
    setPagination({ page: 1, pageSize: pagination.pageSize }); // Reset to first page on question bank change
  };

  // Handle view question
  const handleViewQuestion = (question: Question) => {
    setSelectedQuestionId(question.id);
    setActiveTab('detail');
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedQuestionId(null);
    setActiveTab('list');
  };

  // Handle select question
  const handleSelectQuestion = (question: Question) => {
    if (multiSelect) {
      setSelectedQuestionIds(prev => {
        const isSelected = prev.includes(question.id);

        if (isSelected) {
          // Remove from selection
          return prev.filter(id => id !== question.id);
        } else {
          // Add to selection if under max selections or no limit
          if (maxSelections === 0 || prev.length < maxSelections) {
            return [...prev, question.id];
          }
          return prev;
        }
      });
    } else {
      // Single select mode
      setSelectedQuestionIds([question.id]);
    }
  };

  // Handle select all questions
  const handleSelectAll = () => {
    if (questionsData?.items) {
      if (selectedQuestionIds.length === questionsData.items.length) {
        // Deselect all
        setSelectedQuestionIds([]);
      } else {
        // Select all (up to max selections if applicable)
        const allIds = questionsData.items.map(q => q.id);
        if (maxSelections > 0) {
          setSelectedQuestionIds(allIds.slice(0, maxSelections));
        } else {
          setSelectedQuestionIds(allIds);
        }
      }
    }
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    if (selectedQuestionIds.length === 0) {
      return;
    }

    // Get the selected questions from the data
    const selectedQuestions = questionsData?.items.filter(q => selectedQuestionIds.includes(q.id)) || [];

    // Convert the questions to the expected Question type using our adapter
    const typedQuestions = asQuestions(selectedQuestions);

    // Call the onSelectQuestions callback
    onSelectQuestions(typedQuestions);

    // Close the dialog
    onOpenChange(false);
  };

  // Reset selections when dialog is closed
  useEffect(() => {
    if (!open) {
      setSelectedQuestionIds([]);
      setSelectedQuestionId(null);
      setActiveTab('list');
    }
  }, [open]);

  // Update filters when props change
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      questionType,
      subjectId,
      topicId,
    }));
  }, [questionType, subjectId, topicId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Question Bank Selector */}
          <div className="mb-4">
            <Label htmlFor="questionBank">Question Bank</Label>
            <Select
              value={selectedQuestionBankId}
              onValueChange={handleQuestionBankChange}
              disabled={!questionBanks?.items.length}
            >
              <SelectTrigger id="questionBank">
                <SelectValue placeholder="Select a question bank" />
              </SelectTrigger>
              <SelectContent>
                {questionBanks?.items?.map(bank => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {(bank as any).name || 'Unnamed Bank'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="list">Question List</TabsTrigger>
              <TabsTrigger value="detail" disabled={!selectedQuestionId}>Question Detail</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="flex-1 overflow-hidden flex flex-col">
              {/* Search and Filters */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1">
                      <QuestionSearch
                        value={filters.search || ''}
                        onSearch={handleSearch}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                      <QuestionSort
                        value={sorting}
                        onChange={handleSortChange}
                      />
                    </div>
                  </div>

                  {showFilters && (
                    <div className="mt-4">
                      <QuestionFilter
                        filters={filters}
                        onChange={handleFilterChange}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Questions List */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <Card className="flex-1 overflow-hidden flex flex-col">
                  <CardContent className="p-4 flex-1 overflow-hidden flex flex-col">
                    {/* Select All Checkbox */}
                    {multiSelect && questionsData?.items && questionsData.items.length > 0 && (
                      <div className="flex items-center mb-2">
                        <Checkbox
                          id="selectAll"
                          checked={questionsData.items.length > 0 && selectedQuestionIds.length === questionsData.items.length}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="selectAll" className="ml-2">
                          {selectedQuestionIds.length === questionsData.items.length
                            ? 'Deselect All'
                            : 'Select All'}
                        </Label>
                        {maxSelections > 0 && (
                          <span className="ml-auto text-sm text-muted-foreground">
                            {selectedQuestionIds.length} / {maxSelections} selected
                          </span>
                        )}
                      </div>
                    )}

                    {/* Questions List */}
                    <div className="flex-1 overflow-hidden">
                      <VirtualizedQuestionList
                        questions={asQuestions(questionsData?.items || [])}
                        isLoading={isLoadingQuestions}
                        onView={handleViewQuestion}
                        onEdit={undefined}
                        onDelete={undefined}
                        onDuplicate={undefined}
                        containerHeight="100%"
                        className="flex-1"
                      />
                    </div>

                    {/* Pagination */}
                    {questionsData && (
                      <div className="mt-4">
                        <QuestionPagination
                          currentPage={pagination.page}
                          totalPages={Math.ceil((questionsData.total || 0) / pagination.pageSize)}
                          pageSize={pagination.pageSize}
                          totalItems={questionsData.total || 0}
                          onPageChange={handlePageChange}
                          onPageSizeChange={handlePageSizeChange}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detail" className="flex-1 overflow-auto">
              {selectedQuestion && (
                <QuestionDetail
                  question={asQuestion(selectedQuestion)}
                  onBack={handleBackToList}
                  onEdit={undefined}
                  onDelete={undefined}
                  onDuplicate={undefined}
                />
              )}

              {isLoadingSelectedQuestion && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div>
              {selectedQuestionIds.length > 0 && (
                <span className="text-sm">
                  {selectedQuestionIds.length} question{selectedQuestionIds.length !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedQuestionIds.length === 0}
              >
                Select {selectedQuestionIds.length} Question{selectedQuestionIds.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionBankSelector;
