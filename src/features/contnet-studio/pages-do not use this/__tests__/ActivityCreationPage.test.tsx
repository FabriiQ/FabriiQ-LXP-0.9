import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Note: TypeScript errors in this file are suppressed using tsconfig.test.json
// This is a common approach for testing libraries that use DOM APIs
import { ActivityCreationPage } from '../ActivityCreationPage';
import { useRouter } from 'next/navigation';
import { useContentStudio } from '../../contexts/ContentStudioContext';
import { ContentType, CreationMethod } from '../../components/ContentCreationFlow';
import { ActivityPurpose } from '@/server/api/constants';

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
  ContentCreationFlow: () => <div>Content Creation Flow</div>,
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

describe('ActivityCreationPage', () => {
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
      activityPurpose: ActivityPurpose.LEARNING,
      classId: 'class123'
    });
  });

  it('renders the activity creation page', () => {
    const { container } = render(<ActivityCreationPage />);

    // Just check if the component renders without errors
    expect(container).toBeTruthy();

    // Check if content type is set
    expect(mockSetContentType).toHaveBeenCalledWith(ContentType.ACTIVITY);
  });
});
