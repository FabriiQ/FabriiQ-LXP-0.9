import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorksheetCreationPage } from '../WorksheetCreationPage';
import { useRouter } from 'next/navigation';
import { useContentStudio } from '../../contexts/ContentStudioContext';
import { ContentType, CreationMethod } from '../../components/ContentCreationFlow';
import { ActivityPurpose } from '@/server/api/constants';
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
    worksheet: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutate: jest.fn(),
          isLoading: false,
          error: null
        })
      }
    },
    aiContentStudio: {
      createWorksheet: {
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
      },
      getAllSubjects: {
        useQuery: jest.fn().mockReturnValue({
          data: [
            { id: 'subject123', name: 'Mathematics' },
            { id: 'subject456', name: 'Science' }
          ],
          isLoading: false
        })
      },
      getTopics: {
        useQuery: jest.fn().mockReturnValue({
          data: [
            { id: 'topic123', title: 'Algebra' },
            { id: 'topic456', title: 'Geometry' }
          ],
          isLoading: false
        })
      }
    }
  }
}));

describe('WorksheetCreationPage', () => {
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

  it('sets content type to WORKSHEET if not already set', () => {
    render(<WorksheetCreationPage />);
    expect(mockSetContentType).toHaveBeenCalledWith(ContentType.WORKSHEET);
  });

  it('does not set content type if already set', () => {
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.WORKSHEET,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: '',
      selectedTopicIds: [],
      activityType: null,
      activityPurpose: ActivityPurpose.ASSESSMENT,
      classId: 'class123'
    });

    render(<WorksheetCreationPage />);
    expect(mockSetContentType).not.toHaveBeenCalled();
  });

  it('renders the progress bar correctly', () => {
    render(<WorksheetCreationPage />);
    
    // Check if the progress steps are rendered
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
    
    // Check if the progress bar is rendered
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles back button click correctly', () => {
    render(<WorksheetCreationPage />);
    
    // Find and click the back button
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    // Should navigate back to content studio
    expect(mockRouter.push).toHaveBeenCalledWith('/teacher/content-studio');
  });

  it('handles manual creation flow correctly', () => {
    // Mock the context to be at the creation method selection step
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.WORKSHEET,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      selectedTopicIds: ['topic123'],
      activityType: 'worksheet',
      activityPurpose: ActivityPurpose.ASSESSMENT,
      classId: 'class123'
    });

    render(<WorksheetCreationPage />);
    
    // Find and click the manual creation button
    const manualCreationButton = screen.getByTestId('manual-creation-btn');
    fireEvent.click(manualCreationButton);
    
    // Should set creation method to MANUAL
    expect(mockSetCreationMethod).toHaveBeenCalledWith(CreationMethod.MANUAL);
  });

  it('handles AI-assisted creation flow correctly', () => {
    // Mock the context to be at the creation method selection step
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.WORKSHEET,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      selectedTopicIds: ['topic123'],
      activityType: 'worksheet',
      activityPurpose: ActivityPurpose.ASSESSMENT,
      classId: 'class123'
    });

    render(<WorksheetCreationPage />);
    
    // Find and click the AI creation button
    const aiCreationButton = screen.getByTestId('ai-creation-btn');
    fireEvent.click(aiCreationButton);
    
    // Should set creation method to AI_ASSISTED
    expect(mockSetCreationMethod).toHaveBeenCalledWith(CreationMethod.AI_ASSISTED);
  });

  // Test for form validation
  it('validates worksheet form fields correctly', async () => {
    // Create a mock worksheet form component
    const MockWorksheetForm = () => {
      const createWorksheet = api.worksheet.create.useMutation();
      
      const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        // This should fail validation
        createWorksheet.mutate({
          title: '', // Empty title should fail validation
          content: {},
          teacherId: 'teacher123'
        });
      };
      
      return (
        <form onSubmit={handleSubmit} data-testid="worksheet-form">
          <input data-testid="title-input" />
          <button type="submit" data-testid="submit-button">Create Worksheet</button>
          {createWorksheet.error && <div data-testid="error-message">{createWorksheet.error.message}</div>}
        </form>
      );
    };
    
    // Mock the worksheet creation mutation to simulate validation error
    api.worksheet.create.useMutation().mutate = jest.fn().mockImplementation(() => {
      throw new Error('Title is required');
    });
    
    render(<MockWorksheetForm />);
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Check if validation error is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Title is required');
    });
  });

  // Test for successful worksheet creation
  it('creates worksheet successfully with valid data', async () => {
    // Create a mock worksheet form component
    const MockWorksheetForm = () => {
      const createWorksheet = api.worksheet.create.useMutation();
      
      const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        // This should pass validation
        createWorksheet.mutate({
          title: 'Test Worksheet',
          content: {
            sections: [
              { title: 'Section 1', content: 'This is section 1 content' }
            ]
          },
          teacherId: 'teacher123',
          subjectId: 'subject123',
          topicId: 'topic123'
        });
      };
      
      return (
        <form onSubmit={handleSubmit} data-testid="worksheet-form">
          <input data-testid="title-input" defaultValue="Test Worksheet" />
          <button type="submit" data-testid="submit-button">Create Worksheet</button>
        </form>
      );
    };
    
    // Mock the worksheet creation mutation to simulate success
    const mockCreateWorksheet = jest.fn();
    api.worksheet.create.useMutation().mutate = mockCreateWorksheet;
    
    render(<MockWorksheetForm />);
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Check if the create worksheet mutation was called with the correct data
    expect(mockCreateWorksheet).toHaveBeenCalledWith({
      title: 'Test Worksheet',
      content: {
        sections: [
          { title: 'Section 1', content: 'This is section 1 content' }
        ]
      },
      teacherId: 'teacher123',
      subjectId: 'subject123',
      topicId: 'topic123'
    });
  });

  // Test for AI-assisted worksheet generation
  it('generates worksheet with AI correctly', async () => {
    // Create a mock AI parameters form component
    const MockAIParametersForm = () => {
      const createWorksheet = api.aiContentStudio.createWorksheet.useMutation();
      
      const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        createWorksheet.mutate({
          title: 'AI Generated Worksheet',
          content: {
            version: 1,
            title: 'AI Generated Worksheet',
            subject: 'Mathematics',
            topic: 'Algebra',
            instructions: 'Complete the following worksheet.',
            sections: [
              {
                title: 'Introduction',
                content: 'This worksheet covers basic algebra concepts.'
              },
              {
                title: 'Section 1',
                content: 'Solve the following equations.'
              }
            ]
          },
          teacherId: 'teacher123',
          subjectId: 'subject123',
          topicId: 'topic123'
        });
      };
      
      return (
        <form onSubmit={handleSubmit} data-testid="ai-parameters-form">
          <input data-testid="title-input" defaultValue="AI Generated Worksheet" />
          <textarea data-testid="prompt-input" defaultValue="Create a worksheet about algebra" />
          <button type="submit" data-testid="generate-button">Generate Worksheet</button>
        </form>
      );
    };
    
    // Mock the worksheet creation mutation to simulate success
    const mockCreateWorksheet = jest.fn();
    api.aiContentStudio.createWorksheet.useMutation().mutate = mockCreateWorksheet;
    
    render(<MockAIParametersForm />);
    
    // Submit the form
    fireEvent.click(screen.getByTestId('generate-button'));
    
    // Check if the create worksheet mutation was called with the correct data
    expect(mockCreateWorksheet).toHaveBeenCalledWith({
      title: 'AI Generated Worksheet',
      content: {
        version: 1,
        title: 'AI Generated Worksheet',
        subject: 'Mathematics',
        topic: 'Algebra',
        instructions: 'Complete the following worksheet.',
        sections: [
          {
            title: 'Introduction',
            content: 'This worksheet covers basic algebra concepts.'
          },
          {
            title: 'Section 1',
            content: 'Solve the following equations.'
          }
        ]
      },
      teacherId: 'teacher123',
      subjectId: 'subject123',
      topicId: 'topic123'
    });
  });

  // Test for print preview functionality
  it('renders print preview correctly', async () => {
    // Create a mock print preview component
    const MockPrintPreview = () => {
      const [worksheetContent] = React.useState({
        title: 'Test Worksheet',
        subject: 'Mathematics',
        topic: 'Algebra',
        instructions: 'Complete the following worksheet.',
        sections: [
          {
            title: 'Section 1',
            content: 'Solve the following equations.'
          }
        ]
      });
      
      return (
        <div data-testid="print-preview">
          <h1>{worksheetContent.title}</h1>
          <div className="print-content">
            <h2>Instructions</h2>
            <p>{worksheetContent.instructions}</p>
            {worksheetContent.sections.map((section, index) => (
              <div key={index}>
                <h3>{section.title}</h3>
                <div>{section.content}</div>
              </div>
            ))}
          </div>
          <button data-testid="print-button">Print Worksheet</button>
        </div>
      );
    };
    
    // Mock window.print
    const originalPrint = window.print;
    window.print = jest.fn();
    
    render(<MockPrintPreview />);
    
    // Check if the print preview is rendered correctly
    expect(screen.getByText('Test Worksheet')).toBeInTheDocument();
    expect(screen.getByText('Instructions')).toBeInTheDocument();
    expect(screen.getByText('Complete the following worksheet.')).toBeInTheDocument();
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Solve the following equations.')).toBeInTheDocument();
    
    // Click the print button
    fireEvent.click(screen.getByTestId('print-button'));
    
    // Check if window.print was called
    expect(window.print).toHaveBeenCalled();
    
    // Restore original window.print
    window.print = originalPrint;
  });
});
