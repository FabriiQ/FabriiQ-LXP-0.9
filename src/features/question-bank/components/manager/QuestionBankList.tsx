'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Plus, Search } from 'lucide-react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';
import { QuestionBank, SystemStatus as LocalSystemStatus } from '../../models/types';
import { SystemStatus } from '@prisma/client';
import { formatDate } from '../../utils/question-utils';
import { Pagination } from '@/components/ui/composite/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface QuestionBankListProps {
  onView?: (questionBank: QuestionBank) => void;
  onEdit?: (questionBank: QuestionBank) => void;
  onDelete?: (questionBank: QuestionBank) => void;
  onCreate?: () => void;
  className?: string;
}

/**
 * Question Bank List Component
 *
 * This component displays a list of question banks with basic information
 * and action buttons for viewing, editing, and deleting.
 */
export const QuestionBankList: React.FC<QuestionBankListProps> = ({
  onView,
  onEdit,
  onDelete,
  onCreate,
  className = '',
}) => {
  const { toast } = useToast();

  // State for search, pagination, and delete dialog
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<QuestionBank | null>(null);

  // Fetch question banks
  const {
    data: questionBanksData,
    isLoading,
    isError,
    error,
    refetch: refetchQuestionBanks
  } = api.questionBank.getQuestionBanks.useQuery({
    filters: {
      search: searchTerm || undefined,
      status: 'ACTIVE', // Use string value instead of enum
    },
    pagination: {
      page,
      pageSize,
    },
    sorting: {
      field: 'createdAt',
      direction: 'desc',
    },
  }, {
    // Handle errors gracefully
    onError: (error) => {
      console.error('Error fetching question banks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load question banks. Please try again later.',
        variant: 'error',
      });
    }
  });

  // Delete question bank mutation
  const deleteQuestionBankMutation = api.questionBank.deleteQuestionBank.useMutation({
    onSuccess: () => {
      toast({
        title: 'Question bank deleted',
        description: 'The question bank has been successfully deleted.',
      });
      refetchQuestionBanks();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete question bank: ${error.message}`,
        variant: 'error',
      });
    },
  });

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page on page size change
  };

  // Handle delete
  const handleDelete = (questionBank: QuestionBank) => {
    setBankToDelete(questionBank);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (bankToDelete) {
      deleteQuestionBankMutation.mutate({ id: bankToDelete.id });
    }
    setDeleteDialogOpen(false);
    setBankToDelete(null);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: SystemStatus | LocalSystemStatus) => {
    // Convert Prisma SystemStatus to LocalSystemStatus if needed
    const localStatus = status as unknown as LocalSystemStatus;

    switch (localStatus) {
      case LocalSystemStatus.ACTIVE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case LocalSystemStatus.INACTIVE:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case LocalSystemStatus.ARCHIVED:
      case LocalSystemStatus.ARCHIVED_CURRENT_YEAR:
      case LocalSystemStatus.ARCHIVED_PREVIOUS_YEAR:
      case LocalSystemStatus.ARCHIVED_HISTORICAL:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case LocalSystemStatus.DELETED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Question Banks</CardTitle>
              <CardDescription>
                Manage your question banks
              </CardDescription>
            </div>
            {onCreate && (
              <Button
                variant="default"
                size="sm"
                onClick={onCreate}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Question Bank
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search question banks..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-9"
              />
            </div>

            {/* Question Banks List */}
            <div className="space-y-4">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-grow">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-2" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-9 w-9 rounded-md" />
                          <Skeleton className="h-9 w-9 rounded-md" />
                          <Skeleton className="h-9 w-9 rounded-md" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : isError ? (
                // Error state
                <Card>
                  <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                    <div className="rounded-full bg-red-100 dark:bg-red-900 p-4 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-red-500 dark:text-red-300">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Error Loading Question Banks</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      There was a problem loading the question banks. Please try again later.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => refetchQuestionBanks()}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : questionBanksData?.items.length === 0 ? (
                // Enhanced empty state
                <Card>
                  <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                        <path d="M9 14h6"></path>
                        <path d="M9 10h6"></path>
                        <path d="M12 18h.01"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Question Banks Found</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Question banks are automatically created when subjects are added to courses.
                      You can also create custom question banks for specific purposes.
                    </p>
                    {onCreate && (
                      <Button
                        variant="default"
                        onClick={onCreate}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create a Question Bank
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                // Question banks list
                questionBanksData?.items.map((questionBank) => (
                  <Card key={questionBank.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold mb-1">{questionBank.name}</h3>
                          {questionBank.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {questionBank.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 dark:text-gray-400">
                            <Badge
                              variant="outline"
                              className={getStatusBadgeColor(questionBank.status)}
                            >
                              {questionBank.status}
                            </Badge>

                            {/* Display course and subject info if available */}
                            {(questionBank as any).questions?.[0]?.course && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                Course: {(questionBank as any).questions[0].course.name}
                              </Badge>
                            )}

                            {(questionBank as any).questions?.[0]?.subject && (
                              <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                                Subject: {(questionBank as any).questions[0].subject.name}
                              </Badge>
                            )}

                            <span>Created: {formatDate(questionBank.createdAt)}</span>
                            {questionBank.updatedAt && questionBank.updatedAt !== questionBank.createdAt && (
                              <span>Updated: {formatDate(questionBank.updatedAt)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onView({
                            ...questionBank,
                            description: questionBank.description || undefined,
                            status: questionBank.status as unknown as LocalSystemStatus
                          })}
                              aria-label={`View ${questionBank.name}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit({
                            ...questionBank,
                            description: questionBank.description || undefined,
                            status: questionBank.status as unknown as LocalSystemStatus
                          })}
                              aria-label={`Edit ${questionBank.name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete({
                            ...questionBank,
                            description: questionBank.description || undefined,
                            status: questionBank.status as unknown as LocalSystemStatus
                          })}
                              aria-label={`Delete ${questionBank.name}`}
                              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {questionBanksData && questionBanksData.total > 0 && (
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(questionBanksData.total / pageSize)}
                onPageChange={handlePageChange}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[5, 10, 20, 50]}
                totalItems={questionBanksData.total}
                showPageSizeSelector={true}
                showItemsCount={true}
                role="teacher"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the question bank
              "{bankToDelete?.name}" and all questions within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

export default QuestionBankList;
