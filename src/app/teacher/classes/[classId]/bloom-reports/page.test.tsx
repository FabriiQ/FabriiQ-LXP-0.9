import React from 'react';
import { render, screen, within } from '@testing-library/react';
import BloomReportsPage from './page';
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
    // Mock any other tRPC procedures used by the report components if deeply rendered
    // For this test, we mock the report components themselves.
  },
}));

// Mock features/bloom/components as they are complex and not unit-tested here
vi.mock('@/features/bloom/components', () => ({
  CognitiveBalanceReport: vi.fn(({ classId, teacherId }) => (
    <div data-testid="cognitive-balance-report" data-classid={classId} data-teacherid={teacherId}>
      Mocked CognitiveBalanceReport
    </div>
  )),
  MasteryProgressReport: vi.fn(({ classId, teacherId }) => (
    <div data-testid="mastery-progress-report" data-classid={classId} data-teacherid={teacherId}>
      Mocked MasteryProgressReport
    </div>
  )),
}));
// No longer need to mock React.use for useParams

describe('BloomReportsPage', () => {
  const mockUseSession = useSession as jest.Mock;
  const mockUseParams = useParams as jest.Mock;
  const mockGetClassByIdQuery = api.teacher.getClassById.useQuery as jest.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('Test 1: Renders and uses classId from params, calls report components with classId and teacherId', () => {
    const testClassId = 'report_class_456';
    const testTeacherId = 'teacher_abc';

    // Set the return value for the mock useParams
    mockUseParams.mockReturnValue({ classId: testClassId });

    mockUseSession.mockReturnValue({
      data: { user: { id: testTeacherId, userType: 'TEACHER' }, expires: 'some-date' },
      status: 'authenticated',
    });
    mockGetClassByIdQuery.mockReturnValue({
      data: { id: testClassId, name: 'Reports Class', teacherId: testTeacherId },
      isLoading: false,
    });

    render(<BloomReportsPage />);

    // Check back to class link
    const backLink = screen.getByRole('link', { name: /Back to Class/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', `/teacher/classes/${testClassId}`);

    // Check if Tabs are present
    const tabs = screen.getByRole('tablist');
    expect(tabs).toBeInTheDocument();

    // Default tab is mastery, check for MasteryProgressReport
    const masteryTab = screen.getByRole('tab', { name: /Mastery Progress/i });
    expect(masteryTab).toHaveAttribute('aria-selected', 'true');

    const masteryReport = screen.getByTestId('mastery-progress-report');
    expect(masteryReport).toBeInTheDocument();
    expect(masteryReport).toHaveAttribute('data-classid', testClassId);
    expect(masteryReport).toHaveAttribute('data-teacherid', testTeacherId);

    // CognitiveBalanceReport should also be in the DOM (though possibly hidden by Tabs)
    // We find it to ensure it's rendered and would receive props
    const cognitiveReport = screen.getByTestId('cognitive-balance-report');
    expect(cognitiveReport).toBeInTheDocument();
    expect(cognitiveReport).toHaveAttribute('data-classid', testClassId);
    expect(cognitiveReport).toHaveAttribute('data-teacherid', testTeacherId);
  });

  // Add more tests:
  // - Loading state
  // - Unauthenticated state
  // - User is not TEACHER or CAMPUS_TEACHER
  // - Class not found
  // - Switching tabs and verifying the correct report component is active/visible
});
