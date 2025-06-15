import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/data-display/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/forms/textarea';
import { Plus, MinusIcon, Check, X } from 'lucide-react';

interface FillInTheBlanksProps {
  question: {
    id: string;
    text: string;
    blanks: Array<{
      id: string;
      answer: string;
      points?: number;
    }>;
    points?: number;
  };
  onChange: (updatedQuestion: any) => void;
  mode?: 'edit' | 'preview' | 'student' | 'review';
  userAnswers?: Record<string, string>;
  onAnswerChange?: (blankId: string, value: string) => void;
  showCorrectAnswers?: boolean;
}

export function FillInTheBlanks({
  question,
  onChange,
  mode = 'edit',
  userAnswers = {},
  onAnswerChange,
  showCorrectAnswers = false
}: FillInTheBlanksProps) {
  const [text, setText] = useState(question.text || '');
  const [blanks, setBlanks] = useState(question.blanks || []);
  const [renderedContent, setRenderedContent] = useState<React.ReactNode[]>([]);

  // Update the parent component when the question changes
  useEffect(() => {
    if (mode === 'edit') {
      onChange({
        ...question,
        text,
        blanks
      });
    }
  }, [text, blanks, mode, onChange, question]);

  // Add a new blank
  const addBlank = () => {
    const newBlank = {
      id: `blank_${Date.now()}`,
      answer: '',
      points: 1
    };
    setBlanks([...blanks, newBlank]);
  };

  // Remove a blank
  const removeBlank = (id: string) => {
    setBlanks(blanks.filter(blank => blank.id !== id));
  };

  // Update a blank's answer
  const updateBlankAnswer = (id: string, answer: string) => {
    setBlanks(
      blanks.map(blank =>
        blank.id === id ? { ...blank, answer } : blank
      )
    );
  };

  // Update a blank's points
  const updateBlankPoints = (id: string, points: number) => {
    setBlanks(
      blanks.map(blank =>
        blank.id === id ? { ...blank, points } : blank
      )
    );
  };

  // Handle student answer changes
  const handleStudentAnswerChange = (blankId: string, value: string) => {
    if (onAnswerChange) {
      onAnswerChange(blankId, value);
    }
  };

  // Render the content with blanks
  useEffect(() => {
    if (mode === 'edit') {
      setRenderedContent([
        <Textarea
          key="text-editor"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text with [blank] placeholders where you want students to fill in answers"
          className="min-h-[100px] mb-4"
        />
      ]);
    } else {
      // For preview, student, or review modes
      const parts = text.split(/\[blank\]/g);
      const renderedParts: React.ReactNode[] = [];

      parts.forEach((part, index) => {
        // Add the text part
        renderedParts.push(<span key={`text-${index}`}>{part}</span>);

        // Add the blank input if not the last part
        if (index < parts.length - 1 && index < blanks.length) {
          const blank = blanks[index];
          const isCorrect = userAnswers[blank.id]?.toLowerCase() === blank.answer.toLowerCase();

          if (mode === 'student') {
            renderedParts.push(
              <Input
                key={`blank-${blank.id}`}
                value={userAnswers[blank.id] || ''}
                onChange={(e) => handleStudentAnswerChange(blank.id, e.target.value)}
                className="inline-block w-32 mx-1"
                placeholder="________"
              />
            );
          } else if (mode === 'review') {
            renderedParts.push(
              <span
                key={`blank-${blank.id}`}
                className={`inline-block mx-1 px-2 py-1 border rounded ${
                  isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}
              >
                {userAnswers[blank.id] || '(no answer)'}
                {showCorrectAnswers && !isCorrect && (
                  <span className="ml-1 text-green-600">
                    ({blank.answer})
                  </span>
                )}
                {isCorrect ?
                  <Check className="inline-block ml-1 h-4 w-4 text-green-500" /> :
                  <X className="inline-block ml-1 h-4 w-4 text-red-500" />
                }
              </span>
            );
          } else {
            // Preview mode
            renderedParts.push(
              <span
                key={`blank-${blank.id}`}
                className="inline-block mx-1 px-2 py-1 border border-dashed border-gray-400 bg-gray-50"
              >
                {blank.answer}
              </span>
            );
          }
        }
      });

      setRenderedContent(renderedParts);
    }
  }, [text, blanks, mode, userAnswers, onAnswerChange, showCorrectAnswers]);

  return (
    <div className="space-y-4">
      {mode === 'edit' ? (
        <>
          {renderedContent}

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium">Blanks</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addBlank}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Blank
              </Button>
            </div>

            {blanks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No blanks added yet. Add blanks and use [blank] in your text where you want students to fill in answers.
              </p>
            ) : (
              <div className="space-y-3">
                {blanks.map((blank, index) => (
                  <Card key={blank.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Blank {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBlank(blank.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                          <Label htmlFor={`answer-${blank.id}`}>Correct Answer</Label>
                          <Input
                            id={`answer-${blank.id}`}
                            value={blank.answer}
                            onChange={(e) => updateBlankAnswer(blank.id, e.target.value)}
                            placeholder="Enter the correct answer"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`points-${blank.id}`}>Points</Label>
                          <Input
                            id={`points-${blank.id}`}
                            type="number"
                            min={1}
                            value={blank.points}
                            onChange={(e) => updateBlankPoints(blank.id, parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="p-4 border rounded-md bg-white">
          {renderedContent}
        </div>
      )}
    </div>
  );
}
