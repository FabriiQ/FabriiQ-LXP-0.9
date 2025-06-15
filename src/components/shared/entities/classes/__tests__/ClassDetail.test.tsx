import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassDetail } from '../ClassDetail';
import { ClassData, UserRole, ClassAction } from '../types';
import { SystemStatus } from '@prisma/client';
import { TabsContent } from '@/components/ui/tabs';

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
  classTeacher: {
    id: 'teacher-1',
    user: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
  },
  facility: {
    id: 'facility-1',
    name: 'Computer Lab 1',
    code: 'CL1',
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

// Mock callbacks
const mockOnTabChange = jest.fn();
const mockOnAction = jest.fn();

describe('ClassDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders class information', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
      />
    );
    
    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByText('CL-101')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Programming Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Fall 2023')).toBeInTheDocument();
    expect(screen.getByText('Computer Lab 1')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('20 / 30')).toBeInTheDocument();
  });

  it('renders tabs based on tabs prop', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        tabs={['overview', 'students', 'attendance']}
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
        <TabsContent value="attendance">Attendance content</TabsContent>
      </ClassDetail>
    );
    
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /students/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /attendance/i })).toBeInTheDocument();
    expect(screen.getByText('Overview content')).toBeInTheDocument();
  });

  it('renders actions based on actions prop', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        actions={[ClassAction.EDIT, ClassAction.TAKE_ATTENDANCE]}
      />
    );
    
    expect(screen.getByRole('link', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /take attendance/i })).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        isLoading={true}
      />
    );
    
    // When loading, we should not see the class name
    expect(screen.queryByText('Introduction to Programming')).not.toBeInTheDocument();
  });

  it('renders error message when error is provided', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        error="Failed to load class data"
      />
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load class data')).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        tabs={['overview', 'students']}
        onTabChange={mockOnTabChange}
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
      </ClassDetail>
    );
    
    const studentsTab = screen.getByRole('tab', { name: /students/i });
    fireEvent.click(studentsTab);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('students');
  });

  it('calls onAction when an action is clicked', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        actions={[ClassAction.EDIT]}
        onAction={mockOnAction}
      />
    );
    
    const editButton = screen.getByRole('link', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(mockOnAction).toHaveBeenCalledWith(ClassAction.EDIT, mockClassData);
  });

  it('renders tab content when tab is selected', () => {
    render(
      <ClassDetail
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        tabs={['overview', 'students']}
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
      </ClassDetail>
    );
    
    // Initially, overview tab should be active
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    expect(screen.queryByText('Students content')).not.toBeInTheDocument();
    
    // Click on students tab
    const studentsTab = screen.getByRole('tab', { name: /students/i });
    fireEvent.click(studentsTab);
    
    // Now students tab should be active
    expect(screen.queryByText('Overview content')).not.toBeInTheDocument();
    expect(screen.getByText('Students content')).toBeInTheDocument();
  });
});
