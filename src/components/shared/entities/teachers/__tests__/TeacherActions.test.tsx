import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeacherActions from '../TeacherActions';
import { TeacherData, TeacherAction, UserRole, SystemStatus } from '../types';

// Mock teacher data
const mockTeacher: TeacherData = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  status: SystemStatus.ACTIVE,
  campusName: 'Main Campus'
};

// Mock action handler
const mockActionHandler = jest.fn();

describe('TeacherActions Component', () => {
  beforeEach(() => {
    mockActionHandler.mockClear();
  });

  it('renders primary action buttons correctly', () => {
    render(
      <TeacherActions
        teacher={mockTeacher}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Check if primary action buttons are displayed
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    
    // Check if dropdown menu trigger is displayed
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('renders icon-only buttons when iconOnly is true', () => {
    render(
      <TeacherActions
        teacher={mockTeacher}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
        iconOnly={true}
      />
    );

    // Check that text labels are not visible
    expect(screen.queryByText('View')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    
    // But buttons should still be there (would need to check for SVG icons)
  });

  it('renders dropdown-only when dropdownOnly is true', () => {
    render(
      <TeacherActions
        teacher={mockTeacher}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
        dropdownOnly={true}
      />
    );

    // Check that primary action buttons are not displayed
    expect(screen.queryByText('View')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    
    // But dropdown menu trigger should be there
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('calls onAction with correct parameters when action buttons are clicked', () => {
    render(
      <TeacherActions
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
  });

  it('shows confirmation dialog for destructive actions', () => {
    render(
      <TeacherActions
        teacher={mockTeacher}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Click the Delete button
    fireEvent.click(screen.getByText('Delete'));
    
    // Check if confirmation dialog is displayed
    expect(screen.getByText(`Delete ${mockTeacher.name}`)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    
    // Action should not be called yet
    expect(mockActionHandler).not.toHaveBeenCalled();
    
    // Click the Confirm button
    fireEvent.click(screen.getByText('Confirm'));
    
    // Now the action should be called
    expect(mockActionHandler).toHaveBeenCalledWith(TeacherAction.DELETE, mockTeacher);
  });

  it('shows different actions based on user role', () => {
    // Render for Teacher role
    const { rerender } = render(
      <TeacherActions
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
      <TeacherActions
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
