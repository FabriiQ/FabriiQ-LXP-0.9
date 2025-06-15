import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttendanceTabs } from '../AttendanceTabs';
import { UserRole } from '../types';

describe('AttendanceTabs', () => {
  // Mock functions
  const handleTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with provided props', () => {
    render(
      <AttendanceTabs
        title="Attendance Dashboard"
        description="View attendance data"
        userRole={UserRole.TEACHER}
        onTabChange={handleTabChange}
        overviewContent={<div data-testid="overview-content">Overview Content</div>}
        byClassContent={<div data-testid="class-content">Class Content</div>}
        byStudentContent={<div data-testid="student-content">Student Content</div>}
      />
    );

    // Check if component renders with correct title and description
    expect(screen.getByText('Attendance Dashboard')).toBeInTheDocument();
    expect(screen.getByText('View attendance data')).toBeInTheDocument();

    // Check if tabs are rendered
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('By Class')).toBeInTheDocument();
    expect(screen.getByText('By Student')).toBeInTheDocument();

    // Check if overview content is visible by default
    expect(screen.getByTestId('overview-content')).toBeInTheDocument();
  });

  test('handles tab changes correctly', () => {
    render(
      <AttendanceTabs
        title="Attendance Dashboard"
        userRole={UserRole.TEACHER}
        onTabChange={handleTabChange}
        overviewContent={<div data-testid="overview-content">Overview Content</div>}
        byClassContent={<div data-testid="class-content">Class Content</div>}
        byStudentContent={<div data-testid="student-content">Student Content</div>}
      />
    );

    // Click on By Class tab
    fireEvent.click(screen.getByText('By Class'));

    // Check if onTabChange was called with correct value
    expect(handleTabChange).toHaveBeenCalledWith('byClass');

    // Check if class content is now visible
    expect(screen.getByTestId('class-content')).toBeInTheDocument();
  });

  test('filters tabs based on user role', () => {
    render(
      <AttendanceTabs
        title="Attendance Dashboard"
        userRole={UserRole.STUDENT}
        overviewContent={<div data-testid="overview-content">Overview Content</div>}
        byClassContent={<div data-testid="class-content">Class Content</div>}
        byStudentContent={<div data-testid="student-content">Student Content</div>}
      />
    );

    // Student role should not see By Student tab
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('By Class')).toBeInTheDocument();
    expect(screen.queryByText('By Student')).not.toBeInTheDocument();
  });

  test('renders loading state correctly', () => {
    render(
      <AttendanceTabs
        title="Attendance Dashboard"
        userRole={UserRole.TEACHER}
        isLoading={true}
      />
    );

    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('renders error state correctly', () => {
    const errorMessage = 'Failed to load attendance data';
    
    render(
      <AttendanceTabs
        title="Attendance Dashboard"
        userRole={UserRole.TEACHER}
        error={errorMessage}
      />
    );

    // Check for error message
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
