import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeacherCard from '../TeacherCard';
import { TeacherData, TeacherAction, UserRole, SystemStatus } from '../types';

// Mock teacher data
const mockTeacher: TeacherData = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '123-456-7890',
  status: SystemStatus.ACTIVE,
  campusName: 'Main Campus',
  subjectQualifications: [
    { id: '1', subjectId: '1', subjectName: 'Mathematics' },
    { id: '2', subjectId: '2', subjectName: 'Physics' }
  ],
  classCount: 3
};

// Mock action handler
const mockActionHandler = jest.fn();

describe('TeacherCard Component', () => {
  beforeEach(() => {
    mockActionHandler.mockClear();
  });

  it('renders full view correctly for System Admin', () => {
    render(
      <TeacherCard
        teacher={mockTeacher}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Check if basic information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Main Campus')).toBeInTheDocument();
    
    // Check if subject qualifications are displayed
    expect(screen.getByText('Subject Qualifications')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Physics')).toBeInTheDocument();
    
    // Check if class count is displayed
    expect(screen.getByText('3 Classes')).toBeInTheDocument();
    
    // Check if action buttons are displayed
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders compact view correctly', () => {
    render(
      <TeacherCard
        teacher={mockTeacher}
        userRole={UserRole.CAMPUS_ADMIN}
        viewMode="compact"
        onAction={mockActionHandler}
      />
    );

    // Check if basic information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    
    // Check if action buttons are displayed
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    
    // Check that detailed information is not displayed
    expect(screen.queryByText('Subject Qualifications')).not.toBeInTheDocument();
    expect(screen.queryByText('3 Classes')).not.toBeInTheDocument();
  });

  it('renders list view correctly', () => {
    render(
      <TeacherCard
        teacher={mockTeacher}
        userRole={UserRole.COORDINATOR}
        viewMode="list"
        onAction={mockActionHandler}
      />
    );

    // Check if basic information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    
    // Check if action buttons are displayed
    expect(screen.getByText('View')).toBeInTheDocument();
    
    // Check that detailed information is not displayed in the same way
    expect(screen.queryByText('Subject Qualifications')).not.toBeInTheDocument();
  });

  it('calls onAction with correct parameters when action buttons are clicked', () => {
    render(
      <TeacherCard
        teacher={mockTeacher}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Click the View button
    fireEvent.click(screen.getByText('View'));
    expect(mockActionHandler).toHaveBeenCalledWith(TeacherAction.VIEW, mockTeacher);

    // Click the Edit button
    fireEvent.click(screen.getByText('Edit'));
    expect(mockActionHandler).toHaveBeenCalledWith(TeacherAction.EDIT, mockTeacher);

    // Click the Delete button
    fireEvent.click(screen.getByText('Delete'));
    expect(mockActionHandler).toHaveBeenCalledWith(TeacherAction.DELETE, mockTeacher);
  });

  it('shows different actions based on user role', () => {
    // Render for Teacher role
    const { rerender } = render(
      <TeacherCard
        teacher={mockTeacher}
        userRole={UserRole.TEACHER}
        onAction={mockActionHandler}
      />
    );

    // Teacher should only see View button
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();

    // Re-render for Campus Admin role
    rerender(
      <TeacherCard
        teacher={mockTeacher}
        userRole={UserRole.CAMPUS_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Campus Admin should see View and Edit buttons but not Delete
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
