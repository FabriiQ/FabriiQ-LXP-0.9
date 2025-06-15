'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { QuestionType, DifficultyLevel, SystemStatus } from '../../models/types';
import VirtualizedQuestionList from '../viewer/VirtualizedQuestionList';
import QuestionDetail from '../viewer/QuestionDetail';
import QuestionFilter from '../filters/QuestionFilter';
import QuestionSort from '../filters/QuestionSort';
import QuestionSearch from '../filters/QuestionSearch';
import QuestionPagination from '../filters/QuestionPagination';
import { adaptPrismaQuestions, adaptPrismaQuestion } from '../../utils/type-adapters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface QuestionBankManagerProps {
  questionBankId: string;
  className?: string;
}

/**
 * Question Bank Manager Component
 *
 * This component manages the question bank, including:
 * - Displaying a list of questions with virtualization
 * - Filtering, sorting, and searching questions
 * - Pagination for large datasets
 * - Viewing, editing, duplicating, and deleting questions
 */
export const QuestionBankManager: React.FC<QuestionBankManagerProps> = ({
  questionBankId,
  className = '',
}) => {
  const router = useRouter();
  const { toast } = useToast();

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
    status?: SystemStatus;
  }>({
    status: SystemStatus.ACTIVE,
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

  // State for selected question and UI state
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Fetch question bank details
  const { data: questionBankData, isError: isQuestionBankError } = api.questionBank.getQuestionBank.useQuery(
    { id: questionBankId },
    {
      enabled: !!questionBankId,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching question bank:', error);
      }
    }
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

  // Use the default if data is not available or there was an error
  const questionBank = (questionBankData && !isQuestionBankError) ? {
    ...defaultQuestionBank,
    ...(questionBankData as any),
  } : defaultQuestionBank;

  // Set subject and course filters if the question bank is associated with them
  useEffect(() => {
    if (questionBankData?.questions?.[0]?.subject) {
      const newFilters = { ...filters };
      newFilters.subjectId = questionBankData.questions[0].subject.id;

      if (questionBankData.questions[0].course) {
        newFilters.courseId = questionBankData.questions[0].course.id;
      }

      setFilters(newFilters);
    }
  }, [questionBankData, filters, setFilters]);

  // Fetch questions with filters, sorting, and pagination
  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
    isError: isQuestionsError,
    refetch: refetchQuestions
  } = api.questionBank.getQuestions.useQuery(
    {
      questionBankId,
      filters,
      pagination,
      sorting,
    },
    {
      enabled: !!questionBankId,
      keepPreviousData: true,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching questions:', error);
      }
    }
  );

  // Fetch selected question details
  const {
    data: selectedQuestionData,
    isLoading: isLoadingSelectedQuestion,
    isError: isSelectedQuestionError
  } = api.questionBank.getQuestion.useQuery(
    { id: selectedQuestionId || '' },
    {
      enabled: !!selectedQuestionId,
      keepPreviousData: false,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching selected question:', error);
      }
    }
  );

  // Adapt the selected question to our domain model
  const selectedQuestion = (selectedQuestionData && !isSelectedQuestionError) ?
    adaptPrismaQuestion(selectedQuestionData as any) : null;

  // Delete question mutation
  const deleteQuestionMutation = api.questionBank.deleteQuestion.useMutation({
    onSuccess: () => {
      toast({
        title: 'Question deleted',
        description: 'The question has been successfully deleted.',
      });
      refetchQuestions();
      setSelectedQuestionId(null);
      setActiveTab('list');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete question: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Duplicate question mutation
  const duplicateQuestionMutation = api.questionBank.duplicateQuestion.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Question duplicated',
        description: 'The question has been successfully duplicated.',
      });
      refetchQuestions();
      // Optionally navigate to the new question
      setSelectedQuestionId(data.id);
      setActiveTab('detail');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to duplicate question: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSorting: typeof sorting) => {
    setSorting(newSorting);
  }, []);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  }, []);

  // Handle pagination changes
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Handle page size changes
  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize }); // Reset to first page on page size change
  }, []);

  // Handle view question
  const handleViewQuestion = useCallback((question: any) => {
    setSelectedQuestionId(question.id);
    setActiveTab('detail');
  }, []);

  // Handle edit question
  const handleEditQuestion = useCallback((question: any) => {
    router.push(`/admin/academic/question-bank/edit/${question.id}`);
  }, [router]);

  // Handle delete question
  const handleDeleteQuestion = useCallback((question: any) => {
    setQuestionToDelete(question.id);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm delete question
  const confirmDeleteQuestion = useCallback(() => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate({ id: questionToDelete });
    }
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
  }, [questionToDelete, deleteQuestionMutation]);

  // Handle duplicate question
  const handleDuplicateQuestion = useCallback((question: any) => {
    duplicateQuestionMutation.mutate({ id: question.id });
  }, [duplicateQuestionMutation]);

  // Handle back to list
  const handleBackToList = useCallback(() => {
    setSelectedQuestionId(null);
    setActiveTab('list');
  }, []);

  // Handle create new question
  const handleCreateQuestion = useCallback(() => {
    router.push(`/admin/academic/question-bank/create?bankId=${questionBankId}`);
  }, [router, questionBankId]);

  // Handle refresh questions
  const handleRefreshQuestions = useCallback(() => {
    refetchQuestions();
  }, [refetchQuestions]);

  // Reset selected question when tab changes
  useEffect(() => {
    if (activeTab !== 'detail') {
      setSelectedQuestionId(null);
    }
  }, [activeTab]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Question Bank Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{questionBank?.name || 'Question Bank'}</CardTitle>
              <CardDescription>
                {questionBank?.description || 'Manage questions in this question bank'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshQuestions}
                disabled={isLoadingQuestions}
              >
                <div className="h-4 w-4 mr-2 flex">
                  <ArrowUp className="h-4 w-4" />
                  <ArrowDown className="h-4 w-4" />
                </div>
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/admin/academic/question-bank/${questionBankId}/bulk-upload`}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/admin/academic/question-bank/${questionBankId}/export`}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateQuestion}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Question
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Question List</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedQuestionId}>Question Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <QuestionSearch
                    value={filters.search || ''}
                    onSearch={handleSearch}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <QuestionSort
                    value={sorting}
                    onChange={handleSortChange}
                  />
                </div>
              </div>

              <Separator className="my-4" />

              {/* Only show QuestionFilter if we need it */}
              {!questionBankData?.questions?.[0]?.subject ? (
                <QuestionFilter
                  filters={filters}
                  onChange={handleFilterChange}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  This question bank is already associated with a subject:
                  <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                    {questionBankData.questions[0].subject.name}
                  </Badge>
                  {questionBankData.questions[0].course && (
                    <>
                      <span className="mx-2">in course:</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                        {questionBankData.questions[0].course.name}
                      </Badge>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card>
            <CardContent className="p-4">
              <VirtualizedQuestionList
                questions={questionsData?.items && !isQuestionsError ? adaptPrismaQuestions(questionsData.items) : []}
                isLoading={isLoadingQuestions}
                onView={handleViewQuestion}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
                onDuplicate={handleDuplicateQuestion}
                containerHeight={600}
              />

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
        </TabsContent>

        <TabsContent value="detail">
          {selectedQuestion && (
            <QuestionDetail
              question={selectedQuestion}
              onBack={handleBackToList}
              onEdit={() => handleEditQuestion(selectedQuestion)}
              onDelete={() => handleDeleteQuestion(selectedQuestion)}
              onDuplicate={() => handleDuplicateQuestion(selectedQuestion)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question
              and remove it from the question bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteQuestion}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QuestionBankManager;
