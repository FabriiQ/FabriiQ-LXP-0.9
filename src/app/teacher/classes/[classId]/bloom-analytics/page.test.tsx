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
  useParams: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
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
vi.mock('react', async () => {
    const actualReact = await vi.importActual('react');
    return {
        ...actualReact,
        use: vi.fn((promise) => {
            // This basic mock for `use` assumes the promise resolves immediately.
            // For more complex scenarios, you might need to mock its specific behavior.
            if (promise && typeof promise.then === 'function') {
                // This is a simplified way to handle promises passed to `use`.
                // It won't work for all cases, especially those involving suspense.
                let result;
                promise.then((val: any) => result = val).catch((e: any) => console.error("Mock `use` error", e));
                return result;
            }
            return promise; // Fallback for non-promise values
        }),
    };
});


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
    (React.use as jest.Mock).mockImplementation((promise) => {
        if (promise === mockUseParams) { // Check if it's the useParams promise
            return { classId: testClassId };
        }
        // Fallback for other promises if any (though not expected in this simple case)
        // This part might need adjustment if other promises are passed to React.use
        if (promise && typeof promise.then === 'function') {
          let value;
          promise.then(v => value = v);
          return value; // Simplified: assumes immediate resolution
        }
        return promise;
    });
    mockUseParams.mockReturnValue({ classId: testClassId }); // Standard mock for useParams

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
