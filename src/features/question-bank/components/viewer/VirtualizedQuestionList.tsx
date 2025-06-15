'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Copy } from 'lucide-react';
import { Question, QuestionType, DifficultyLevel } from '../../models/types';
import { getDifficultyColor, formatDate, truncateText, stripHtml } from '../../utils/question-utils';
import { Skeleton } from '@/components/ui/core/skeleton';

interface VirtualizedQuestionListProps {
  questions: Question[];
  isLoading?: boolean;
  onView?: (question: Question) => void;
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onDuplicate?: (question: Question) => void;
  className?: string;
  containerHeight?: number | string;
  estimatedItemHeight?: number;
  overscan?: number;
}

/**
 * Virtualized Question List Component
 *
 * This component displays a virtualized list of questions with basic information
 * and action buttons for viewing, editing, duplicating, and deleting.
 * It uses virtualization to efficiently render large lists of questions.
 */
export const VirtualizedQuestionList: React.FC<VirtualizedQuestionListProps> = ({
  questions,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  className = '',
  containerHeight = 600,
  estimatedItemHeight = 120,
  overscan = 5,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Get the display name for the question type
  const getQuestionTypeDisplayName = (type: QuestionType): string => {
    const displayNames: Record<QuestionType, string> = {
      [QuestionType.MULTIPLE_CHOICE]: 'Multiple Choice',
      [QuestionType.TRUE_FALSE]: 'True/False',
      [QuestionType.MULTIPLE_RESPONSE]: 'Multiple Response',
      [QuestionType.FILL_IN_THE_BLANKS]: 'Fill in the Blanks',
      [QuestionType.MATCHING]: 'Matching',
      [QuestionType.DRAG_AND_DROP]: 'Drag and Drop',
      [QuestionType.DRAG_THE_WORDS]: 'Drag the Words',
      [QuestionType.NUMERIC]: 'Numeric',
      [QuestionType.SEQUENCE]: 'Sequence',
      [QuestionType.FLASH_CARDS]: 'Flash Cards',
      [QuestionType.READING]: 'Reading',
      [QuestionType.VIDEO]: 'Video',
      [QuestionType.SHORT_ANSWER]: 'Short Answer',
      [QuestionType.ESSAY]: 'Essay',
      [QuestionType.HOTSPOT]: 'Hotspot',
      [QuestionType.LIKERT_SCALE]: 'Likert Scale'
    };

    return displayNames[type] || String(type);
  };

  // Get the display name for the difficulty level
  const getDifficultyDisplayName = (difficulty: DifficultyLevel): string => {
    const displayNames: Record<DifficultyLevel, string> = {
      [DifficultyLevel.VERY_EASY]: 'Very Easy',
      [DifficultyLevel.EASY]: 'Easy',
      [DifficultyLevel.MEDIUM]: 'Medium',
      [DifficultyLevel.HARD]: 'Hard',
      [DifficultyLevel.VERY_HARD]: 'Very Hard'
    };

    return displayNames[difficulty] || String(difficulty);
  };

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: isLoading ? 5 : questions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
  });

  // Render a question item
  const renderQuestion = useCallback((question: Question, index: number) => {
    // Get question text for preview
    const getQuestionText = (content: any): string => {
      if (!content) return '';

      if (typeof content === 'string') {
        return content;
      }

      if (content.text) {
        return content.text;
      }

      if (content.passage) {
        return content.passage;
      }

      return JSON.stringify(content).substring(0, 100) + '...';
    };

    return (
      <Card key={question.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-grow">
              <h3 className="text-lg font-semibold mb-1 line-clamp-1">{question.title}</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                  {getQuestionTypeDisplayName(question.questionType)}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${getDifficultyColor(question.difficulty)} text-white`}
                >
                  {getDifficultyDisplayName(question.difficulty)}
                </Badge>
                {question.gradeLevel && (
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-100">
                    Grade {question.gradeLevel}
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {stripHtml(truncateText(getQuestionText(question.content), 150))}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Created: {formatDate(question.createdAt)}
                {question.updatedAt && question.updatedAt !== question.createdAt &&
                  ` • Updated: ${formatDate(question.updatedAt)}`}
              </div>
            </div>
            <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
              {onView && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(question)}
                  aria-label="View question"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(question)}
                  aria-label="Edit question"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDuplicate && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDuplicate(question)}
                  aria-label="Duplicate question"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(question)}
                  aria-label="Delete question"
                  className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [onView, onEdit, onDelete, onDuplicate]);

  // Render a skeleton item for loading state
  const renderSkeleton = useCallback(() => {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-grow">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <div className="flex flex-wrap gap-2 mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-3 w-1/3 mt-2" />
            </div>
            <div className="flex flex-row sm:flex-col gap-2 mt-2 sm:mt-0">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, []);

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            data-index={virtualRow.index}
            className="absolute top-0 left-0 w-full"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
              padding: '0.5rem 0',
            }}
          >
            {isLoading
              ? renderSkeleton()
              : renderQuestion(questions[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedQuestionList;
