import React from 'react';
import { render, screen } from '@testing-library/react';
import BloomAnalyticsPage from './page';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('next-auth/react');
vi.mock('next/navigation', () => ({
  ...vi.importActual('next/navigation'), // Import and retain default behavior
  useParams: vi.fn(), // Mock useParams
  useRouter: vi.fn(() => ({ push: vi.fn() })), // Mock useRouter
}));
vi.mock('@/trpc/react', () => ({
  api: {
    teacher: {
      getClassById: {
        useQuery: vi.fn(),
      },
    },
    // Mock any other tRPC procedures used by BloomsAnalyticsDashboard if it were deeply rendered/tested
    bloomsAnalytics: {
        getClassPerformance: {
            useQuery: vi.fn(),
        }
    },
    class: {
        getById: {
            useQuery: vi.fn(),
        }
    },
    subjectTopic: {
        getBySubject:{
            useQuery: vi.fn(),
        }
    }
  },
}));
vi.mock('@/features/bloom/components/analytics', () => ({
  BloomsAnalyticsDashboard: vi.fn(({ classId }) => (
    <div data-testid="blooms-analytics-dashboard" data-classid={classId}>
      Mocked BloomsAnalyticsDashboard
    </div>
  )),
}));
// No longer need to mock React.use for useParams

describe('BloomAnalyticsPage', () => {
  const mockUseSession = useSession as jest.Mock;
  const mockUseParams = useParams as jest.Mock;
  const mockGetClassByIdQuery = api.teacher.getClassById.useQuery as jest.Mock;
   // Mock queries called by BloomsAnalyticsDashboard
   const mockGetClassPerformance = api.bloomsAnalytics.getClassPerformance.useQuery as jest.Mock;
   const mockGetClassDetails = api.class.getById.useQuery as jest.Mock; // Used by dashboard
   const mockGetTopics = api.subjectTopic.getBySubject.useQuery as jest.Mock; // Used by dashboard


  beforeEach(() => {
    vi.resetAllMocks();
    // Default mocks for dashboard's internal queries
    mockGetClassPerformance.mockReturnValue({ data: null, isLoading: true });
    mockGetClassDetails.mockReturnValue({ data: null, isLoading: true });
    mockGetTopics.mockReturnValue({ data: null, isLoading: true });
  });

  test('Test 1: Renders and uses classId from params, calls dashboard with classId', () => {
    const testClassId = 'test_class_123';
    // Set the return value for the mock useParams
    mockUseParams.mockReturnValue({ classId: testClassId });

    mockUseSession.mockReturnValue({
      data: { user: { id: 'teacher1', userType: 'TEACHER' }, expires: 'some-date' },
      status: 'authenticated',
    });
    mockGetClassByIdQuery.mockReturnValue({
      data: { id: testClassId, name: 'Test Class', teacherId: 'teacher1' },
      isLoading: false,
    });

    render(<BloomAnalyticsPage />);

    // Check back to class link
    const backLink = screen.getByRole('link', { name: /Back to Class/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', `/teacher/classes/${testClassId}`);

    // Check if BloomsAnalyticsDashboard is rendered with the correct classId
    const dashboard = screen.getByTestId('blooms-analytics-dashboard');
    expect(dashboard).toBeInTheDocument();
    expect(dashboard).toHaveAttribute('data-classid', testClassId);
  });

  // Add more tests:
  // - Loading state (status === 'loading' || isLoadingClass)
  // - Unauthenticated state (redirects)
  // - User is not TEACHER or CAMPUS_TEACHER (Access Denied)
  // - Class not found (Alert)
});
