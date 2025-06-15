'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { QuestionType, DifficultyLevel } from '../../models/types';
import { Loader2 } from 'lucide-react';
import { CreateQuestionInput, Question, QuestionContent, generateId } from '../../models/types';

// Import specific editors
import { MultipleChoiceEditor } from './MultipleChoiceEditor';
import { TrueFalseEditor } from './TrueFalseEditor';
import { MultipleResponseEditor } from './MultipleResponseEditor';
import { FillInTheBlanksEditor } from './FillInTheBlanksEditor';
import { MatchingEditor } from './MatchingEditor';
import { DragAndDropEditor } from './DragAndDropEditor';
import { DragTheWordsEditor } from './DragTheWordsEditor';
import { NumericEditor } from './NumericEditor';
import { SequenceEditor } from './SequenceEditor';
import { FlashCardsEditor } from './FlashCardsEditor';
import { ReadingEditor } from './ReadingEditor';
import { VideoEditor } from './VideoEditor';
import { ShortAnswerEditor } from './ShortAnswerEditor';
import { EssayEditor } from './EssayEditor';

interface QuestionEditorProps {
  initialQuestion?: Partial<Question>;
  questionBankId: string;
  onSave?: (question: Question) => void;
  onCancel?: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  initialQuestion,
  questionBankId,
  onSave,
  onCancel,
}) => {
  const [question, setQuestion] = useState<Partial<CreateQuestionInput>>({
    questionBankId,
    title: initialQuestion?.title || 'New Question',
    questionType: initialQuestion?.questionType || QuestionType.MULTIPLE_CHOICE,
    difficulty: initialQuestion?.difficulty || DifficultyLevel.MEDIUM,
    content: initialQuestion?.content || {} as QuestionContent,
    subjectId: initialQuestion?.subjectId || '',
    courseId: initialQuestion?.courseId || undefined,
    topicId: initialQuestion?.topicId || undefined,
    gradeLevel: initialQuestion?.gradeLevel || undefined,
    year: initialQuestion?.year || undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  // Fetch subjects for dropdown
  const { data: subjects, isLoading: isLoadingSubjects } = api.subject.list.useQuery({});

  // Fetch courses for dropdown
  const { data: courses, isLoading: isLoadingCourses } = api.course.list.useQuery({});

  // Fetch topics based on selected subject
  const { data: topics, isLoading: isLoadingTopics } = api.subjectTopic.list.useQuery(
    { subjectId: question.subjectId || '' },
    { enabled: !!question.subjectId }
  );

  // Create question mutation
  const createQuestion = api.questionBank.createQuestion.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Question created',
        description: 'The question has been created successfully.',
      });
      if (onSave) onSave({
        ...data,
        content: data.content as unknown as QuestionContent
      } as Question);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create question',
        variant: 'error',
      });
      setIsLoading(false);
    },
  });

  // Update question mutation
  const updateQuestion = api.questionBank.updateQuestion.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Question updated',
        description: 'The question has been updated successfully.',
      });
      if (onSave) onSave({
        ...data,
        content: data.content as unknown as QuestionContent
      } as Question);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update question',
        variant: 'error',
      });
      setIsLoading(false);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!question.subjectId) {
      toast({
        title: 'Validation Error',
        description: 'Subject is required',
        variant: 'error',
      });
      setIsLoading(false);
      return;
    }

    // Properly type-cast content from JsonValue to QuestionContent
    const typedQuestion = {
      ...question,
      content: question.content as unknown as QuestionContent
    };

    if (initialQuestion?.id) {
      updateQuestion.mutate({
        id: initialQuestion.id,
        data: typedQuestion as CreateQuestionInput,
      });
    } else {
      createQuestion.mutate(typedQuestion as CreateQuestionInput);
    }
  };

  // Handle content changes from specific editors
  const handleContentChange = (content: QuestionContent) => {
    setQuestion((prev) => ({
      ...prev,
      content,
    }));
  };

  // Render the appropriate editor based on question type
  const renderEditor = () => {
    switch (question.questionType) {
      case QuestionType.MULTIPLE_CHOICE:
        return (
          <MultipleChoiceEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.TRUE_FALSE:
        return (
          <TrueFalseEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.MULTIPLE_RESPONSE:
        return (
          <MultipleResponseEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.FILL_IN_THE_BLANKS:
        return (
          <FillInTheBlanksEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.MATCHING:
        return (
          <MatchingEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.DRAG_AND_DROP:
        return (
          <DragAndDropEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.DRAG_THE_WORDS:
        return (
          <DragTheWordsEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.NUMERIC:
        return (
          <NumericEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.SEQUENCE:
        return (
          <SequenceEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.FLASH_CARDS:
        return (
          <FlashCardsEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.READING:
        return (
          <ReadingEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.VIDEO:
        return (
          <VideoEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.SHORT_ANSWER:
        return (
          <ShortAnswerEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      case QuestionType.ESSAY:
        return (
          <EssayEditor
            content={question.content as any}
            onChange={handleContentChange}
          />
        );
      default:
        return <div>Editor not implemented for this question type</div>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {initialQuestion?.id ? 'Edit Question' : 'Create Question'}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="content">Question Content</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={question.title}
                    onChange={(e) => setQuestion({ ...question, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="questionType">Question Type</Label>
                  <Select
                    value={question.questionType}
                    onValueChange={(value) => setQuestion({ ...question, questionType: value as QuestionType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(QuestionType).map((type) => (
                        <SelectItem key={type.toString()} value={type.toString()}>
                          {type.toString().replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={question.difficulty}
                    onValueChange={(value) => setQuestion({ ...question, difficulty: value as DifficultyLevel })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(DifficultyLevel).map((level) => (
                        <SelectItem key={level.toString()} value={level.toString()}>
                          {level.toString().replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={question.subjectId}
                    onValueChange={(value) => setQuestion({ ...question, subjectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.items?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="course">Course (Optional)</Label>
                  <Select
                    value={question.courseId}
                    onValueChange={(value) => setQuestion({ ...question, courseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {question.subjectId && (
                  <div>
                    <Label htmlFor="topic">Topic (Optional)</Label>
                    <Select
                      value={question.topicId}
                      onValueChange={(value) => setQuestion({ ...question, topicId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics?.data?.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="gradeLevel">Grade Level (Optional)</Label>
                  <Input
                    id="gradeLevel"
                    type="number"
                    min={1}
                    max={12}
                    value={question.gradeLevel || ''}
                    onChange={(e) => setQuestion({ ...question, gradeLevel: parseInt(e.target.value) || undefined })}
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year (Optional)</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 5}
                    value={question.year || ''}
                    onChange={(e) => setQuestion({ ...question, year: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content">
              {renderEditor()}
            </TabsContent>

            <TabsContent value="metadata">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sourceReference">Source Reference (Optional)</Label>
                  <Input
                    id="sourceReference"
                    value={question.sourceReference || ''}
                    onChange={(e) => setQuestion({ ...question, sourceReference: e.target.value })}
                    placeholder="e.g., Page 42, Chapter 3"
                  />
                </div>

                {/* Add more metadata fields as needed */}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialQuestion?.id ? 'Update' : 'Create'} Question
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
