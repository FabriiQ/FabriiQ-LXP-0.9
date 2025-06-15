'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question, QuestionType } from '../../models/types';
import { QuestionBankSelector } from './QuestionBankSelector';
import { getDifficultyColor } from '../../utils/question-utils';
import { Plus, X, Eye, ArrowDown, ArrowUp } from 'lucide-react';

interface QuestionBankIntegrationProps {
  selectedQuestions: Question[];
  onSelectQuestions: (questions: Question[]) => void;
  onRemoveQuestion: (questionId: string) => void;
  onReorderQuestions?: (questions: Question[]) => void;
  onViewQuestion?: (question: Question) => void;
  subjectId?: string;
  topicId?: string;
  questionType?: QuestionType;
  multiSelect?: boolean;
  maxSelections?: number;
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Question Bank Integration Component
 *
 * This component provides integration with the question bank for activities and assessments.
 * It allows selecting questions from the question bank and managing the selected questions.
 */
export const QuestionBankIntegration: React.FC<QuestionBankIntegrationProps> = ({
  selectedQuestions,
  onSelectQuestions,
  onRemoveQuestion,
  onReorderQuestions,
  onViewQuestion,
  subjectId,
  topicId,
  questionType,
  multiSelect = true,
  maxSelections = 0,
  title = 'Questions from Question Bank',
  description = 'Select questions from the question bank to use in your activity.',
  className = '',
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Handle select questions
  const handleSelectQuestions = (questions: Question[]) => {
    // Combine existing questions with new ones, avoiding duplicates
    const existingIds = selectedQuestions.map(q => q.id);
    const newQuestions = questions.filter(q => !existingIds.includes(q.id));

    // If we're not in multi-select mode, replace the existing questions
    if (!multiSelect) {
      onSelectQuestions(questions);
    } else {
      // Otherwise, add the new questions to the existing ones
      onSelectQuestions([...selectedQuestions, ...newQuestions]);
    }
  };

  // Handle remove question
  const handleRemoveQuestion = (questionId: string) => {
    onRemoveQuestion(questionId);
  };

  // Handle view question
  const handleViewQuestion = (question: Question) => {
    if (onViewQuestion) {
      onViewQuestion(question);
    }
  };

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) {
      return;
    }

    // Reorder the questions
    const newQuestions = [...selectedQuestions];
    const draggedQuestion = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedQuestion);

    // Update the dragged index
    setDraggedIndex(index);

    // Call the reorder callback
    if (onReorderQuestions) {
      onReorderQuestions(newQuestions);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get question type display name
  const getQuestionTypeDisplayName = (type: QuestionType): string => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>

        <CardContent>
          {selectedQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
              <p className="text-muted-foreground mb-4">No questions selected</p>
              <Button
                variant="outline"
                onClick={() => setSelectorOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Select Questions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                  {maxSelections > 0 && ` (max ${maxSelections})`}
                </div>
                {onReorderQuestions && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <div className="flex">
                      <ArrowUp className="h-3 w-3" />
                      <ArrowDown className="h-3 w-3" />
                    </div>
                    Drag to reorder
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {selectedQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-3 border rounded-md ${onReorderQuestions ? 'cursor-move' : ''} ${
                      draggedIndex === index ? 'border-primary bg-primary/5' : ''
                    }`}
                    draggable={!!onReorderQuestions}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{question.title}</div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">
                            {getQuestionTypeDisplayName(question.questionType)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`${getDifficultyColor(question.difficulty)} text-white`}
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {onViewQuestion && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewQuestion(question)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveQuestion(question.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            variant={selectedQuestions.length === 0 ? 'default' : 'outline'}
            onClick={() => setSelectorOpen(true)}
            disabled={maxSelections > 0 && selectedQuestions.length >= maxSelections}
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedQuestions.length === 0 ? 'Select Questions' : 'Add More Questions'}
          </Button>
        </CardFooter>
      </Card>

      <QuestionBankSelector
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelectQuestions={handleSelectQuestions}
        subjectId={subjectId}
        topicId={topicId}
        questionType={questionType}
        multiSelect={multiSelect}
        maxSelections={maxSelections > 0 ? maxSelections - selectedQuestions.length : 0}
        title="Select Questions"
        description="Select questions from the question bank to use in your activity."
      />
    </div>
  );
};

export default QuestionBankIntegration;
