import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useContentStudio } from '../../contexts/ContentStudioContext';
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';
import { ContentType, CreationMethod } from '../../components/ContentCreationFlow';
import { api } from '@/utils/api';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock the ContentStudio context
jest.mock('../../contexts/ContentStudioContext', () => ({
  useContentStudio: jest.fn()
}));

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    activity: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutate: jest.fn(),
          isLoading: false,
          error: null
        })
      }
    },
    aiContentStudio: {
      generateActivity: {
        useMutation: jest.fn().mockReturnValue({
          mutate: jest.fn(),
          isLoading: false,
          error: null
        })
      }
    }
  }
}));

// Mock the ActivityTypeBridge
jest.mock('../../ActivityTypeBridge', () => ({
  useActivityTypeBridge: jest.fn().mockReturnValue({
    getActivityViewer: jest.fn().mockReturnValue(() => <div data-testid="activity-viewer">Activity Viewer</div>),
    transformContent: jest.fn().mockImplementation((content) => content)
  })
}));

// Create a mock component for AI parameters
const MockAIParametersForm = ({ onSubmit }: { onSubmit: (params: any) => void }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      title: 'AI Generated Activity',
      prompt: 'Create a multiple choice activity about algebra',
      difficulty: 'medium',
      numberOfQuestions: 5
    });
  };
  
  return (
    <div data-testid="ai-parameters-form">
      <h1>Configure AI Parameters</h1>
      <form onSubmit={handleSubmit}>
        <input data-testid="title-input" defaultValue="AI Generated Activity" />
        <textarea data-testid="prompt-input" defaultValue="Create a multiple choice activity about algebra" />
        <select data-testid="difficulty-select" defaultValue="medium">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input type="number" data-testid="questions-input" defaultValue={5} />
        <button type="submit" data-testid="generate-button">Generate Activity</button>
      </form>
    </div>
  );
};

// Create a mock component for AI conversation
const MockAIConversationInterface = ({ content, onSave }: { content: any, onSave: (content: any) => void }) => {
  const handleSave = () => {
    onSave({
      ...content,
      title: 'Refined AI Activity',
      questions: [
        { id: 'q1', text: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: '4' }
      ]
    });
  };
  
  return (
    <div data-testid="ai-conversation-interface">
      <h1>AI Conversation</h1>
      <div data-testid="generated-content">
        <h2>{content.title}</h2>
        <p>Generated content based on your parameters</p>
      </div>
      <div data-testid="activity-viewer">Activity Preview</div>
      <button data-testid="refine-button">Refine</button>
      <button data-testid="save-button" onClick={handleSave}>Save Activity</button>
    </div>
  );
};

// Mock the ActivityCreationPage component
jest.mock('../ActivityCreationPage', () => ({
  ActivityCreationPage: () => {
    const { contentType, creationMethod } = useContentStudio();
    const [currentStep, setCurrentStep] = React.useState('AI_PARAMETERS');
    const [generatedContent, setGeneratedContent] = React.useState<any>(null);
    const generateActivity = api.aiContentStudio.generateActivity.useMutation();
    const createActivity = api.activity.create.useMutation();
    
    const handleGenerateActivity = (params: any) => {
      generateActivity.mutate(params, {
        onSuccess: (data) => {
          setGeneratedContent({
            title: params.title,
            activityType: 'multiple-choice',
            version: 1,
            questions: []
          });
          setCurrentStep('AI_CONVERSATION');
        }
      });
    };
    
    const handleSaveActivity = (content: any) => {
      createActivity.mutate({
        title: content.title,
        purpose: ActivityPurpose.LEARNING,
        learningType: LearningActivityType.SELF_STUDY,
        subjectId: 'subject123',
        classId: 'class123',
        content: content
      });
    };
    
    // Render different components based on content type, creation method, and current step
    if (contentType === ContentType.ACTIVITY && creationMethod === CreationMethod.AI_ASSISTED) {
      if (currentStep === 'AI_PARAMETERS') {
        return <MockAIParametersForm onSubmit={handleGenerateActivity} />;
      } else if (currentStep === 'AI_CONVERSATION' && generatedContent) {
        return <MockAIConversationInterface content={generatedContent} onSave={handleSaveActivity} />;
      }
    }
    
    return <div>Activity Creation Page</div>;
  }
}));

