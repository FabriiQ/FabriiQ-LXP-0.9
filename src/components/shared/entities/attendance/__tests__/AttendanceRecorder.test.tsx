import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttendanceRecorder } from '../AttendanceRecorder';
import { UserRole, AttendanceStatus } from '../types';

// Mock data
const mockClassData = {
  id: 'class-1',
  name: 'Mathematics 101',
  code: 'MATH101',
  courseId: 'course-1',
  courseName: 'Mathematics',
  startDate: new Date(2023, 0, 1),
  endDate: new Date(2023, 5, 30),
};

const mockStudents = [
  {
    id: 'student-1',
    userId: 'user-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
  },
  {
    id: 'student-2',
    userId: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
  },
];

const mockExistingAttendance = {
  'student-1': {
    status: AttendanceStatus.PRESENT,
  },
  'student-2': {
    status: AttendanceStatus.ABSENT,
    comment: 'Sick leave',
  },
};

describe('AttendanceRecorder', () => {
  // Mock functions
  const handleSubmit = jest.fn();
  const handleCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with provided props', () => {
    render(
      <AttendanceRecorder
        classData={mockClassData}
        students={mockStudents}
        date={new Date(2023, 3, 15)}
        existingAttendance={mockExistingAttendance}
        userRole={UserRole.TEACHER}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );

    // Check if component renders with correct title and description
    expect(screen.getByText('Record Attendance')).toBeInTheDocument();
    expect(screen.getByText(/Mathematics 101 \(MATH101\)/)).toBeInTheDocument();

    // Check if students are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();

    // Check if existing attendance is displayed
    // This would require more complex testing with getByRole or other selectors
  });

  test('handles student search correctly', () => {
    render(
      <AttendanceRecorder
        classData={mockClassData}
        students={mockStudents}
        userRole={UserRole.TEACHER}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );

    // Search for a student
    const searchInput = screen.getByPlaceholderText('Search students...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    // John should not be visible, but Jane should be
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Both students should be visible again
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('handles form submission correctly', () => {
    render(
      <AttendanceRecorder
        classData={mockClassData}
        students={mockStudents}
        userRole={UserRole.TEACHER}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );

    // Click the save button
    const saveButton = screen.getByText('Save Attendance');
    fireEvent.click(saveButton);

    // Check if onSubmit was called
    expect(handleSubmit).toHaveBeenCalled();
  });

  test('handles cancel correctly', () => {
    render(
      <AttendanceRecorder
        classData={mockClassData}
        students={mockStudents}
        userRole={UserRole.TEACHER}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );

    // Click the cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Check if onCancel was called
    expect(handleCancel).toHaveBeenCalled();
  });

  test('renders loading state correctly', () => {
    render(
      <AttendanceRecorder
        classData={mockClassData}
        students={mockStudents}
        userRole={UserRole.TEACHER}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
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
      <AttendanceRecorder
        classData={mockClassData}
        students={mockStudents}
        userRole={UserRole.TEACHER}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        error={errorMessage}
      />
    );

    // Check for error message
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
