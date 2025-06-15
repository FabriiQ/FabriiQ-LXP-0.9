import { render, screen, waitFor } from '@testing-library/react';
import CampusCourseAnalyticsPage from './page';
import { api } from '@/trpc/react';
import { useParams } from 'next/navigation';

// Mock the necessary dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('@/trpc/react', () => ({
  api: {
    coordinator: {
      getProgramDetails: {
        useQuery: jest.fn(),
      },
      getCoordinatorAssignments: {
        useQuery: jest.fn(),
      },
    },
  },
}));

jest.mock('@/components/coordinator/CoordinatorAnalyticsNavigation', () => ({
  CoordinatorAnalyticsNavigation: jest.fn(() => <div data-testid="coordinator-analytics-navigation" />),
}));

jest.mock('@/components/ui/loading', () => ({
  LoadingSpinner: jest.fn(() => <div data-testid="loading-spinner" />),
}));

describe('CampusCourseAnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: 'test-program-id' });
  });

  it('should show loading spinner while data is loading', () => {
    // Mock loading state
    (api.coordinator.getProgramDetails.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });
    (api.coordinator.getCoordinatorAssignments.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<CampusCourseAnalyticsPage />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should render CoordinatorAnalyticsNavigation with correct props when data is loaded', async () => {
    // Mock successful data loading
    const mockProgramData = {
      program: {
        id: 'test-program-id',
        name: 'Test Program',
        code: 'TP101',
        campusOfferings: [
          {
            campusId: 'campus-1',
            campus: {
              id: 'campus-1',
              name: 'Main Campus',
              code: 'MC',
            },
          },
        ],
      },
    };

    const mockAssignmentsData = {
      programs: [
        {
          id: 'test-program-id',
          coordinatorAssignments: [
            {
              programId: 'test-program-id',
              programName: 'Test Program',
              programCode: 'TP101',
              campusId: 'campus-1',
              campusName: 'Main Campus',
              role: 'Coordinator',
              responsibilities: ['Oversee program'],
              assignedAt: new Date(),
            },
          ],
        },
      ],
    };

    (api.coordinator.getProgramDetails.useQuery as jest.Mock).mockReturnValue({
      data: mockProgramData,
      isLoading: false,
    });
    
    (api.coordinator.getCoordinatorAssignments.useQuery as jest.Mock).mockReturnValue({
      data: mockAssignmentsData,
      isLoading: false,
    });

    render(<CampusCourseAnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('coordinator-analytics-navigation')).toBeInTheDocument();
    });
  });

  it('should show error message when program data is not available', async () => {
    // Mock case where program data is not available
    (api.coordinator.getProgramDetails.useQuery as jest.Mock).mockReturnValue({
      data: { program: null },
      isLoading: false,
    });
    
    (api.coordinator.getCoordinatorAssignments.useQuery as jest.Mock).mockReturnValue({
      data: { programs: [] },
      isLoading: false,
    });

    render(<CampusCourseAnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/Program not found or you don't have access to it/i)).toBeInTheDocument();
    });
  });
});
