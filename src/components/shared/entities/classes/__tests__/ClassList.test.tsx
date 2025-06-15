import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassList } from '../ClassList';
import { ClassData, UserRole, ClassAction } from '../types';
import { SystemStatus } from '@prisma/client';

// Mock data for testing
const mockClasses: ClassData[] = [
  {
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
  },
  {
    id: 'class-2',
    code: 'CL-102',
    name: 'Data Structures',
    minCapacity: 10,
    maxCapacity: 30,
    currentCount: 15,
    status: SystemStatus.UPCOMING,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    courseCampusId: 'cc-2',
    termId: 'term-1',
    campusId: 'campus-1',
    courseCampus: {
      id: 'cc-2',
      course: {
        id: 'course-2',
        name: 'Data Structures',
        code: 'DS-101',
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
      students: 15,
    },
  },
];

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock onAction callback
const mockOnAction = jest.fn();

// Mock pagination callback
const mockOnPageChange = jest.fn();

// Mock sort callback
const mockOnSortChange = jest.fn();

// Mock view mode change callback
const mockOnViewModeChange = jest.fn();

describe('ClassList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders grid view by default', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
      />
    );
    
    // In grid view, we should see class cards
    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
  });

  it('renders table view when viewMode is table', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        viewMode="table"
      />
    );
    
    // In table view, we should see a table with headers
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Class Name')).toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Term')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders empty state when no classes are provided', () => {
    render(
      <ClassList
        classes={[]}
        userRole={UserRole.TEACHER}
      />
    );
    
    expect(screen.getByText('No classes found')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        isLoading={true}
      />
    );
    
    // When loading, we should not see the class names
    expect(screen.queryByText('Introduction to Programming')).not.toBeInTheDocument();
    expect(screen.queryByText('Data Structures')).not.toBeInTheDocument();
  });

  it('renders pagination controls when pagination is provided', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        pagination={{
          currentPage: 1,
          totalPages: 5,
          pageSize: 10,
          totalItems: 50,
          onPageChange: mockOnPageChange,
        }}
      />
    );
    
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 10 of 50 classes')).toBeInTheDocument();
  });

  it('calls onPageChange when pagination controls are clicked', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        pagination={{
          currentPage: 1,
          totalPages: 5,
          pageSize: 10,
          totalItems: 50,
          onPageChange: mockOnPageChange,
        }}
      />
    );
    
    // Click the next page button
    const nextPageButton = screen.getAllByRole('button')[3]; // Next page is the 4th button
    fireEvent.click(nextPageButton);
    
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('renders sortable columns when sorting is provided', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        viewMode="table"
        sorting={{
          column: 'name',
          direction: 'asc',
          onSortChange: mockOnSortChange,
        }}
      />
    );
    
    // Find the class name column header button
    const classNameHeader = screen.getByRole('button', { name: /class name/i });
    expect(classNameHeader).toBeInTheDocument();
    
    // Click the header to sort
    fireEvent.click(classNameHeader);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('name', 'desc');
  });

  it('calls onViewModeChange when view mode is changed', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        onViewModeChange={mockOnViewModeChange}
      />
    );
    
    // Find the table view button
    const tableViewButton = screen.getAllByRole('button')[1]; // Table view is the 2nd button
    fireEvent.click(tableViewButton);
    
    expect(mockOnViewModeChange).toHaveBeenCalledWith('table');
  });

  it('renders actions for each class', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        actions={[ClassAction.VIEW, ClassAction.TAKE_ATTENDANCE]}
        onAction={mockOnAction}
      />
    );
    
    // In grid view, we should see action buttons
    const viewButtons = screen.getAllByText('View Details');
    expect(viewButtons.length).toBe(2);
  });

  it('calls onAction when an action is clicked', () => {
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        viewMode="table"
        actions={[ClassAction.VIEW]}
        onAction={mockOnAction}
      />
    );
    
    // Find the view action button in the table
    const viewButton = screen.getAllByRole('link')[0];
    fireEvent.click(viewButton);
    
    expect(mockOnAction).toHaveBeenCalledWith(ClassAction.VIEW, mockClasses[0]);
  });

  it('renders custom columns when provided', () => {
    const customColumns = [
      {
        id: 'name',
        header: 'Custom Name',
        accessorKey: 'name',
        sortable: true,
      },
      {
        id: 'custom',
        header: 'Custom Column',
        cell: () => <span>Custom Content</span>,
        sortable: false,
      },
    ];
    
    render(
      <ClassList
        classes={mockClasses}
        userRole={UserRole.TEACHER}
        viewMode="table"
        columns={customColumns}
      />
    );
    
    expect(screen.getByText('Custom Name')).toBeInTheDocument();
    expect(screen.getByText('Custom Column')).toBeInTheDocument();
    expect(screen.getAllByText('Custom Content').length).toBe(2);
  });
});
