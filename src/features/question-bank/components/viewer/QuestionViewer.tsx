'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RichTextDisplay } from '@/features/activties/components/ui/RichTextDisplay';
import { QuestionType, DifficultyLevel, Question, QuestionContent } from '../../models/types';
import { getDifficultyColor } from '../../utils/question-utils';

interface QuestionViewerProps {
  question: Question;
  className?: string;
}

/**
 * Question Viewer Component
 *
 * This component displays a question in a read-only format.
 * It shows the question title, type, difficulty, and content.
 */
export const QuestionViewer: React.FC<QuestionViewerProps> = ({
  question,
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
  const getQuestionText = (content: QuestionContent): string => {
    // All question types have a 'text' property except for FlashCards
    if ('text' in content) {
      return content.text;
    }

    // For FlashCards, use the first card's front text
    if ('cards' in content && content.cards.length > 0) {
      return content.cards[0].front;
    }

    // For Reading, use the first paragraph of the passage
    if ('passage' in content) {
      const passage = content.passage;
      // Extract first paragraph or limit to 150 characters
      const firstParagraph = passage.split('\n')[0];
      return firstParagraph.length > 150
        ? firstParagraph.substring(0, 150) + '...'
        : firstParagraph;
    }

    // For Video, use the first question's text or a default
    if ('videoUrl' in content && content.questions.length > 0) {
      return content.questions[0].text;
    }

    return 'No question text available';
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{question.title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
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
        </div>

        <div className="mb-4">
          <div className="prose dark:prose-invert max-w-none">
            <RichTextDisplay content={getQuestionText(question.content)} />
          </div>
        </div>

        {/* Display source reference if available */}
        {question.sourceReference && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">Source:</span> {question.sourceReference}
            {question.year && ` (${question.year})`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionViewer;
