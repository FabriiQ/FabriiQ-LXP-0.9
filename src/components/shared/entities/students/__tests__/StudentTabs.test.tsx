import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentTabs } from '../StudentTabs';
import { UserRole, StudentStatus, StudentTab } from '../types';

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
};

describe('StudentTabs', () => {
  // Mock functions
  const handleTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with provided props', () => {
    render(
      <StudentTabs
        student={mockStudent}
        userRole={UserRole.TEACHER}
        title="Student Profile"
        description="View student information"
        onTabChange={handleTabChange}
        overviewContent={<div data-testid="overview-content">Overview Content</div>}
        classesContent={<div data-testid="classes-content">Classes Content</div>}
        attendanceContent={<div data-testid="attendance-content">Attendance Content</div>}
      />
    );

    // Check if component renders with correct title and description
    expect(screen.getByText('Student Profile')).toBeInTheDocument();
    expect(screen.getByText('View student information')).toBeInTheDocument();

    // Check if tabs are rendered
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Classes')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();

    // Check if overview content is visible by default
    expect(screen.getByTestId('overview-content')).toBeInTheDocument();
  });

  test('handles tab changes correctly', () => {
    render(
      <StudentTabs
        student={mockStudent}
        userRole={UserRole.TEACHER}
        onTabChange={handleTabChange}
        overviewContent={<div data-testid="overview-content">Overview Content</div>}
        classesContent={<div data-testid="classes-content">Classes Content</div>}
        attendanceContent={<div data-testid="attendance-content">Attendance Content</div>}
      />
    );

    // Click on Classes tab
    fireEvent.click(screen.getByText('Classes'));

    // Check if onTabChange was called with correct value
    expect(handleTabChange).toHaveBeenCalledWith(StudentTab.CLASSES);

    // Check if classes content is now visible
    expect(screen.getByTestId('classes-content')).toBeInTheDocument();
  });

  test('filters tabs based on user role', () => {
    render(
      <StudentTabs
        student={mockStudent}
        userRole={UserRole.STUDENT}
        enabledTabs={[StudentTab.OVERVIEW, StudentTab.CLASSES, StudentTab.NOTES]}
        overviewContent={<div data-testid="overview-content">Overview Content</div>}
        classesContent={<div data-testid="classes-content">Classes Content</div>}
        notesContent={<div data-testid="notes-content">Notes Content</div>}
      />
    );

    // Student role should not see Notes tab
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Classes')).toBeInTheDocument();
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
  });

  test('renders loading state correctly', () => {
    render(
      <StudentTabs
        student={mockStudent}
        userRole={UserRole.TEACHER}
        title="Student Profile"
        isLoading={true}
      />
    );

    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('renders error state correctly', () => {
    const errorMessage = 'Failed to load student data';
    
    render(
      <StudentTabs
        student={mockStudent}
        userRole={UserRole.TEACHER}
        error={errorMessage}
      />
    );

    // Check for error message
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('renders empty state messages when no content is provided', () => {
    render(
      <StudentTabs
        student={mockStudent}
        userRole={UserRole.TEACHER}
        enabledTabs={[StudentTab.OVERVIEW, StudentTab.CLASSES]}
      />
    );

    // Check for empty state messages
    expect(screen.getByText('No overview information available.')).toBeInTheDocument();
    
    // Click on Classes tab
    fireEvent.click(screen.getByText('Classes'));
    
    // Check for empty state message for classes
    expect(screen.getByText('No class information available.')).toBeInTheDocument();
  });
});
