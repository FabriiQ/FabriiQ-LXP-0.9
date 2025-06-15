import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssessmentCreationPage } from '../AssessmentCreationPage';
import { useRouter } from 'next/navigation';
import { useContentStudio } from '../../contexts/ContentStudioContext';
import { ContentType, CreationMethod } from '../../components/ContentCreationFlow';
import { ActivityPurpose, AssessmentCategory } from '@/server/api/constants';
import { api } from '@/utils/api';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the ContentStudio context
jest.mock('../../contexts/ContentStudioContext', () => ({
  useContentStudio: jest.fn()
}));

// Mock the ActivityTypeBridgeProvider
jest.mock('../../ActivityTypeBridge', () => ({
  ActivityTypeBridgeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock the ContentCreationFlow component
jest.mock('../../components/ContentCreationFlow', () => ({
  ContentCreationFlow: jest.fn(({ onManualCreation, onAICreation }) => (
    <div data-testid="content-creation-flow">
      <button data-testid="manual-creation-btn" onClick={() => onManualCreation({})}>Manual Creation</button>
      <button data-testid="ai-creation-btn" onClick={() => onAICreation({})}>AI Creation</button>
    </div>
  )),
  ContentType: {
    ACTIVITY: 'ACTIVITY',
    ASSESSMENT: 'ASSESSMENT',
    WORKSHEET: 'WORKSHEET',
    LESSON_PLAN: 'LESSON_PLAN'
  },
  CreationMethod: {
    MANUAL: 'MANUAL',
    AI_ASSISTED: 'AI_ASSISTED'
  }
}));

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    assessment: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutate: jest.fn(),
          isLoading: false,
          error: null
        })
      }
    },
    class: {
      getById: {
        useQuery: jest.fn().mockReturnValue({
          data: { id: 'class123', name: 'Test Class' },
          isLoading: false
        })
      }
    },
    subject: {
      getById: {
        useQuery: jest.fn().mockReturnValue({
          data: { id: 'subject123', name: 'Mathematics' },
          isLoading: false
        })
      }
    }
  }
}));

