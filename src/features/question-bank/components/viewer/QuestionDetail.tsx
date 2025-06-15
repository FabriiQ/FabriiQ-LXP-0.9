'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, ChevronLeft, Copy, Trash2, BarChart } from 'lucide-react';
import { RichTextDisplay } from '@/features/activties/components/ui/RichTextDisplay';
import { Question, QuestionType, DifficultyLevel, QuestionContent } from '../../models/types';
import { getDifficultyColor, formatDate } from '../../utils/question-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuestionUsageAnalytics, QuestionClassUsage } from '../analytics';

interface QuestionDetailProps {
  question: Question;
  onBack?: () => void;
  onEdit?: (question: Question) => void;
  onDelete?: (question: Question) => void;
  onDuplicate?: (question: Question) => void;
  className?: string;
}

/**
 * Question Detail Component
 *
 * This component displays detailed information about a question,
 * including its content, metadata, and action buttons.
 */
export const QuestionDetail: React.FC<QuestionDetailProps> = ({
  question,
  onBack,
  onEdit,
  onDelete,
  onDuplicate,
  className
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('content');
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

  // Render the question content based on its type
  const renderQuestionContent = (content: QuestionContent): React.ReactNode => {
    // All question types have a 'text' property except for FlashCards
    if ('text' in content) {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <RichTextDisplay content={content.text} />
        </div>
      );
    }

    // For FlashCards, show the cards
    if ('cards' in content && content.cards.length > 0) {
      return (
        <div className="space-y-4">
          {content.cards.map((card, index) => (
            <div key={card.id} className="border rounded-md p-4">
              <h4 className="font-medium mb-2">Card {index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Front:</div>
                  <div className="prose dark:prose-invert max-w-none">
                    <RichTextDisplay content={card.front} />
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Back:</div>
                  <div className="prose dark:prose-invert max-w-none">
                    <RichTextDisplay content={card.back} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // For Reading, show the passage
    if ('passage' in content) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h4 className="font-medium mb-2">Reading Passage</h4>
            <div className="prose dark:prose-invert max-w-none">
              <RichTextDisplay content={content.passage} />
            </div>
          </div>

          {content.questions && content.questions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Questions</h4>
              {content.questions.map((question, index) => (
                <div key={question.id} className="p-3 border rounded-md">
                  <div className="font-medium mb-1">Question {index + 1}</div>
                  <div className="prose dark:prose-invert max-w-none">
                    <RichTextDisplay content={question.text} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // For Video, show the video URL and questions
    if ('videoUrl' in content) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h4 className="font-medium mb-2">Video URL</h4>
            <div className="break-all">
              <a
                href={content.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {content.videoUrl}
              </a>
            </div>
          </div>

          {content.questions && content.questions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Questions</h4>
              {content.questions.map((question, index) => (
                <div key={question.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">Question {index + 1}</div>
                    <Badge variant="outline">
                      {formatTimestamp(question.timestamp)}
                    </Badge>
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    <RichTextDisplay content={question.text} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <div>No content available</div>;
  };

  // Format timestamp to MM:SS
  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Render explanation if available
  const renderExplanation = (content: QuestionContent): React.ReactNode => {
    if ('explanation' in content && content.explanation) {
      return (
        <div className="mt-6">
          <h4 className="font-medium mb-2">Explanation</h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="prose dark:prose-invert max-w-none">
              <RichTextDisplay content={content.explanation} />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render hint if available
  const renderHint = (content: QuestionContent): React.ReactNode => {
    if ('hint' in content && content.hint) {
      return (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Hint</h4>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <div className="prose dark:prose-invert max-w-none">
              <RichTextDisplay content={content.hint} />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="mr-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <CardTitle>{question.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(question)}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
            {onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(question)}
              >
                <Copy className="h-4 w-4 mr-2" /> Duplicate
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(question)}
                className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
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
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart className="h-4 w-4" />
              <span>Usage Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            {/* Question Content */}
            <div>
              {renderQuestionContent(question.content)}
            </div>

            {/* Explanation and Hint */}
            {renderExplanation(question.content)}
            {renderHint(question.content)}

            {/* Metadata */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-2">Metadata</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
                <div>{formatDate(question.createdAt)}</div>
              </div>
              {question.updatedAt && question.updatedAt !== question.createdAt && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Last Updated</div>
                  <div>{formatDate(question.updatedAt)}</div>
                </div>
              )}
              {question.sourceReference && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Source</div>
                  <div>{question.sourceReference}</div>
                </div>
              )}
              {question.year && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Year</div>
                  <div>{question.year}</div>
                </div>
              )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <QuestionUsageAnalytics questionId={question.id} />
            <QuestionClassUsage questionId={question.id} />
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full flex justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ID: {question.id}
          </div>
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Back to List
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default QuestionDetail;
