'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Clock, Video, Eye, Edit } from 'lucide-react';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import { RichTextDisplay } from '@/features/activties/components/ui/RichTextDisplay';
import { VideoContent, VideoQuestion, QuestionType } from '../../models/types';
import { generateId } from '@/features/activties/models/base';
import { extractYouTubeVideoId } from '@/features/activties/models/video';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VideoEditorProps {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
}

/**
 * Video Question Editor for Question Bank
 * 
 * This component provides an interface for creating and editing
 * video questions with:
 * - Video URL configuration
 * - Timestamped questions management
 * - Explanation and hint fields
 */
export const VideoEditor: React.FC<VideoEditorProps> = ({
  content,
  onChange
}) => {
  // Initialize with default content if empty
  const [localContent, setLocalContent] = useState<VideoContent>(
    content.videoUrl ? content : {
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      questions: [
        {
          id: generateId(),
          text: 'What is happening at this point in the video?',
          type: QuestionType.MULTIPLE_CHOICE,
          content: {
            text: 'What is happening at this point in the video?',
            options: [
              { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
              { id: generateId(), text: 'Option 2', isCorrect: false, feedback: 'Incorrect.' },
              { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
              { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
            ]
          },
          timestamp: 30
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

  // Extract YouTube video ID
  const youtubeVideoId = extractYouTubeVideoId(localContent.videoUrl);

  // Update the local content and call onChange
  const updateContent = (updates: Partial<VideoContent>) => {
    const updatedContent = { ...localContent, ...updates };
    setLocalContent(updatedContent);
    onChange(updatedContent);
  };

  // Handle video URL change
  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateContent({ videoUrl: e.target.value });
  };

  // Handle explanation change
  const handleExplanationChange = (explanation: string) => {
    updateContent({ explanation });
  };

  // Handle hint change
  const handleHintChange = (hint: string) => {
    updateContent({ hint });
  };

  // Handle question change
  const handleQuestionChange = (questionIndex: number, updates: Partial<VideoQuestion>) => {
    const newQuestions = [...localContent.questions];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      ...updates
    };
    updateContent({ questions: newQuestions });
  };

  // Format timestamp to MM:SS
  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Parse timestamp from MM:SS to seconds
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60 + seconds;
      }
    }
    return 0;
  };

  // Handle timestamp change
  const handleTimestampChange = (questionIndex: number, timestampStr: string) => {
    const timestamp = parseTimestamp(timestampStr);
    handleQuestionChange(questionIndex, { timestamp });
  };

  // Add a new question
  const handleAddQuestion = () => {
    const newQuestion: VideoQuestion = {
      id: generateId(),
      text: 'New question about the video',
      type: QuestionType.MULTIPLE_CHOICE,
      content: {
        text: 'New question about the video',
        options: [
          { id: generateId(), text: 'Option 1', isCorrect: true, feedback: 'Correct!' },
          { id: generateId(), text: 'Option 2', isCorrect: false, feedback: 'Incorrect.' },
          { id: generateId(), text: 'Option 3', isCorrect: false, feedback: 'Incorrect.' },
          { id: generateId(), text: 'Option 4', isCorrect: false, feedback: 'Incorrect.' }
        ]
      },
      timestamp: 60 // Default to 1 minute
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
              <Label htmlFor="videoUrl" className="text-lg font-medium flex items-center">
                <Video className="h-5 w-5 mr-2 text-primary-green" />
                Video URL
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
              <div className="aspect-video rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                {youtubeVideoId ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video preview"
                    className="w-full aspect-video"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">Invalid YouTube URL</p>
                  </div>
                )}
              </div>
            ) : (
              <Input
                id="videoUrl"
                type="text"
                value={localContent.videoUrl}
                onChange={handleVideoUrlChange}
                placeholder="Enter YouTube video URL"
                className="w-full"
              />
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Currently only YouTube videos are supported. Enter a valid YouTube URL.
            </p>
          </div>

          <div className="mb-4">
            <Label className="text-lg font-medium mb-2 block">Timestamped Questions</Label>
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
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatTimestamp(question.timestamp)}
                      </span>
                    </div>
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
                    <Label className="mb-2 block">Timestamp (MM:SS)</Label>
                    <Input
                      type="text"
                      value={formatTimestamp(question.timestamp)}
                      onChange={(e) => handleTimestampChange(index, e.target.value)}
                      placeholder="00:00"
                      className="w-full"
                    />
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
              placeholder="Provide an explanation for the video"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoEditor;
