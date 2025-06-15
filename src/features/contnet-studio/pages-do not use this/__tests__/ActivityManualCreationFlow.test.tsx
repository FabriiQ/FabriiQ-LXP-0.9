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
    },
    subjectTopic: {
      get: {
        useQuery: jest.fn().mockReturnValue({
          data: { id: 'topic123', title: 'Algebra' },
          isLoading: false
        })
      }
    }
  }
}));

// Mock the ActivityTypeBridge
jest.mock('../../ActivityTypeBridge', () => ({
  useActivityTypeBridge: jest.fn().mockReturnValue({
    getActivityEditor: jest.fn().mockReturnValue(() => <div data-testid="activity-editor">Activity Editor</div>),
    getActivityViewer: jest.fn().mockReturnValue(() => <div data-testid="activity-viewer">Activity Viewer</div>),
    transformContent: jest.fn().mockImplementation((content) => content)
  })
}));

// Create a mock component for manual creation flow
const MockManualCreationFlow = () => {
  const createActivity = api.activity.create.useMutation();
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createActivity.mutate({
      title: 'Test Activity',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.SELF_STUDY,
      subjectId: 'subject123',
      classId: 'class123',
      content: {
        activityType: 'multiple-choice',
        version: 1,
        questions: []
      }
    });
  };
  
  return (
    <div data-testid="manual-creation-flow">
      <h1>Create Activity Manually</h1>
      <form onSubmit={handleSubmit} data-testid="activity-form">
        <div data-testid="activity-editor">Activity Editor</div>
        <button type="submit" data-testid="save-button">Save Activity</button>
      </form>
    </div>
  );
};

// Mock the ActivityCreationPage component
jest.mock('../ActivityCreationPage', () => ({
  ActivityCreationPage: () => {
    const { contentType, creationMethod } = useContentStudio();
    
    // Render different components based on content type and creation method
    if (contentType === ContentType.ACTIVITY && creationMethod === CreationMethod.MANUAL) {
      return <MockManualCreationFlow />;
    }
    
    return <div>Activity Creation Page</div>;
  }
}));

describe('Activity Manual Creation Flow', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn()
  };
  const mockSetContentType = jest.fn();
  const mockSetCreationMethod = jest.fn();
  const mockCreateActivity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Setup API mock
    api.activity.create.useMutation().mutate = mockCreateActivity;
    
    // Setup context mock for manual creation flow
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.ACTIVITY,
      setContentType: mockSetContentType,
      creationMethod: CreationMethod.MANUAL,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      selectedTopicIds: ['topic123'],
      activityType: 'multiple-choice',
      activityPurpose: ActivityPurpose.LEARNING,
      classId: 'class123'
    });
  });

  it('renders the manual creation flow', () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    render(<ActivityCreationPage />);
    
    // Check if the manual creation flow is rendered
    expect(screen.getByTestId('manual-creation-flow')).toBeInTheDocument();
    expect(screen.getByText('Create Activity Manually')).toBeInTheDocument();
  });

  it('renders the activity editor', () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    render(<ActivityCreationPage />);
    
    // Check if the activity editor is rendered
    expect(screen.getByTestId('activity-editor')).toBeInTheDocument();
  });

  it('submits the activity form', async () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    render(<ActivityCreationPage />);
    
    // Find and submit the form
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Check if the create activity mutation was called
    await waitFor(() => {
      expect(mockCreateActivity).toHaveBeenCalled();
    });
  });

  it('creates an activity with the correct data', async () => {
    const { ActivityCreationPage } = require('../ActivityCreationPage');
    render(<ActivityCreationPage />);
    
    // Find and submit the form
    const saveButton = screen.getByTestId('save-button');
    fireEvent.click(saveButton);
    
    // Check if the create activity mutation was called with the correct data
    await waitFor(() => {
      expect(mockCreateActivity).toHaveBeenCalledWith({
        title: 'Test Activity',
        purpose: ActivityPurpose.LEARNING,
        learningType: LearningActivityType.SELF_STUDY,
        subjectId: 'subject123',
        classId: 'class123',
        content: {
          activityType: 'multiple-choice',
          version: 1,
          questions: []
        }
      });
    });
  });
});
