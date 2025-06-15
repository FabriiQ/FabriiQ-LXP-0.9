'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Eye, Edit, BookOpen } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { RichTextDisplay } from '@/features/activties/components/ui/RichTextDisplay';
import { MediaSelector } from '@/features/activties/components/ui/MediaSelector';
import { ReadingContent, ReadingQuestion, QuestionType } from '../../models/types';
import { generateId } from '@/features/activties/models/base';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReadingEditorProps {
  content: ReadingContent;
  onChange: (content: ReadingContent) => void;
}

/**
 * Reading Question Editor for Question Bank
 * 
 * This component provides an interface for creating and editing
 * reading questions with:
 * - Passage text editing
 * - Sub-questions management
 * - Explanation and hint fields
 * - Media attachment
 */
export const ReadingEditor: React.FC<ReadingEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<ReadingContent>(
    content.passage ? content : {
      passage: 'Enter your reading passage here. This will be the text that students read before answering the questions.',
      questions: [
        {
          id: generateId(),
          text: 'What is the main idea of the passage?',
          type: QuestionType.MULTIPLE_CHOICE,
          content: {
            text: 'What is the main idea of the passage?',
            options: [
              { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
              { id: generateId(), text: 'Option 2', isCorrect: false, feedback: 'Incorrect.' },
              { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
              { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
            ]
          }
        }
      ]
    }
  );

  // State for preview mode
  const [showPreview, setShowPreview] = useState(false);

  // Current question being edited
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Ref for scrolling to newly added questions
  const questionsContainerRef = useRef<HTMLDivElement>(null);

  // Get current question
  const currentQuestion = localContent.questions[currentQuestionIndex] || localContent.questions[0];

  // Update the local content and call onChange
  const updateContent = (updates: Partial<ReadingContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle passage change
  const handlePassageChange = (passage: string) => {
    updateContent({ passage });
  };

  // Handle explanation change
  const handleExplanationChange = (explanation: string) => {
    updateContent({ explanation });
  };

  // Handle hint change
  const handleHintChange = (hint: string) => {
    updateContent({ hint });
  };

  // Handle media change
  const handleMediaChange = (media?: any) => {
    // Convert MediaItem to QuestionMedia if needed
    if (media) {
      const questionMedia = {
        type: media.type,
        url: media.url,
        alt: media.alt,
        caption: media.caption
      };
      updateContent({ media: questionMedia });
    } else {
      updateContent({ media: undefined });
    }
  };

  // Handle question change
  const handleQuestionChange = (questionIndex: number, updates: Partial<ReadingQuestion>) => {
    const newQuestions = [...localContent.questions];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      ...updates
    };
    updateContent({ questions: newQuestions });
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion: ReadingQuestion = {
      id: generateId(),
      text: 'New question about the passage',
      type: QuestionType.MULTIPLE_CHOICE,
      content: {
        text: 'New question about the passage',
        options: [
          { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
          { id: generateId(), text: 'Option 2', isCorrect: false, feedback: 'Incorrect.' },
          { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
          { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
        ]
      }
    };
    
    const updatedQuestions = [...localContent.questions, newQuestion];
    updateContent({ questions: updatedQuestions });
    
    // Navigate to the new question
    setCurrentQuestionIndex(updatedQuestions.length - 1);

    // Scroll to the new question after it's added
    setTimeout(() => {
      if (questionsContainerRef.current) {
        questionsContainerRef.current.scrollTop = questionsContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  // Remove current question
  const handleRemoveQuestion = (questionIndex: number) => {
    if (localContent.questions.length <= 1) {
      return; // Don't remove the last question
    }
    
    const updatedQuestions = [...localContent.questions];
    updatedQuestions.splice(questionIndex, 1);
    
    updateContent({ questions: updatedQuestions });
    setCurrentQuestionIndex(Math.min(currentQuestionIndex, updatedQuestions.length - 1));
  };

  // Handle question type change
  const handleQuestionTypeChange = (questionIndex: number, type: QuestionType) => {
    const question = localContent.questions[questionIndex];
    
    // Create default content based on the new type
    let newContent: any = {
      text: question.text
    };
    
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        newContent.options = [
          { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
          { id: generateId(), text: 'Option 2', isCorrect: false, feedback: 'Incorrect.' },
          { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
          { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
        ];
        break;
      case QuestionType.TRUE_FALSE:
        newContent.isTrue = true;
        break;
      case QuestionType.MULTIPLE_RESPONSE:
        newContent.options = [
          { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
          { id: generateId(), text: 'Option 2', isCorrect: true, feedback: 'Correct!' },
          { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
          { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
        ];
        break;
      case QuestionType.SHORT_ANSWER:
        newContent.correctAnswers = ['Answer 1', 'Answer 2'];
        break;
      default:
        break;
    }
    
    handleQuestionChange(questionIndex, {
      type,
      content: newContent
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="passage" className="text-lg font-medium flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary-green" />
                Reading Passage
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <Edit className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
            
            {showPreview ? (
              <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800 prose dark:prose-invert max-w-none">
                <RichTextDisplay content={localContent.passage} />
              </div>
            ) : (
              <RichTextEditor
                content={localContent.passage}
                onChange={handlePassageChange}
                placeholder="Enter your reading passage here"
                minHeight="200px"
              />
            )}
          </div>

          <div className="mb-4">
            <Label className="text-lg font-medium mb-2 block">Questions</Label>
            <div 
              ref={questionsContainerRef}
              className="max-h-[400px] overflow-y-auto pr-1 rounded-md"
            >
              {localContent.questions.map((question, index) => (
                <div 
                  key={question.id} 
                  className={`p-4 border rounded-md mb-3 ${index === currentQuestionIndex ? 'border-primary-green bg-white dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'}`}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                      Question {index + 1}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={question.type}
                        onValueChange={(value) => handleQuestionTypeChange(index, value as QuestionType)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Question Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                          <SelectItem value={QuestionType.TRUE_FALSE}>True/False</SelectItem>
                          <SelectItem value={QuestionType.MULTIPLE_RESPONSE}>Multiple Response</SelectItem>
                          <SelectItem value={QuestionType.SHORT_ANSWER}>Short Answer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveQuestion(index)}
                        disabled={localContent.questions.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <Label className="mb-2 block">Question Text</Label>
                    <RichTextEditor
                      content={question.text}
                      onChange={(text) => {
                        // Update both the question text and the content text
                        handleQuestionChange(index, { 
                          text,
                          content: {
                            ...question.content,
                            text
                          }
                        });
                      }}
                      placeholder="Question text"
                      minHeight="60px"
                      simple={true}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {index === currentQuestionIndex ? (
                      <p>Currently editing this question. Use the question type selector to change the question format.</p>
                    ) : (
                      <p>Click to edit this question</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddQuestion}
              className="mt-3"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Question
            </Button>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Note: Each question will need to be configured separately in the question bank.
            </p>
          </div>

          <div className="mb-4">
            <Label htmlFor="explanation" className="mb-2 block">Explanation (Optional)</Label>
            <RichTextEditor
              content={localContent.explanation || ''}
              onChange={handleExplanationChange}
              placeholder="Provide an explanation for the reading passage"
              minHeight="100px"
              simple={true}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="hint" className="mb-2 block">Hint (Optional)</Label>
            <RichTextEditor
              content={localContent.hint || ''}
              onChange={handleHintChange}
              placeholder="Provide a hint for students"
              minHeight="100px"
              simple={true}
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Media (Optional)</Label>
            <MediaSelector
              media={localContent.media ? 
                {
                  type: localContent.media.type as 'image' | 'video' | 'audio',
                  url: localContent.media.url || '',
                  alt: localContent.media.alt,
                  caption: localContent.media.caption
                } : undefined
              }
              onChange={handleMediaChange}
              allowedTypes={['image', 'video', 'audio']}
              enableJinaAI={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReadingEditor;
