'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Check, X } from 'lucide-react';
import { QuestionType, DifficultyLevel } from '@/features/question-bank/models/types';
import { adaptPrismaQuestion } from '@/features/question-bank/utils/type-adapters';
import { Pagination } from '@/components/ui/composite/pagination';

export interface QuestionBankSelectorProps {
  onSelectQuestions: (questions: any[]) => void;
  subjectId?: string;
  courseId?: string;
  classId?: string;
  className?: string;
}

/**
 * Question Bank Selector Component
 *
 * This component allows teachers to select questions from the question bank
 * to include in their activities.
 */
export const QuestionBankSelector: React.FC<QuestionBankSelectorProps> = ({
  onSelectQuestions,
  subjectId,
  courseId,
  classId,
  className = '',
}) => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch question banks
  const { data: questionBanks, isLoading: isLoadingBanks } = api.questionBank.getQuestionBanks.useQuery({
    filters: {
      subjectId,
      courseId,
      status: 'ACTIVE', // Use string value instead of enum
    },
  }, {
    enabled: !!subjectId,
    onError: (error) => {
      console.error('Error fetching question banks:', error);
    }
  });

  // State for selected question bank
  const [selectedBankId, setSelectedBankId] = useState<string>('');

  // Fetch questions from selected bank
  const { data: questionsData, isLoading: isLoadingQuestions } = api.questionBank.getQuestions.useQuery({
    questionBankId: selectedBankId,
    filters: {
      search: searchTerm || undefined,
      questionType: selectedQuestionType ? (selectedQuestionType as QuestionType) : undefined,
      difficulty: selectedDifficulty ? (selectedDifficulty as DifficultyLevel) : undefined,
      subjectId,
      courseId,
    },
    pagination: {
      page,
      pageSize,
    },
  }, {
    enabled: !!selectedBankId,
  });

  // Check if questions have been used in this class before
  const { data: classUsageData } = api.questionUsage.getClassQuestionUsage.useQuery({
    classId: classId || '',
  }, {
    enabled: !!classId && !!selectedBankId,
  });

  // Update selected bank when subject/course changes
  useEffect(() => {
    if (questionBanks?.items?.length > 0 && !selectedBankId) {
      setSelectedBankId(questionBanks.items[0].id);
    }
  }, [questionBanks, selectedBankId]);

  // Handle question selection
  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Handle adding selected questions to activity
  const handleAddQuestions = () => {
    if (!questionsData) return;

    const selectedQuestionIds = Object.entries(selectedQuestions)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    const selectedQuestionObjects = questionsData.items
      .filter(q => selectedQuestionIds.includes(q.id))
      .map(q => adaptPrismaQuestion(q));

    onSelectQuestions(selectedQuestionObjects);

    // Clear selections
    setSelectedQuestions({});
  };

  // Render question type badge
  const renderQuestionTypeBadge = (type: QuestionType) => {
    const typeColors: Record<QuestionType, string> = {
      [QuestionType.MULTIPLE_CHOICE]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      [QuestionType.TRUE_FALSE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      [QuestionType.MULTIPLE_RESPONSE]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      [QuestionType.FILL_IN_THE_BLANKS]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      [QuestionType.MATCHING]: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
      [QuestionType.DRAG_AND_DROP]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      [QuestionType.DRAG_THE_WORDS]: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
      [QuestionType.NUMERIC]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      [QuestionType.SEQUENCE]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100',
      [QuestionType.FLASH_CARDS]: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-100',
      [QuestionType.READING]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
      [QuestionType.VIDEO]: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100',
      [QuestionType.SHORT_ANSWER]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
      [QuestionType.ESSAY]: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
      [QuestionType.HOTSPOT]: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-100',
      [QuestionType.LIKERT_SCALE]: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    };

    return (
      <Badge variant="outline" className={typeColors[type]}>
        {type.replace(/_/g, ' ')}
      </Badge>
    );
  };

  // Render difficulty badge
  const renderDifficultyBadge = (difficulty: DifficultyLevel) => {
    const difficultyColors: Record<DifficultyLevel, string> = {
      [DifficultyLevel.VERY_EASY]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      [DifficultyLevel.EASY]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      [DifficultyLevel.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      [DifficultyLevel.HARD]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
      [DifficultyLevel.VERY_HARD]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    };

    return (
      <Badge variant="outline" className={difficultyColors[difficulty]}>
        {difficulty.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>Select Questions from Question Bank</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Question Bank Selector */}
            <div className="space-y-2">
              <Label htmlFor="question-bank">Question Bank</Label>
              {isLoadingBanks ? (
                <Skeleton className="h-10 w-full" />
              ) : questionBanks?.items.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No question banks available for this subject/course.
                </div>
              ) : (
                <Select
                  value={selectedBankId}
                  onValueChange={setSelectedBankId}
                >
                  <SelectTrigger id="question-bank">
                    <SelectValue placeholder="Select a question bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionBanks?.items.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="h-10 w-10"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="question-type">Question Type</Label>
                  <Select
                    value={selectedQuestionType}
                    onValueChange={setSelectedQuestionType}
                  >
                    <SelectTrigger id="question-type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      {Object.values(QuestionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={selectedDifficulty}
                    onValueChange={setSelectedDifficulty}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Difficulties</SelectItem>
                      {Object.values(DifficultyLevel).map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-2">
              {isLoadingQuestions ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="p-4 border rounded-md flex items-start gap-3">
                    <Skeleton className="h-5 w-5 mt-1" />
                    <div className="flex-grow">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <div className="flex gap-2 mb-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
              ) : !questionsData || questionsData.items.length === 0 ? (
                <div className="p-6 text-center border rounded-md">
                  <p className="text-muted-foreground">
                    No questions found. Try adjusting your filters or search term.
                  </p>
                </div>
              ) : (
                questionsData.items.map((question) => (
                  <div key={question.id} className="p-4 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`question-${question.id}`}
                        checked={!!selectedQuestions[question.id]}
                        onCheckedChange={() => toggleQuestionSelection(question.id)}
                      />
                      <div className="flex-grow">
                        <Label
                          htmlFor={`question-${question.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {question.title}
                        </Label>
                        <div className="flex flex-wrap gap-2 my-2">
                          {renderQuestionTypeBadge(question.questionType)}
                          {renderDifficultyBadge(question.difficulty)}
                          {question.usageStats && (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">
                              Used {question.usageStats.usageCount} times
                            </Badge>
                          )}
                          {classId && classUsageData?.usedQuestions.some(q => q.questionId === question.id) && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                              Used in this class
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {question.content.text?.substring(0, 100)}
                          {question.content.text?.length > 100 ? '...' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {questionsData && questionsData.total > 0 && (
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(questionsData.total / pageSize)}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                totalItems={questionsData.total}
                showPageSizeSelector={true}
                showItemsCount={true}
                role="teacher"
              />
            )}

            {/* Selected Questions Summary */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <span className="font-medium">
                  {Object.values(selectedQuestions).filter(Boolean).length} questions selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedQuestions({})}
                  disabled={Object.values(selectedQuestions).filter(Boolean).length === 0}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button
                  onClick={handleAddQuestions}
                  disabled={Object.values(selectedQuestions).filter(Boolean).length === 0}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add Selected Questions
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
