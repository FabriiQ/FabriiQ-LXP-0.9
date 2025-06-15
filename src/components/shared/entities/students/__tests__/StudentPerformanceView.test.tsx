import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentPerformanceView } from '../StudentPerformanceView';
import { UserRole, StudentStatus, StudentPerformanceMetric } from '../types';

// Mock Nivo charts
jest.mock('@nivo/bar', () => ({
  ResponsiveBar: () => <div data-testid="bar-chart">Bar Chart</div>,
}));

jest.mock('@nivo/line', () => ({
  ResponsiveLine: () => <div data-testid="line-chart">Line Chart</div>,
}));

jest.mock('@nivo/pie', () => ({
  ResponsivePie: () => <div data-testid="pie-chart">Pie Chart</div>,
}));

// Mock data
const mockStudent = {
  id: 'student-1',
  userId: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  enrollmentNumber: 'S12345',
  status: StudentStatus.ACTIVE,
  programName: 'Computer Science',
  academicScore: 85.5,
  attendanceRate: 92.3,
  participationRate: 78.9,
  leaderboardPosition: 5,
  leaderboardChange: 2,
  performance: {
    academic: 85.5,
    attendance: 92.3,
    participation: 78.9,
    improvement: 3.2,
    strengths: ['Problem solving', 'Team collaboration'],
    weaknesses: ['Time management', 'Written communication'],
    recentGrades: [
      {
        id: 'grade-1',
        subject: 'Math',
        score: 88,
        letterGrade: 'B+',
        date: new Date('2023-05-15'),
      },
      {
        id: 'grade-2',
        subject: 'Science',
        score: 92,
        letterGrade: 'A-',
        date: new Date('2023-05-10'),
      },
    ],
    trend: [
      {
        date: new Date('2023-04-01'),
        academic: 82,
        attendance: 90,
        participation: 75,
      },
      {
        date: new Date('2023-05-01'),
        academic: 85.5,
        attendance: 92.3,
        participation: 78.9,
      },
    ],
  },
};

// Mock metrics
const mockMetrics: StudentPerformanceMetric[] = [
  {
    id: 'academic',
    name: 'Academic Score',
    value: 85.5,
    previousValue: 82,
    change: 3.5,
    target: 90,
    color: 'bg-blue-500',
    icon: <div>Icon</div>,
  },
  {
    id: 'attendance',
    name: 'Attendance Rate',
    value: 92.3,
    previousValue: 90,
    change: 2.3,
    target: 95,
    color: 'bg-green-500',
    icon: <div>Icon</div>,
  },
];

describe('StudentPerformanceView', () => {
  // Mock functions
  const handleExport = jest.fn();
  const handleTimeRangeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with provided props', () => {
    render(
      <StudentPerformanceView
        student={mockStudent}
        userRole={UserRole.TEACHER}
        metrics={mockMetrics}
        timeRange="last30days"
        onExport={handleExport}
        onTimeRangeChange={handleTimeRangeChange}
      />
    );

    // Check if component renders with correct title
    expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();

    // Check if metrics are rendered
    expect(screen.getByText('Academic Score')).toBeInTheDocument();
    expect(screen.getByText('Attendance Rate')).toBeInTheDocument();

    // Check if charts are rendered
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

    // Check if strengths and weaknesses are rendered
    expect(screen.getByText('Strengths')).toBeInTheDocument();
    expect(screen.getByText('Problem solving')).toBeInTheDocument();
    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
    expect(screen.getByText('Time management')).toBeInTheDocument();

    // Check if recent grades are rendered
    expect(screen.getByText('Recent Grades')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  test('handles time range change correctly', () => {
    render(
      <StudentPerformanceView
        student={mockStudent}
        userRole={UserRole.TEACHER}
        metrics={mockMetrics}
        onTimeRangeChange={handleTimeRangeChange}
      />
    );

    // Open the select dropdown
    fireEvent.click(screen.getByRole('combobox'));
    
    // Select a different time range
    fireEvent.click(screen.getByText('Last 7 Days'));

    // Check if onTimeRangeChange was called with correct value
    expect(handleTimeRangeChange).toHaveBeenCalledWith('last7days');
  });

  test('handles export button click correctly', () => {
    render(
      <StudentPerformanceView
        student={mockStudent}
        userRole={UserRole.TEACHER}
        metrics={mockMetrics}
        onExport={handleExport}
      />
    );

    // Click the export button
    fireEvent.click(screen.getByText('Export'));

    // Check if onExport was called
    expect(handleExport).toHaveBeenCalled();
  });

  test('filters metrics based on user role', () => {
    // Render with student role
    render(
      <StudentPerformanceView
        student={mockStudent}
        userRole={UserRole.STUDENT}
        metrics={[
          ...mockMetrics,
          {
            id: 'rank',
            name: 'Class Rank',
            value: 5,
            previousValue: 7,
            change: 2,
            color: 'bg-amber-500',
            icon: <div>Icon</div>,
          },
        ]}
      />
    );

    // Student role should not see rank metric
    expect(screen.getByText('Academic Score')).toBeInTheDocument();
    expect(screen.getByText('Attendance Rate')).toBeInTheDocument();
    expect(screen.queryByText('Class Rank')).not.toBeInTheDocument();
  });

  test('renders loading state correctly', () => {
    render(
      <StudentPerformanceView
        student={mockStudent}
        userRole={UserRole.TEACHER}
        isLoading={true}
      />
    );

    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('renders error state correctly', () => {
    const errorMessage = 'Failed to load performance data';
    
    render(
      <StudentPerformanceView
        student={mockStudent}
        userRole={UserRole.TEACHER}
        error={errorMessage}
      />
    );

    // Check for error message
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
