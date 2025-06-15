import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassActions } from '../ClassActions';
import { ClassData, UserRole, ClassAction } from '../types';
import { SystemStatus } from '@prisma/client';

// Mock data for testing
const mockClassData: ClassData = {
  id: 'class-1',
  code: 'CL-101',
  name: 'Introduction to Programming',
  minCapacity: 10,
  maxCapacity: 30,
  currentCount: 20,
  status: SystemStatus.ACTIVE,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  courseCampusId: 'cc-1',
  termId: 'term-1',
  campusId: 'campus-1',
};

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock onAction callback
const mockOnAction = jest.fn();

describe('ClassActions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders no actions when enabledActions is empty', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledActions={[]}
      />
    );
    
    // No actions should be rendered
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders view action for teacher', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledActions={[ClassAction.VIEW]}
      />
    );
    
    // View action should be rendered
    const viewButton = screen.getByRole('link', { name: /view/i });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveAttribute('href', '/teacher/classes/class-1');
  });

  it('renders take attendance action for teacher', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledActions={[ClassAction.TAKE_ATTENDANCE]}
      />
    );
    
    // Take attendance action should be rendered
    const attendanceButton = screen.getByRole('link', { name: /take attendance/i });
    expect(attendanceButton).toBeInTheDocument();
    expect(attendanceButton).toHaveAttribute('href', '/teacher/classes/class-1/take-attendance');
  });

  it('does not render edit action for teacher', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledActions={[ClassAction.EDIT]}
      />
    );
    
    // Edit action should not be rendered for teacher
    expect(screen.queryByRole('link', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('renders edit action for system admin', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.SYSTEM_ADMIN}
        enabledActions={[ClassAction.EDIT]}
      />
    );
    
    // Edit action should be rendered for system admin
    const editButton = screen.getByRole('link', { name: /edit/i });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute('href', '/admin/system/classes/class-1/edit');
  });

  it('renders actions in card placement', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.SYSTEM_ADMIN}
        enabledActions={[ClassAction.VIEW, ClassAction.EDIT]}
        placement="card"
      />
    );
    
    // Actions should be rendered as a list
    const viewButton = screen.getByRole('link', { name: /view details/i });
    const editButton = screen.getByRole('link', { name: /edit/i });
    
    expect(viewButton).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
  });

  it('renders actions in list placement', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.SYSTEM_ADMIN}
        enabledActions={[ClassAction.VIEW, ClassAction.EDIT]}
        placement="list"
      />
    );
    
    // Actions should be rendered as a dropdown
    const dropdownButton = screen.getByRole('button');
    expect(dropdownButton).toBeInTheDocument();
  });

  it('renders actions in detail placement', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.SYSTEM_ADMIN}
        enabledActions={[ClassAction.VIEW, ClassAction.EDIT]}
        placement="detail"
      />
    );
    
    // Primary action should be rendered as a button
    const viewButton = screen.getByRole('link', { name: /view details/i });
    expect(viewButton).toBeInTheDocument();
    
    // Secondary actions should be in a dropdown
    const dropdownButton = screen.getByRole('button');
    expect(dropdownButton).toBeInTheDocument();
  });

  it('calls onAction when action is clicked', () => {
    render(
      <ClassActions
        classData={mockClassData}
        userRole={UserRole.SYSTEM_ADMIN}
        enabledActions={[ClassAction.VIEW]}
        onAction={mockOnAction}
      />
    );
    
    // Click the view button
    const viewButton = screen.getByRole('link', { name: /view details/i });
    fireEvent.click(viewButton);
    
    // onAction should be called with VIEW action and class data
    expect(mockOnAction).toHaveBeenCalledWith(ClassAction.VIEW, mockClassData);
  });
});