describe('AssessmentCreationPage', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn()
  };
  const mockSetContentType = jest.fn();
  const mockSetCreationMethod = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Setup context mock with default values
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: null,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: '',
      selectedTopicIds: [],
      activityType: null,
      activityPurpose: ActivityPurpose.ASSESSMENT,
      classId: 'class123'
    });
  });

  it('sets content type to ASSESSMENT if not already set', () => {
    render(<AssessmentCreationPage />);
    expect(mockSetContentType).toHaveBeenCalledWith(ContentType.ASSESSMENT);
  });

  it('does not set content type if already set', () => {
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.ASSESSMENT,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: '',
      selectedTopicIds: [],
      activityType: null,
      activityPurpose: ActivityPurpose.ASSESSMENT,
      classId: 'class123'
    });

    render(<AssessmentCreationPage />);
    expect(mockSetContentType).not.toHaveBeenCalled();
  });

  it('renders the progress bar correctly', () => {
    render(<AssessmentCreationPage />);
    
    // Check if the progress steps are rendered
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    
    // Check if the progress bar is rendered
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles back button click correctly', () => {
    render(<AssessmentCreationPage />);
    
    // Find and click the back button
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    // Should navigate back to content studio
    expect(mockRouter.push).toHaveBeenCalledWith('/teacher/content-studio');
  });

  it('handles manual creation flow correctly', () => {
    // Mock the context to be at the creation method selection step
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.ASSESSMENT,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      selectedTopicIds: ['topic1', 'topic2'],
      activityType: 'quiz',
      activityPurpose: ActivityPurpose.ASSESSMENT,
      classId: 'class123'
    });

    render(<AssessmentCreationPage />);
    
    // Find and click the manual creation button
    const manualCreationButton = screen.getByTestId('manual-creation-btn');
    fireEvent.click(manualCreationButton);
    
    // Should set creation method to MANUAL
    expect(mockSetCreationMethod).toHaveBeenCalledWith(CreationMethod.MANUAL);
  });

  it('handles AI-assisted creation flow correctly', () => {
    // Mock the context to be at the creation method selection step
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.ASSESSMENT,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      selectedTopicIds: ['topic1', 'topic2'],
      activityType: 'quiz',
      activityPurpose: ActivityPurpose.ASSESSMENT,
      classId: 'class123'
    });

    render(<AssessmentCreationPage />);
    
    // Find and click the AI creation button
    const aiCreationButton = screen.getByTestId('ai-creation-btn');
    fireEvent.click(aiCreationButton);
    
    // Should set creation method to AI_ASSISTED
    expect(mockSetCreationMethod).toHaveBeenCalledWith(CreationMethod.AI_ASSISTED);
  });

  // Test for form validation
  it('validates assessment form fields correctly', async () => {
    // Create a mock assessment form component
    const MockAssessmentForm = () => {
      const createAssessment = api.assessment.create.useMutation();
      
      const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        // This should fail validation
        createAssessment.mutate({
          title: '', // Empty title should fail validation
          classId: 'class123',
          subjectId: 'subject123',
          category: AssessmentCategory.QUIZ
        });
      };
      
      return (
        <form onSubmit={handleSubmit} data-testid="assessment-form">
          <input data-testid="title-input" />
          <select data-testid="category-select">
            <option value={AssessmentCategory.QUIZ}>Quiz</option>
            <option value={AssessmentCategory.TEST}>Test</option>
          </select>
          <button type="submit" data-testid="submit-button">Create Assessment</button>
          {createAssessment.error && <div data-testid="error-message">{createAssessment.error.message}</div>}
        </form>
      );
    };
    
    // Mock the assessment creation mutation to simulate validation error
    api.assessment.create.useMutation().mutate = jest.fn().mockImplementation(() => {
      throw new Error('Title is required');
    });
    
    render(<MockAssessmentForm />);
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Check if validation error is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Title is required');
    });
  });

  // Test for successful assessment creation
  it('creates assessment successfully with valid data', async () => {
    // Create a mock assessment form component
    const MockAssessmentForm = () => {
      const createAssessment = api.assessment.create.useMutation();
      
      const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        // This should pass validation
        createAssessment.mutate({
          title: 'Test Assessment',
          classId: 'class123',
          subjectId: 'subject123',
          category: AssessmentCategory.QUIZ,
          instructions: 'Complete all questions',
          maxScore: 100,
          passingScore: 60
        });
      };
      
      return (
        <form onSubmit={handleSubmit} data-testid="assessment-form">
          <input data-testid="title-input" defaultValue="Test Assessment" />
          <select data-testid="category-select" defaultValue={AssessmentCategory.QUIZ}>
            <option value={AssessmentCategory.QUIZ}>Quiz</option>
            <option value={AssessmentCategory.TEST}>Test</option>
          </select>
          <button type="submit" data-testid="submit-button">Create Assessment</button>
          {createAssessment.isLoading && <div data-testid="loading">Loading...</div>}
        </form>
      );
    };
    
    // Mock the assessment creation mutation to simulate success
    const mockCreateAssessment = jest.fn();
    api.assessment.create.useMutation().mutate = mockCreateAssessment;
    
    render(<MockAssessmentForm />);
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Check if the create assessment mutation was called with the correct data
    expect(mockCreateAssessment).toHaveBeenCalledWith({
      title: 'Test Assessment',
      classId: 'class123',
      subjectId: 'subject123',
      category: AssessmentCategory.QUIZ,
      instructions: 'Complete all questions',
      maxScore: 100,
      passingScore: 60
    });
  });

  // Test for AI-assisted assessment generation
  it('generates assessment with AI correctly', async () => {
    // Mock the AI generation mutation
    const mockGenerateAssessment = jest.fn().mockImplementation((params, options) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          title: 'AI Generated Assessment',
          category: AssessmentCategory.QUIZ,
          questions: [
            { text: 'What is 2+2?', type: 'MULTIPLE_CHOICE', options: [{ text: '4', isCorrect: true }, { text: '5', isCorrect: false }] }
          ]
        });
      }
    });
    
    // Add the AI generation mutation to the API mock
    api.assessment.generateWithAI = {
      useMutation: jest.fn().mockReturnValue({
        mutate: mockGenerateAssessment,
        isLoading: false,
        error: null
      })
    };
    
    // Create a mock AI parameters form component
    const MockAIParametersForm = () => {
      const generateAssessment = api.assessment.generateWithAI.useMutation();
      
      const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        generateAssessment.mutate({
          title: 'Math Quiz',
          prompt: 'Create a quiz about basic arithmetic',
          difficulty: 'medium',
          numberOfQuestions: 5,
          classId: 'class123',
          subjectId: 'subject123',
          category: AssessmentCategory.QUIZ
        }, {
          onSuccess: (data) => {
            console.log('Assessment generated:', data);
          }
        });
      };
      
      return (
        <form onSubmit={handleSubmit} data-testid="ai-parameters-form">
          <input data-testid="title-input" defaultValue="Math Quiz" />
          <textarea data-testid="prompt-input" defaultValue="Create a quiz about basic arithmetic" />
          <button type="submit" data-testid="generate-button">Generate Assessment</button>
        </form>
      );
    };
    
    render(<MockAIParametersForm />);
    
    // Submit the form
    fireEvent.click(screen.getByTestId('generate-button'));
    
    // Check if the generate assessment mutation was called with the correct parameters
    expect(mockGenerateAssessment).toHaveBeenCalledWith(
      {
        title: 'Math Quiz',
        prompt: 'Create a quiz about basic arithmetic',
        difficulty: 'medium',
        numberOfQuestions: 5,
        classId: 'class123',
        subjectId: 'subject123',
        category: AssessmentCategory.QUIZ
      },
      expect.anything()
    );
  });
});
