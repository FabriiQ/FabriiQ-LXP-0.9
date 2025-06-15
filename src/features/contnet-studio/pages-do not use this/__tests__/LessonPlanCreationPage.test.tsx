import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LessonPlanCreationPage } from '../LessonPlanCreationPage';
import { useRouter } from 'next/navigation';
import { useContentStudio } from '../../contexts/ContentStudioContext';
import { ContentType, CreationMethod } from '../../components/ContentCreationFlow';
import { ActivityPurpose } from '@/server/api/constants';
import { api } from '@/utils/api';
import { useSession } from 'next-auth/react';

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

// Mock the ClassSelector component
jest.mock('../../components/ClassSelector', () => ({
  ClassSelector: jest.fn(({ onClassSelect }) => (
    <div data-testid="class-selector">
      <button data-testid="select-class-btn" onClick={() => onClassSelect('class123')}>Select Class</button>
    </div>
  ))
}));

// Mock the SubjectSelector component
jest.mock('../../components/SubjectSelector', () => ({
  SubjectSelector: jest.fn(({ onSelect }) => (
    <div data-testid="subject-selector">
      <button data-testid="select-subject-btn" onClick={() => onSelect('subject123')}>Select Subject</button>
    </div>
  ))
}));

// Mock the HierarchicalTopicSelector component
jest.mock('../../components/HierarchicalTopicSelector', () => ({
  HierarchicalTopicSelector: jest.fn(({ onTopicsChange }) => (
    <div data-testid="topic-selector">
      <button data-testid="select-topics-btn" onClick={() => onTopicsChange(['topic123'], [])}>Select Topics</button>
    </div>
  ))
}));

// Mock the LearningObjectivesSelector component
jest.mock('../../components/LearningObjectivesSelector', () => ({
  LearningObjectivesSelector: jest.fn(({ onObjectivesChange }) => (
    <div data-testid="objectives-selector">
      <button data-testid="select-objectives-btn" onClick={() => onObjectivesChange(['objective123'])}>Select Objectives</button>
    </div>
  ))
}));

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    lessonPlan: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutate: jest.fn(),
          isLoading: false,
          error: null
        })
      }
    },
    user: {
      getById: {
        useQuery: jest.fn().mockReturnValue({
          data: { teacherProfile: { id: 'teacher123' } }
        })
      }
    }
  }
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));

