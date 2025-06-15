'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Edit, Check, X } from 'lucide-react';
import {
  BloomsTaxonomyLevel,
  BloomsTaxonomySelector,
  BLOOMS_LEVEL_METADATA,
  ActionVerbSuggestions
} from '@/features/bloom';
import { Question } from '../../types/question';

interface QuestionBloomsClassificationProps {
  questions: Question[];
  onUpdateQuestionBloomsLevel: (questionId: string, bloomsLevel: BloomsTaxonomyLevel) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Component for classifying assessment questions according to Bloom's Taxonomy
 */
export function QuestionBloomsClassification({
  questions,
  onUpdateQuestionBloomsLevel,
  readOnly = false,
  className = '',
}: QuestionBloomsClassificationProps) {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<BloomsTaxonomyLevel | null>(null);

  // Start editing a question's Bloom's level
  const handleStartEdit = (question: Question) => {
    if (question.id) {
      setEditingQuestionId(question.id);
    }
    // Convert string bloomsLevel to BloomsTaxonomyLevel enum value
    if (question.bloomsLevel) {
      setSelectedLevel(question.bloomsLevel as BloomsTaxonomyLevel);
    } else {
      setSelectedLevel(null);
    }
  };

  // Save the edited Bloom's level
  const handleSaveEdit = (questionId: string) => {
    if (selectedLevel) {
      onUpdateQuestionBloomsLevel(questionId, selectedLevel);
    }
    setEditingQuestionId(null);
    setSelectedLevel(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setSelectedLevel(null);
  };

  // Get the percentage of questions classified
  const getClassificationPercentage = () => {
    if (questions.length === 0) return 0;

    const classifiedCount = questions.filter(q => q.bloomsLevel).length;
    return Math.round((classifiedCount / questions.length) * 100);
  };

  // Truncate text to a certain length
  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Question Cognitive Classification</CardTitle>
            <CardDescription>
              Classify questions according to Bloom's Taxonomy cognitive levels
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{getClassificationPercentage()}%</div>
            <div className="text-xs text-muted-foreground">Questions Classified</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="w-[180px]">
                <div className="flex items-center space-x-1">
                  <span>Bloom's Level</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <HelpCircle className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Classify each question according to Bloom's Taxonomy cognitive levels.
                          This helps ensure your assessment has a balanced distribution of question types.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              {!readOnly && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question, index) => (
              <TableRow key={question.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="font-medium">{truncateText(question.text)}</div>
                  {question.type && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Type: {question.type}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingQuestionId === question.id ? (
                    <div className="space-y-2">
                      <BloomsTaxonomySelector
                        value={selectedLevel}
                        onChange={(level) => setSelectedLevel(level)}
                        variant="radio"
                        size="sm"
                        showDescription={false}
                      />
                      {selectedLevel && (
                        <div className="text-xs text-muted-foreground mt-1">
                          <ActionVerbSuggestions
                            bloomsLevel={selectedLevel}
                            count={3}
                            showExamples={false}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {question.bloomsLevel ? (
                        <div
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${BLOOMS_LEVEL_METADATA[question.bloomsLevel].color}20`,
                            color: BLOOMS_LEVEL_METADATA[question.bloomsLevel].color
                          }}
                        >
                          {BLOOMS_LEVEL_METADATA[question.bloomsLevel].name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not classified</span>
                      )}
                    </div>
                  )}
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    {editingQuestionId === question.id ? (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => question.id && handleSaveEdit(question.id)}
                          disabled={!selectedLevel || !question.id}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEdit(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {questions.length === 0 && (
              <TableRow>
                <TableCell colSpan={readOnly ? 3 : 4} className="text-center py-4">
                  No questions available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