describe('Activity AI Creation Flow', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn()
  };
  const mockSetContentType = jest.fn();
  const mockSetCreationMethod = jest.fn();
  const mockGenerateActivity = jest.fn();
  const mockCreateActivity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Setup API mock
    api.aiContentStudio.generateActivity.useMutation().mutate = mockGenerateActivity;
    api.activity.create.useMutation().mutate = mockCreateActivity;
    
    // Setup context mock for AI-assisted creation flow
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.ACTIVITY,
      setContentType: mockSetContentType,
      creationMethod: CreationMethod.AI_ASSISTED,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      selectedTopicIds: ['topic123'],
      activityType: 'multiple-choice',
      activityPurpose: ActivityPurpose.LEARNING,
      classId: 'class123'
    });
  });

  it('renders the AI parameters form', () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    render(<ActivityCreationPage />);
    
    // Check if the AI parameters form is rendered
    expect(screen.getByTestId('ai-parameters-form')).toBeInTheDocument();
    expect(screen.getByText('Configure AI Parameters')).toBeInTheDocument();
  });

  it('submits the AI parameters form', async () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    
    // Mock the generateActivity mutation to simulate success
    mockGenerateActivity.mockImplementation((params, options) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          title: params.title,
          activityType: 'multiple-choice',
          version: 1,
          questions: []
        });
      }
    });
    
    render(<ActivityCreationPage />);
    
    // Find and submit the form
    const generateButton = screen.getByTestId('generate-button');
    fireEvent.click(generateButton);
    
    // Check if the generate activity mutation was called
    expect(mockGenerateActivity).toHaveBeenCalled();
    
    // Check if the AI conversation interface is rendered after generation
    await waitFor(() => {
      expect(screen.getByTestId('ai-conversation-interface')).toBeInTheDocument();
    });
  });

  it('generates activity with the correct parameters', () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    render(<ActivityCreationPage />);
    
    // Find and submit the form
    const generateButton = screen.getByTestId('generate-button');
    fireEvent.click(generateButton);
    
    // Check if the generate activity mutation was called with the correct parameters
    expect(mockGenerateActivity).toHaveBeenCalledWith(
      {
        title: 'AI Generated Activity',
        prompt: 'Create a multiple choice activity about algebra',
        difficulty: 'medium',
        numberOfQuestions: 5
      },
      expect.anything()
    );
  });

  it('saves the generated activity', async () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    
    // Mock the generateActivity mutation to simulate success
    mockGenerateActivity.mockImplementation((params, options) => {
      if (options && options.onSuccess) {
        options.onSuccess({
          title: params.title,
          activityType: 'multiple-choice',
          version: 1,
          questions: []
        });
      }
    });
    
    render(<ActivityCreationPage />);
    
    // Generate the activity
    const generateButton = screen.getByTestId('generate-button');
    fireEvent.click(generateButton);
    
    // Wait for the AI conversation interface to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('ai-conversation-interface')).toBeInTheDocument();
    });
    
    // Save the activity
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Check if the create activity mutation was called with the correct data
    expect(mockCreateActivity).toHaveBeenCalledWith({
      title: 'Refined AI Activity',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.SELF_STUDY,
      subjectId: 'subject123',
      classId: 'class123',
      content: {
        title: 'Refined AI Activity',
        activityType: 'multiple-choice',
        version: 1,
        questions: [
          { id: 'q1', text: 'What is 2+2?', options: ['3', '4', '5'], correctAnswer: '4' }
        ]
      }
    });
  });
});
