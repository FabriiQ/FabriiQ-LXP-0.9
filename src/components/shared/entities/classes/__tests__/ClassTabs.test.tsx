import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassTabs } from '../ClassTabs';
import { ClassData, UserRole } from '../types';
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
};

// Mock onTabChange callback
const mockOnTabChange = jest.fn();

describe('ClassTabs Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tabs based on enabledTabs prop', () => {
    render(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledTabs={['overview', 'students', 'attendance']}
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
        <TabsContent value="attendance">Attendance content</TabsContent>
      </ClassTabs>
    );
    
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /students/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /attendance/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /assessments/i })).not.toBeInTheDocument();
  });

  it('renders tab content for the active tab', () => {
    render(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledTabs={['overview', 'students']}
        activeTab="overview"
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
      </ClassTabs>
    );
    
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    expect(screen.queryByText('Students content')).not.toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', () => {
    render(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledTabs={['overview', 'students']}
        activeTab="overview"
        onTabChange={mockOnTabChange}
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
      </ClassTabs>
    );
    
    const studentsTab = screen.getByRole('tab', { name: /students/i });
    fireEvent.click(studentsTab);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('students');
  });

  it('filters tabs based on user role', () => {
    render(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.STUDENT}
        enabledTabs={['overview', 'students', 'attendance', 'settings']}
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
        <TabsContent value="attendance">Attendance content</TabsContent>
        <TabsContent value="settings">Settings content</TabsContent>
      </ClassTabs>
    );
    
    // Students should see overview and attendance tabs, but not students or settings
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /attendance/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /students/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /settings/i })).not.toBeInTheDocument();
  });

  it('renders custom tabs', () => {
    const customTabs = [
      {
        id: 'custom-tab',
        label: 'Custom Tab',
        icon: <span>Icon</span>,
        roles: [UserRole.TEACHER],
      },
    ];
    
    render(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledTabs={['overview', 'custom-tab']}
        customTabs={customTabs}
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="custom-tab">Custom tab content</TabsContent>
      </ClassTabs>
    );
    
    expect(screen.getByRole('tab', { name: /custom tab/i })).toBeInTheDocument();
  });

  it('renders nothing when no tabs are visible', () => {
    const { container } = render(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.STUDENT}
        enabledTabs={['students', 'settings']} // Student can't see these tabs
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('updates active tab when activeTab prop changes', () => {
    const { rerender } = render(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledTabs={['overview', 'students']}
        activeTab="overview"
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
      </ClassTabs>
    );
    
    expect(screen.getByText('Overview content')).toBeInTheDocument();
    
    rerender(
      <ClassTabs
        classData={mockClassData}
        userRole={UserRole.TEACHER}
        enabledTabs={['overview', 'students']}
        activeTab="students"
      >
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="students">Students content</TabsContent>
      </ClassTabs>
    );
    
    expect(screen.getByText('Students content')).toBeInTheDocument();
  });
});
