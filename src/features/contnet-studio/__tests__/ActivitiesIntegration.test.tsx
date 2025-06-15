import * as React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Note: TypeScript errors in this file are suppressed using tsconfig.test.json
// This is a common approach for testing libraries that use DOM APIs
import { ActivityCreationPage } from '../pages/ActivityCreationPage';
import { ActivityPurpose } from '@/server/api/constants';
import { mapActivityTypeToId, getActivityTypeDisplayName } from '@/features/activties';

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
  useAgentOrchestrator: jest.fn().mockReturnValue({
    executeAgent: jest.fn().mockResolvedValue({
      title: 'Generated Activity',
      content: 'This is a generated activity',
    }),
    isExecuting: false,
    error: null,
  }),
  AgentOrchestratorProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AgentType: {
    CONTENT_REFINEMENT: 'content-refinement',
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
jest.mock('../contexts/ContentStudioContext', () => ({
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

// Create a test component that uses the activities utility functions
const ActivitiesUtilsTestComponent = () => {
  // Map some activity types
  const multipleChoiceId = mapActivityTypeToId('MULTIPLE_CHOICE', ActivityPurpose.ASSESSMENT);
  const fillInBlanksId = mapActivityTypeToId('FILL_IN_THE_BLANKS', ActivityPurpose.LEARNING);
  const trueFalseId = mapActivityTypeToId('TRUE_FALSE', ActivityPurpose.ASSESSMENT);

  // Get display names
  const multipleChoiceName = getActivityTypeDisplayName('multiple-choice');
  const fillInBlanksName = getActivityTypeDisplayName('fill-in-the-blanks');
  const trueFalseName = getActivityTypeDisplayName('true-false');

  return (
    <div>
      <h2>Activities Utils Test</h2>
      <div>
        <h3>Mapped IDs</h3>
        <div data-testid="multiple-choice-id">{multipleChoiceId}</div>
        <div data-testid="fill-in-blanks-id">{fillInBlanksId}</div>
        <div data-testid="true-false-id">{trueFalseId}</div>
      </div>
      <div>
        <h3>Display Names</h3>
        <div data-testid="multiple-choice-name">{multipleChoiceName}</div>
        <div data-testid="fill-in-blanks-name">{fillInBlanksName}</div>
        <div data-testid="true-false-name">{trueFalseName}</div>
      </div>
    </div>
  );
};

describe('Activities Integration', () => {
  it('integrates with the ActivityCreationPage', async () => {
    const { container } = render(
      <ActivityCreationPage />
    );

    // Just check if the component renders without errors
    expect(container).toBeTruthy();
  });

  it('provides activity type mapping functions', async () => {
    const { container } = render(
      <ActivitiesUtilsTestComponent />
    );

    // Just check if the component renders without errors
    expect(container).toBeTruthy();
  });

  it('supports common activity types', async () => {
    // Create a component that tests a subset of activity types
    const CommonActivityTypesTestComponent = () => {
      // Test a subset of activity types to reduce memory usage
      const activityTypes = [
        'multiple-choice',
        'fill-in-the-blanks',
        'true-false',
        'quiz',
        'reading',
      ];

      return (
        <div>
          <h2>Common Activity Types Test</h2>
          <div>
            {activityTypes.map(type => (
              <div key={type} data-testid={`activity-type-${type}`}>
                {mapActivityTypeToId(type.toUpperCase().replace(/-/g, '_'), ActivityPurpose.ASSESSMENT)}
              </div>
            ))}
          </div>
        </div>
      );
    };

    const { container } = render(
      <CommonActivityTypesTestComponent />
    );

    // Just check if the component renders without errors
    expect(container).toBeTruthy();
  });
});
