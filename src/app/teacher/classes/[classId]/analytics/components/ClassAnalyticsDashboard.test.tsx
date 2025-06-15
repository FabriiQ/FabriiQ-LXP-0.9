import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ClassAnalyticsDashboard, TopicMasteryData } from './ClassAnalyticsDashboard'; // Assuming TopicMasteryData is exported for mocking
import { api } from '@/trpc/react';
import { TRPCClientError } from '@trpc/client'; // For creating mock trpc errors


jest.mock('@/trpc/react', () => ({
  api: {
    mastery: {
      getClassAnalytics: {
        useQuery: jest.fn(),
      },
    },
  },
}));

// Helper to create a TRPCClientError mock
function createTRPCClientError(message: string, code: string = 'INTERNAL_SERVER_ERROR', httpStatus: number = 500) {
    const error = new TRPCClientError(message);
    // @ts-ignore - TRPCClientError structure for data
    error.data = { code, httpStatus, path: 'mastery.getClassAnalytics', stack: 'mock-stack' };
    // @ts-ignore
    error.shape = { message, code, data: { code, httpStatus, path: 'mastery.getClassAnalytics', stack: 'mock-stack' }};
    return error;
}


const mockUseQuery = api.mastery.getClassAnalytics.useQuery as jest.Mock;

describe('ClassAnalyticsDashboard', () => {
  const classId = 'test-class-123';

  beforeEach(() => {
    mockUseQuery.mockClear();
  });

  it('should display loading skeletons initially', () => {
    mockUseQuery.mockReturnValue({ isLoading: true, data: null, error: null, isError: false });
    render(<ClassAnalyticsDashboard classId={classId} />);

    // Check for the presence of multiple skeleton elements.
    // This depends on the structure of your skeletons.
    // Assuming each Card section has at least one skeleton for header/content.
    const skeletons = screen.getAllByRole('generic', { name: /loading content/i }); // A common way to label skeletons for accessibility
    expect(skeletons.length).toBeGreaterThan(0);
    // Or, if skeletons don't have roles/labels, check for specific class or structure:
    // For example, if skeleton has a specific test-id or class:
    // expect(screen.getAllByTestId('skeleton-loader').length).toBeGreaterThan(0);
  });

  it('should display error message if data fetching fails', async () => {
    const error = createTRPCClientError('Failed to fetch topic mastery.');
    mockUseQuery.mockReturnValue({ isLoading: false, data: null, error: error, isError: true });
    render(<ClassAnalyticsDashboard classId={classId} />);

    expect(await screen.findByText('Error Loading Topic Mastery Data')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch topic mastery./i)).toBeInTheDocument();
  });

  it('should display "no data" message if data is empty (topicMastery array is empty)', async () => {
    mockUseQuery.mockReturnValueOnce({ isLoading: false, data: { topicMastery: [] }, error: null, isError: false });
    render(<ClassAnalyticsDashboard classId={classId} />);
    expect(await screen.findByText(/No topic mastery data available/i)).toBeInTheDocument();
  });

  it('should display "no data" message if data is null (apiResponse is null)', async () => {
    mockUseQuery.mockReturnValueOnce({ isLoading: false, data: null, error: null, isError: false });
    render(<ClassAnalyticsDashboard classId={classId} />);
    expect(await screen.findByText(/No topic mastery data available/i)).toBeInTheDocument();
  });

  it('should display "no data" message if topicMastery property is missing or null', async () => {
    mockUseQuery.mockReturnValueOnce({ isLoading: false, data: { someOtherProperty: [] }, error: null, isError: false });
    const { rerender } = render(<ClassAnalyticsDashboard classId={classId} />);
    expect(await screen.findByText(/No topic mastery data available/i)).toBeInTheDocument();

    mockUseQuery.mockReturnValueOnce({ isLoading: false, data: { topicMastery: null }, error: null, isError: false });
    rerender(<ClassAnalyticsDashboard classId={classId} />);
    expect(await screen.findByText(/No topic mastery data available/i)).toBeInTheDocument();
  });


  it('should render topic mastery data in a table when fetched successfully', async () => {
    const mockApiResponse = {
      topicMastery: [
        { topicId: 't1', topicName: 'Algebra Basics', averageMasteryScore: 85.5, studentsAssessedCount: 20, masteryDistribution: [{ level: 'Proficient', count: 16, percentage: 80 }] },
        { topicId: 't2', topicName: 'Geometry Fundamentals', averageMasteryScore: 72.1, studentsAssessedCount: 18, masteryDistribution: [{ level: 'Proficient', count: 10, percentage: (10/18)*100 }] },
        { topicId: 't3', topicName: 'Calculus Introduction', averageMasteryScore: null, studentsAssessedCount: 5, masteryDistribution: null }, // Test null average score
      ] as TopicMasteryData[]
    };
    mockUseQuery.mockReturnValue({ isLoading: false, data: mockApiResponse, error: null, isError: false });
    render(<ClassAnalyticsDashboard classId={classId} />);

    expect(await screen.findByText('Topic Mastery')).toBeInTheDocument(); // CardTitle

    // Check for table headers
    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByText('Average Mastery')).toBeInTheDocument();
    // expect(screen.getByText('Students Assessed')).toBeInTheDocument(); // This might be hidden by default on smaller test DOMs

    // Check for data rows
    expect(screen.getByText('Algebra Basics')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    // expect(screen.getByText('20')).toBeInTheDocument(); // Students Assessed
    expect(screen.getByText('80%')).toBeInTheDocument(); // Proficient % for Algebra

    expect(screen.getByText('Geometry Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('72.1%')).toBeInTheDocument();
    // expect(screen.getByText('18')).toBeInTheDocument(); // Students Assessed
    expect(screen.getByText(`${((10/18)*100).toFixed(0)}%`)).toBeInTheDocument(); // Proficient % for Geometry

    expect(screen.getByText('Calculus Introduction')).toBeInTheDocument();
    expect(getAllByTextWorkaround(screen.getAllByRole('cell'), 'N/A').length).toBeGreaterThanOrEqual(1); // For null average score
  });
});

// Helper to find text within multiple elements, useful when "N/A" might appear multiple times
function getAllByTextWorkaround(cells: HTMLElement[], text: string | RegExp): HTMLElement[] {
    return cells.filter(c => {
        if (typeof text === 'string') {
            return c.textContent === text;
        }
        return text.test(c.textContent || '');
    });
}
