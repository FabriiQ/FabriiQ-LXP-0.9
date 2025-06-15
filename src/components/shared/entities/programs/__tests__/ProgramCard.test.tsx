import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgramCard from '../ProgramCard';
import { ProgramData, ProgramAction, UserRole, SystemStatus } from '../types';

// Mock program data
const mockProgram: ProgramData = {
  id: '1',
  name: 'Computer Science Program',
  code: 'CS-2023',
  description: 'A comprehensive program covering computer science fundamentals',
  status: SystemStatus.ACTIVE,
  institutionName: 'Tech University',
  campusName: 'Main Campus',
  courseCount: 12,
  studentCount: 150,
  startDate: '2023-09-01',
  endDate: '2027-06-30',
  createdAt: '2023-01-15',
  updatedAt: '2023-03-20'
};

// Mock action handler
const mockActionHandler = jest.fn();

describe('ProgramCard Component', () => {
  beforeEach(() => {
    mockActionHandler.mockClear();
  });

  it('renders full view correctly for System Admin', () => {
    render(
      <ProgramCard
        program={mockProgram}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Check if basic information is displayed
    expect(screen.getByText('Computer Science Program')).toBeInTheDocument();
    expect(screen.getByText('Code: CS-2023')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive program covering computer science fundamentals')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    
    // Check if institution and campus are displayed
    expect(screen.getByText('Tech University')).toBeInTheDocument();
    expect(screen.getByText('Main Campus')).toBeInTheDocument();
    
    // Check if dates are displayed
    expect(screen.getByText('Start: Sep 1, 2023')).toBeInTheDocument();
    expect(screen.getByText('End: Jun 30, 2027')).toBeInTheDocument();
    
    // Check if counts are displayed
    expect(screen.getByText('12 Courses')).toBeInTheDocument();
    expect(screen.getByText('150 Students')).toBeInTheDocument();
    
    // Check if created/updated dates are displayed for System Admin
    expect(screen.getByText('Created: Jan 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('Updated: Mar 20, 2023')).toBeInTheDocument();
    
    // Check if action buttons are displayed
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders compact view correctly', () => {
    render(
      <ProgramCard
        program={mockProgram}
        userRole={UserRole.CAMPUS_ADMIN}
        viewMode="compact"
        onAction={mockActionHandler}
      />
    );

    // Check if basic information is displayed
    expect(screen.getByText('Computer Science Program')).toBeInTheDocument();
    expect(screen.getByText('Code: CS-2023')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Main Campus')).toBeInTheDocument();
    expect(screen.getByText('12 Courses')).toBeInTheDocument();
    expect(screen.getByText('150 Students')).toBeInTheDocument();
    
    // Check if action buttons are displayed
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    
    // Check that detailed information is not displayed
    expect(screen.queryByText('A comprehensive program covering computer science fundamentals')).not.toBeInTheDocument();
    expect(screen.queryByText('Created: Jan 15, 2023')).not.toBeInTheDocument();
  });

  it('renders list view correctly', () => {
    render(
      <ProgramCard
        program={mockProgram}
        userRole={UserRole.COORDINATOR}
        viewMode="list"
        onAction={mockActionHandler}
      />
    );

    // Check if basic information is displayed
    expect(screen.getByText('Computer Science Program')).toBeInTheDocument();
    expect(screen.getByText('Code: CS-2023')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('Main Campus')).toBeInTheDocument();
    expect(screen.getByText('12 Courses')).toBeInTheDocument();
    expect(screen.getByText('150 Students')).toBeInTheDocument();
    
    // Check if action buttons are displayed
    expect(screen.getByText('View')).toBeInTheDocument();
    
    // Check that detailed information is not displayed
    expect(screen.queryByText('A comprehensive program covering computer science fundamentals')).not.toBeInTheDocument();
    expect(screen.queryByText('Created: Jan 15, 2023')).not.toBeInTheDocument();
  });

  it('calls onAction with correct parameters when action buttons are clicked', () => {
    render(
      <ProgramCard
        program={mockProgram}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Click the View button
    fireEvent.click(screen.getByText('View'));
    expect(mockActionHandler).toHaveBeenCalledWith(ProgramAction.VIEW, mockProgram);

    // Click the Edit button
    fireEvent.click(screen.getByText('Edit'));
    expect(mockActionHandler).toHaveBeenCalledWith(ProgramAction.EDIT, mockProgram);

    // Click the Delete button
    fireEvent.click(screen.getByText('Delete'));
    expect(mockActionHandler).toHaveBeenCalledWith(ProgramAction.DELETE, mockProgram);
  });

  it('shows different actions based on user role', () => {
    // Render for Coordinator role
    const { rerender } = render(
      <ProgramCard
        program={mockProgram}
        userRole={UserRole.COORDINATOR}
        onAction={mockActionHandler}
      />
    );

    // Coordinator should only see View button
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();

    // Re-render for Campus Admin role
    rerender(
      <ProgramCard
        program={mockProgram}
        userRole={UserRole.CAMPUS_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Campus Admin should see View and Edit buttons but not Delete
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('does not show institution and campus for non-admin roles', () => {
    render(
      <ProgramCard
        program={mockProgram}
        userRole={UserRole.COORDINATOR}
        onAction={mockActionHandler}
      />
    );

    // Institution should not be visible for Coordinator
    expect(screen.queryByText('Tech University')).not.toBeInTheDocument();
    
    // Campus should still be visible as it's relevant information
    expect(screen.getByText('Main Campus')).toBeInTheDocument();
  });
});
