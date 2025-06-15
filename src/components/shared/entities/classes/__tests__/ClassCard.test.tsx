import React from 'react';
import { render, screen } from '@testing-library/react';
import { ClassCard } from '../ClassCard';
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
  courseCampus: {
    id: 'cc-1',
    course: {
      id: 'course-1',
      name: 'Programming Fundamentals',
      code: 'PF-101',
    },
  },
  term: {
    id: 'term-1',
    name: 'Fall 2023',
    code: 'F23',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2023-12-31'),
  },
  _count: {
    students: 20,
  },
};

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ClassCard Component', () => {
  it('renders class name and code', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
      />
    );
    
    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByText('CL-101')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
      />
    );
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders course name', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
      />
    );
    
    expect(screen.getByText('Programming Fundamentals')).toBeInTheDocument();
  });

  it('renders student count', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
      />
    );
    
    expect(screen.getByText('20 Students')).toBeInTheDocument();
  });

  it('renders term name', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
      />
    );
    
    expect(screen.getByText('Fall 2023')).toBeInTheDocument();
  });

  it('renders view action button for teacher', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        actions={[ClassAction.VIEW]}
      />
    );
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('View Details').closest('a')).toHaveAttribute('href', '/teacher/classes/class-1');
  });

  it('renders in compact mode', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        viewMode="compact"
        actions={[ClassAction.VIEW]}
      />
    );
    
    // In compact mode, we should still see the class name and code
    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByText('CL-101')).toBeInTheDocument();
    
    // But we should not see the term name
    expect(screen.queryByText('Fall 2023')).not.toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        isLoading={true}
      />
    );
    
    // When loading, we should not see the class name
    expect(screen.queryByText('Introduction to Programming')).not.toBeInTheDocument();
  });

  it('renders different actions based on user role', () => {
    // System admin can see all actions
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.SYSTEM_ADMIN}
        actions={[ClassAction.VIEW, ClassAction.EDIT, ClassAction.DELETE]}
      />
    );
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    
    // Re-render with teacher role
    screen.unmount();
    render(
      <ClassCard
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        actions={[ClassAction.VIEW, ClassAction.EDIT, ClassAction.DELETE]}
      />
    );
    
    // Teacher should see View but not Edit or Delete
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