describe('LessonPlanCreationPage', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn()
  };
  const mockSetContentType = jest.fn();
  const mockSetCreationMethod = jest.fn();
  const mockSetClassId = jest.fn();
  const mockSetSubjectId = jest.fn();
  const mockAddTopicId = jest.fn();
  const mockClearTopicIds = jest.fn();
  const mockAddLearningObjectiveId = jest.fn();
  const mockClearLearningObjectiveIds = jest.fn();
  const mockCreateLessonPlan = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Setup session mock
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated'
    });
    
    // Setup context mock with default values
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: null,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: '',
      setSubjectId: mockSetSubjectId,
      selectedTopicIds: [],
      addTopicId: mockAddTopicId,
      clearTopicIds: mockClearTopicIds,
      selectedLearningObjectiveIds: [],
      addLearningObjectiveId: mockAddLearningObjectiveId,
      clearLearningObjectiveIds: mockClearLearningObjectiveIds,
      activityType: null,
      activityPurpose: ActivityPurpose.LEARNING,
      classId: '',
      setClassId: mockSetClassId
    });
    
    // Setup API mock
    api.lessonPlan.create.useMutation().mutate = mockCreateLessonPlan;
  });

  it('sets content type to LESSON_PLAN if not already set', () => {
    render(<LessonPlanCreationPage />);
    expect(mockSetContentType).toHaveBeenCalledWith(ContentType.LESSON_PLAN);
  });

  it('does not set content type if already set', () => {
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.LESSON_PLAN,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: '',
      setSubjectId: mockSetSubjectId,
      selectedTopicIds: [],
      addTopicId: mockAddTopicId,
      clearTopicIds: mockClearTopicIds,
      selectedLearningObjectiveIds: [],
      addLearningObjectiveId: mockAddLearningObjectiveId,
      clearLearningObjectiveIds: mockClearLearningObjectiveIds,
      activityType: null,
      activityPurpose: ActivityPurpose.LEARNING,
      classId: '',
      setClassId: mockSetClassId
    });

    render(<LessonPlanCreationPage />);
    expect(mockSetContentType).not.toHaveBeenCalled();
  });

  it('renders the progress bar correctly', () => {
    render(<LessonPlanCreationPage />);
    
    // Check if the progress steps are rendered
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    
    // Check if the progress bar is rendered
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles back button click correctly', () => {
    render(<LessonPlanCreationPage />);
    
    // Find and click the back button
    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);
    
    // Should navigate back to content studio
    expect(mockRouter.push).toHaveBeenCalledWith('/teacher/content-studio');
  });

  it('handles class selection correctly', () => {
    render(<LessonPlanCreationPage />);
    
    // Find and click the select class button
    const selectClassButton = screen.getByTestId('select-class-btn');
    fireEvent.click(selectClassButton);
    
    // Should set the class ID
    expect(mockSetClassId).toHaveBeenCalledWith('class123');
  });

  it('handles subject selection correctly', () => {
    // Mock the context to be at the subject selection step
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.LESSON_PLAN,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: '',
      setSubjectId: mockSetSubjectId,
      selectedTopicIds: [],
      addTopicId: mockAddTopicId,
      clearTopicIds: mockClearTopicIds,
      selectedLearningObjectiveIds: [],
      addLearningObjectiveId: mockAddLearningObjectiveId,
      clearLearningObjectiveIds: mockClearLearningObjectiveIds,
      activityType: null,
      activityPurpose: ActivityPurpose.LEARNING,
      classId: 'class123',
      setClassId: mockSetClassId
    });
    
    // Create a component with a state spy to track step changes
    const StepSpy = () => {
      const [currentStep, setCurrentStep] = React.useState('CLASS_SELECTION');
      
      // Override the useContentStudio mock to capture step changes
      (useContentStudio as jest.Mock).mockReturnValue({
        contentType: ContentType.LESSON_PLAN,
        setContentType: mockSetContentType,
        creationMethod: null,
        setCreationMethod: mockSetCreationMethod,
        subjectId: '',
        setSubjectId: (id: string) => {
          mockSetSubjectId(id);
          setCurrentStep('TOPIC_SELECTION');
        },
        selectedTopicIds: [],
        addTopicId: mockAddTopicId,
        clearTopicIds: mockClearTopicIds,
        selectedLearningObjectiveIds: [],
        addLearningObjectiveId: mockAddLearningObjectiveId,
        clearLearningObjectiveIds: mockClearLearningObjectiveIds,
        activityType: null,
        activityPurpose: ActivityPurpose.LEARNING,
        classId: 'class123',
        setClassId: (id: string) => {
          mockSetClassId(id);
          setCurrentStep('SUBJECT_SELECTION');
        }
      });
      
      return (
        <div>
          <LessonPlanCreationPage />
          <div data-testid="current-step">{currentStep}</div>
        </div>
      );
    };
    
    render(<StepSpy />);
    
    // Click select class button to move to subject selection
    const selectClassButton = screen.getByTestId('select-class-btn');
    fireEvent.click(selectClassButton);
    
    // Step should change to SUBJECT_SELECTION
    expect(screen.getByTestId('current-step').textContent).toBe('SUBJECT_SELECTION');
    
    // Click select subject button to move to topic selection
    const selectSubjectButton = screen.getByTestId('select-subject-btn');
    fireEvent.click(selectSubjectButton);
    
    // Step should change to TOPIC_SELECTION
    expect(screen.getByTestId('current-step').textContent).toBe('TOPIC_SELECTION');
  });

  it('handles manual creation flow correctly', () => {
    // Mock the context to be at the creation method selection step
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.LESSON_PLAN,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      setSubjectId: mockSetSubjectId,
      selectedTopicIds: ['topic123'],
      addTopicId: mockAddTopicId,
      clearTopicIds: mockClearTopicIds,
      selectedLearningObjectiveIds: ['objective123'],
      addLearningObjectiveId: mockAddLearningObjectiveId,
      clearLearningObjectiveIds: mockClearLearningObjectiveIds,
      activityType: null,
      activityPurpose: ActivityPurpose.LEARNING,
      classId: 'class123',
      setClassId: mockSetClassId
    });

    render(<LessonPlanCreationPage />);
    
    // Find and click the manual creation button
    const manualCreationButton = screen.getByTestId('manual-creation-btn');
    fireEvent.click(manualCreationButton);
    
    // Should set creation method to MANUAL
    expect(mockSetCreationMethod).toHaveBeenCalledWith(CreationMethod.MANUAL);
  });

  it('handles AI-assisted creation flow correctly', () => {
    // Mock the context to be at the creation method selection step
    (useContentStudio as jest.Mock).mockReturnValue({
      contentType: ContentType.LESSON_PLAN,
      setContentType: mockSetContentType,
      creationMethod: null,
      setCreationMethod: mockSetCreationMethod,
      subjectId: 'subject123',
      setSubjectId: mockSetSubjectId,
      selectedTopicIds: ['topic123'],
      addTopicId: mockAddTopicId,
      clearTopicIds: mockClearTopicIds,
      selectedLearningObjectiveIds: ['objective123'],
      addLearningObjectiveId: mockAddLearningObjectiveId,
      clearLearningObjectiveIds: mockClearLearningObjectiveIds,
      activityType: null,
      activityPurpose: ActivityPurpose.LEARNING,
      classId: 'class123',
      setClassId: mockSetClassId
    });

    render(<LessonPlanCreationPage />);
    
    // Find and click the AI creation button
    const aiCreationButton = screen.getByTestId('ai-creation-btn');
    fireEvent.click(aiCreationButton);
    
    // Should set creation method to AI_ASSISTED
    expect(mockSetCreationMethod).toHaveBeenCalledWith(CreationMethod.AI_ASSISTED);
  });
});
