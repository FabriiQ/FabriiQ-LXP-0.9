import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StudentCard } from '../StudentCard';
import { UserRole, StudentStatus, StudentAction } from '../types';

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

describe('StudentCard', () => {
  // Mock functions
  const handleAction = jest.fn();
  const handleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with provided props', () => {
    render(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.TEACHER}
        actions={[StudentAction.VIEW, StudentAction.EDIT]}
        onAction={handleAction}
        onClick={handleClick}
      />
    );

    // Check if component renders with correct student information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('S12345')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    
    // Check if status badge is rendered
    expect(screen.getByText('active')).toBeInTheDocument();
    
    // Check if academic score is rendered
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    
    // Check if attendance rate is rendered
    expect(screen.getByText('92.3%')).toBeInTheDocument();
  });

  test('handles action click correctly', () => {
    render(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.TEACHER}
        actions={[StudentAction.VIEW]}
        onAction={handleAction}
      />
    );

    // Click the view button
    const viewButton = screen.getByText('View Profile');
    fireEvent.click(viewButton);

    // Check if onAction was called with correct parameters
    expect(handleAction).toHaveBeenCalledWith(StudentAction.VIEW, mockStudent);
  });

  test('handles card click correctly', () => {
    render(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.TEACHER}
        onClick={handleClick}
      />
    );

    // Click the card
    const card = screen.getByText('John Doe').closest('.card');
    if (card) {
      fireEvent.click(card);
    }

    // Check if onClick was called with correct parameters
    expect(handleClick).toHaveBeenCalledWith(mockStudent);
  });

  test('renders different view modes correctly', () => {
    // Test compact view
    const { rerender } = render(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.TEACHER}
        viewMode="compact"
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Test mobile view
    rerender(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.TEACHER}
        viewMode="mobile"
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('filters actions based on user role', () => {
    // Render with system admin role
    const { rerender } = render(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.SYSTEM_ADMIN}
        actions={[StudentAction.VIEW, StudentAction.EDIT, StudentAction.DELETE]}
        onAction={handleAction}
      />
    );
    
    // System admin should see all actions
    expect(screen.getByText('View Profile')).toBeInTheDocument();
    
    // Render with teacher role
    rerender(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.TEACHER}
        actions={[StudentAction.VIEW, StudentAction.EDIT, StudentAction.DELETE]}
        onAction={handleAction}
      />
    );
    
    // Teacher should only see view action
    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Student')).not.toBeInTheDocument();
  });

  test('renders loading skeleton when isLoading is true', () => {
    render(
      <StudentCard
        student={mockStudent}
        userRole={UserRole.TEACHER}
        isLoading={true}
      />
    );
    
    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
