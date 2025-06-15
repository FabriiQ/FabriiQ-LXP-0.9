# Question Bank Integration Guide

This document provides guidance on integrating the Question Bank feature with other parts of the application.

## Integration Overview

The Question Bank feature is designed to be integrated with various parts of the application, particularly with activities and assessments. This guide explains how to integrate the Question Bank with other features.

## Integrating with Activities

### Adding Questions from Question Bank to Activities

To allow teachers to add questions from the Question Bank to activities, you can use the `QuestionBankSelector` component.

```tsx
import { QuestionBankSelector } from '@/features/activties/components/question-bank/QuestionBankSelector';

// Inside your component
const handleAddQuestionsFromBank = (questions: any[]) => {
  // Convert question bank questions to activity questions
  const activityQuestions = questions.map(bankQuestion => {
    // Store a reference to the original question for tracking usage
    const questionBankRef = bankQuestion.id;
    
    // Convert based on question type
    switch (bankQuestion.questionType) {
      case 'MULTIPLE_CHOICE':
        return {
          id: `activity-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'multiple-choice',
          text: bankQuestion.content.text,
          options: bankQuestion.content.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            feedback: opt.feedback
          })),
          explanation: bankQuestion.content.explanation,
          hint: bankQuestion.content.hint,
          questionBankRef, // Reference to the original question
        };
      // Add more conversions for other question types
      default:
        return {
          id: `activity-q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'multiple-choice',
          text: bankQuestion.title,
          options: [
            { id: 'opt1', text: 'Option 1', isCorrect: true },
            { id: 'opt2', text: 'Option 2', isCorrect: false },
          ],
          questionBankRef,
        };
    }
  });
  
  // Add the questions to your activity
  updateActivity({
    questions: [...activity.questions, ...activityQuestions]
  });
};

// In your render method
return (
  <div>
    {/* Other components */}
    <Dialog>
      <DialogTrigger>
        <Button>Add from Question Bank</Button>
      </DialogTrigger>
      <DialogContent>
        <QuestionBankSelector
          onSelectQuestions={handleAddQuestionsFromBank}
          subjectId={subjectId}
          courseId={courseId}
          classId={classId}
        />
      </DialogContent>
    </Dialog>
  </div>
);
```

### Tracking Question Usage in Activities

To track question usage when students answer questions in activities, you can use the `useQuestionUsage` hook.

```tsx
import { useQuestionUsage } from '@/features/question-bank/hooks';

// Inside your component
const { recordQuestionAnswer } = useQuestionUsage();

// When a student answers a question
const handleAnswerQuestion = (questionId: string, answer: any) => {
  // Get the question
  const question = questions.find(q => q.id === questionId);
  
  // If the question is from the question bank, record the usage
  if (question?.questionBankRef) {
    // Determine if the answer is correct
    let isCorrect = false;
    
    if (question.type === 'multiple-choice') {
      const correctOption = question.options?.find(opt => opt.isCorrect);
      isCorrect = answer === correctOption?.id;
    } else if (question.type === 'true-false') {
      isCorrect = answer === question.isTrue;
    }
    
    // Calculate time to answer
    const timeToAnswer = calculateTimeToAnswer(questionId);
    
    // Record the answer
    recordQuestionAnswer(
      question.questionBankRef,
      isCorrect,
      timeToAnswer,
      activityId,
      studentId,
      classId
    );
  }
};
```

## Integrating with Analytics

### Displaying Question Usage Analytics

To display analytics for question usage, you can use the `QuestionUsageAnalytics` component.

```tsx
import { QuestionUsageAnalytics } from '@/features/question-bank/components/analytics';

// Inside your component
return (
  <div>
    {/* Other components */}
    <QuestionUsageAnalytics questionId={questionId} />
  </div>
);
```

### Displaying Class Usage for Questions

To display class usage for questions, you can use the `QuestionClassUsage` component.

```tsx
import { QuestionClassUsage } from '@/features/question-bank/components/analytics';

// Inside your component
return (
  <div>
    {/* Other components */}
    <QuestionClassUsage questionId={questionId} />
  </div>
);
```

## Integrating with Question Detail View

To display comprehensive information about a question, including its usage analytics, you can use the `QuestionDetail` component.

```tsx
import { QuestionDetail } from '@/features/question-bank/components/viewer/QuestionDetail';

// Inside your component
return (
  <div>
    {/* Other components */}
    <QuestionDetail
      question={question}
      onBack={handleBack}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
    />
  </div>
);
```

## Integrating with Search and Filtering

To allow users to search and filter questions, you can use the question bank API endpoints.

```tsx
import { api } from '@/utils/api';

// Inside your component
const [searchTerm, setSearchTerm] = useState('');
const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');
const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

// Fetch questions with filters
const { data: questionsData, isLoading } = api.questionBank.getQuestions.useQuery({
  questionBankId,
  filters: {
    search: searchTerm || undefined,
    questionType: selectedQuestionType ? (selectedQuestionType as QuestionType) : undefined,
    difficulty: selectedDifficulty ? (selectedDifficulty as DifficultyLevel) : undefined,
    subjectId,
    courseId,
  },
  pagination: {
    page,
    pageSize,
  },
}, {
  enabled: !!questionBankId,
});

// In your render method
return (
  <div>
    <Input
      type="text"
      placeholder="Search questions..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <Select
      value={selectedQuestionType}
      onValueChange={setSelectedQuestionType}
    >
      <SelectTrigger>
        <SelectValue placeholder="All Types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Types</SelectItem>
        {Object.values(QuestionType).map((type) => (
          <SelectItem key={type} value={type}>
            {type.replace(/_/g, ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {/* Display questions */}
    {questionsData?.items.map((question) => (
      <div key={question.id}>
        {/* Question display */}
      </div>
    ))}
  </div>
);
```

## Best Practices for Integration

1. **Always Store References**: When adding questions from the question bank to activities, always store a reference to the original question using the `questionBankRef` property.

2. **Track Usage**: Always track question usage when students answer questions from the question bank.

3. **Show Usage Information**: When teachers select questions from the question bank, show them usage information to help them make informed decisions.

4. **Warn About Reuse**: Warn teachers when they select questions that have already been used in the current class.

5. **Provide Analytics**: Give teachers access to analytics about question usage and performance to help them improve their assessments.

6. **Respect Permissions**: Ensure that users can only access question banks and questions that they have permission to access.

7. **Handle Errors Gracefully**: Handle errors gracefully when integrating with the question bank, especially when fetching questions or recording usage.

8. **Optimize Performance**: Optimize performance by using pagination and filtering when fetching questions from the question bank.

9. **Maintain Type Safety**: Use TypeScript to maintain type safety when integrating with the question bank.

10. **Follow UI Guidelines**: Follow the application's UI guidelines when integrating question bank components.
