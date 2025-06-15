'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Copy } from 'lucide-react';
import { Question, QuestionType, DifficultyLevel } from '../../models/types';
import { getDifficultyColor, formatDate, truncateText, stripHtml } from '../../utils/question-utils';

interface QuestionListProps {
  questions: Question[];
  onView?: (question: Question) => void;
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onDuplicate?: (question: Question) => void;
  className?: string;
}

/**
 * Question List Component
 *
 * This component displays a list of questions with basic information
 * and action buttons for viewing, editing, duplicating, and deleting.
 */
export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  className
}) => {
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

  // Get the question text based on the question type
  const getQuestionText = (question: Question): string => {
    const content = question.content;

    // All question types have a 'text' property except for FlashCards
    if ('text' in content) {
      return stripHtml(content.text);
    }

    // For FlashCards, use the first card's front text
    if ('cards' in content && content.cards.length > 0) {
      return stripHtml(content.cards[0].front);
    }

    // For Reading, use the first paragraph of the passage
    if ('passage' in content) {
      return stripHtml(content.passage.split('\n')[0]);
    }

    // For Video, use the first question's text or a default
    if ('videoUrl' in content && content.questions.length > 0) {
      return stripHtml(content.questions[0].text);
    }

    return 'No question text available';
  };

  if (!questions || questions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No questions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {questions.map((question) => (
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
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                  {truncateText(getQuestionText(question), 150)}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {formatDate(question.createdAt)}
                  {question.updatedAt && question.updatedAt !== question.createdAt &&
                    ` • Updated: ${formatDate(question.updatedAt)}`}
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-start">
                {onView && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(question)}
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(question)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {onDuplicate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDuplicate(question)}
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(question)}
                    title="Delete"
                    className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuestionList;
