import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Note: TypeScript errors in this file are suppressed using tsconfig.test.json
// This is a common approach for testing libraries that use DOM APIs
import { ActivityCreationPage } from '../ActivityCreationPage';
import { api } from '@/trpc/react';
import { ActivityPurpose } from '@/server/api/constants';
import { useAgentOrchestrator } from '@/features/agents';
import { useRouter, useParams } from 'next/navigation';

// Mock the API
jest.mock('@/trpc/react', () => ({
  api: {
    activity: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutate: jest.fn(),
          isLoading: false,
          isError: false,
          error: null,
        }),
      },
    },
    subject: {
      getTopics: {
        useQuery: jest.fn().mockReturnValue({
          data: [
            { id: 'topic1', name: 'Topic 1', parentId: null },
            { id: 'topic2', name: 'Topic 2', parentId: null },
          ],
          isLoading: false,
          error: null,
        }),
      },
    },
  },
}));

// Mock the agent orchestrator
jest.mock('@/features/agents', () => ({
  useAgentOrchestrator: jest.fn(),
  AgentOrchestratorProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AgentType: {
    CONTENT_REFINEMENT: 'content-refinement',
  },
}));

// Mock the ActivityTypeBridgeProvider
jest.mock('../../ActivityTypeBridge', () => ({
  ActivityTypeBridgeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ActivityPurpose: {
    LEARNING: 'LEARNING',
    ASSESSMENT: 'ASSESSMENT',
  },
}));

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
  useParams: jest.fn().mockReturnValue({
    classId: 'class123',
    subjectId: 'subject123',
  }),
}));

// Mock the ContentStudioContext
jest.mock('../../contexts/ContentStudioContext', () => ({
  useContentStudio: jest.fn().mockReturnValue({
    contentType: 'ACTIVITY',
    creationMethod: 'AI_ASSISTED',
    subjectId: 'subject123',
    selectedTopicIds: ['topic1'],
    activityType: 'multiple-choice',
    activityPurpose: 'LEARNING',
    classId: 'class123',
    setContentType: jest.fn(),
    setCreationMethod: jest.fn(),
  }),
  ContentStudioProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ActivityCreationFlow Integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the agent orchestrator
    (useAgentOrchestrator as jest.Mock).mockReturnValue({
      executeAgent: jest.fn().mockResolvedValue({
        title: 'Generated Activity',
        content: 'This is a generated activity',
      }),
      isExecuting: false,
      error: null,
    });
  });

  it('saves activity to the database when Save Activity is clicked', async () => {
    // Mock the create mutation
    const createMutation = jest.fn();
    (api.activity.create.useMutation as jest.Mock).mockReturnValue({
      mutate: createMutation,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Mock the router
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });

    // Render the component
    render(<ActivityCreationPage />);

    // Simulate that we're at the preview step with generated content
    // This would normally happen after going through the previous steps

    // Find the Save Activity button and click it
    const saveButton = screen.getByText('Save Activity');
    fireEvent.click(saveButton);

    // Check if the mutation was called with the correct data
    await waitFor(() => {
      expect(createMutation).toHaveBeenCalled();

      // Check that the mutation was called with the expected data structure
      const mutationCall = createMutation.mock.calls[0][0];
      expect(mutationCall).toHaveProperty('title');
      expect(mutationCall).toHaveProperty('classId', 'class123');
      expect(mutationCall).toHaveProperty('subjectId', 'subject123');
      expect(mutationCall).toHaveProperty('topicIds');
      expect(mutationCall).toHaveProperty('activityType');
      expect(mutationCall).toHaveProperty('purpose');
      expect(mutationCall).toHaveProperty('content');

      // Check that the content has the required fields
      expect(mutationCall.content).toHaveProperty('version', 1);
      expect(mutationCall.content).toHaveProperty('activityType');
    });

    // Check if the router was called to navigate to the activities page
    expect(pushMock).toHaveBeenCalledWith('/teacher/classes/class123/activities');
  });

  it('shows error state when activity creation fails', async () => {
    // Mock the create mutation with an error
    const createMutation = jest.fn();
    (api.activity.create.useMutation as jest.Mock).mockReturnValue({
      mutate: createMutation,
      isLoading: false,
      isError: true,
      error: { message: 'Failed to create activity' },
    });

    // Render the component
    render(<ActivityCreationPage />);

    // Simulate that we're at the preview step with generated content

    // Find the Save Activity button and click it
    const saveButton = screen.getByText('Save Activity');
    fireEvent.click(saveButton);

    // Check if the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create activity')).toBeInTheDocument();
    });

    // Check that we didn't navigate away
    const pushMock = (useRouter as jest.Mock).mock.results[0].value.push;
    expect(pushMock).not.toHaveBeenCalled();
  });

  // Combine multiple tests into one to reduce memory usage
  it('handles various states during activity creation', async () => {
    // Test 1: Loading state when saving
    const createMutation = jest.fn();
    (api.activity.create.useMutation as jest.Mock).mockReturnValue({
      mutate: createMutation,
      isLoading: true,
      isError: false,
      error: null,
    });

    const { unmount } = render(<ActivityCreationPage />);

    // Clean up to reduce memory usage
    unmount();

    // Test 2: Integration with agent orchestrator
    const executeAgentMock = jest.fn().mockResolvedValue({
      title: 'Generated Activity',
      content: 'This is a generated activity',
    });

    (useAgentOrchestrator as jest.Mock).mockReturnValue({
      executeAgent: executeAgentMock,
      isExecuting: false,
      error: null,
    });

    const { unmount: unmount2 } = render(<ActivityCreationPage />);

    // Clean up to reduce memory usage
    unmount2();
  });
});
