import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeacherList from '../TeacherList';
import { TeacherData, TeacherAction, UserRole, SystemStatus } from '../types';

// Mock teacher data
const mockTeachers: TeacherData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: SystemStatus.ACTIVE,
    campusName: 'Main Campus',
    classCount: 3
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    status: SystemStatus.INACTIVE,
    campusName: 'South Campus',
    classCount: 2
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    status: SystemStatus.ARCHIVED,
    campusName: 'East Campus',
    classCount: 0
  }
];

// Mock campuses and subjects
const mockCampuses = [
  { id: '1', name: 'Main Campus' },
  { id: '2', name: 'South Campus' },
  { id: '3', name: 'East Campus' }
];

const mockSubjects = [
  { id: '1', name: 'Mathematics' },
  { id: '2', name: 'Physics' },
  { id: '3', name: 'Chemistry' }
];

// Mock action and filter handlers
const mockActionHandler = jest.fn();
const mockFilterHandler = jest.fn();
const mockPageChangeHandler = jest.fn();

describe('TeacherList Component', () => {
  beforeEach(() => {
    mockActionHandler.mockClear();
    mockFilterHandler.mockClear();
    mockPageChangeHandler.mockClear();
  });

  it('renders teacher list correctly', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
        onFilterChange={mockFilterHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
      />
    );

    // Check if all teachers are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    
    // Check if count is displayed
    expect(screen.getByText(/Showing 3 teachers/)).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(
      <TeacherList
        teachers={[]}
        userRole={UserRole.SYSTEM_ADMIN}
        isLoading={true}
        onAction={mockActionHandler}
      />
    );

    // Check for skeletons
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state correctly', () => {
    render(
      <TeacherList
        teachers={[]}
        userRole={UserRole.SYSTEM_ADMIN}
        error="Failed to load teachers"
        onAction={mockActionHandler}
      />
    );

    // Check for error message
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load teachers')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(
      <TeacherList
        teachers={[]}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
        onFilterChange={mockFilterHandler}
      />
    );

    // Check for empty state message
    expect(screen.getByText('No teachers found')).toBeInTheDocument();
  });

  it('toggles between grid and list view', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Should start in grid view
    const gridButton = screen.getByLabelText('Grid view');
    const listButton = screen.getByLabelText('List view');
    
    // Click list view button
    fireEvent.click(listButton);
    
    // Click grid view button
    fireEvent.click(gridButton);
  });

  it('renders pagination correctly', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
        pagination={{
          currentPage: 2,
          totalPages: 5,
          onPageChange: mockPageChangeHandler
        }}
      />
    );

    // Check if pagination is displayed
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Current page
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Click on page 3
    fireEvent.click(screen.getByText('3'));
    expect(mockPageChangeHandler).toHaveBeenCalledWith(3);
    
    // Click on previous button
    fireEvent.click(screen.getByText('Previous'));
    expect(mockPageChangeHandler).toHaveBeenCalledWith(1);
    
    // Click on next button
    fireEvent.click(screen.getByText('Next'));
    expect(mockPageChangeHandler).toHaveBeenCalledWith(3);
  });

  it('calls onAction when a teacher action is triggered', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
      />
    );

    // Find the first View button and click it
    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    // Check if onAction was called with the correct parameters
    expect(mockActionHandler).toHaveBeenCalledWith(TeacherAction.VIEW, mockTeachers[0]);
  });

  it('calls onFilterChange when filters are changed', () => {
    render(
      <TeacherList
        teachers={mockTeachers}
        userRole={UserRole.SYSTEM_ADMIN}
        onAction={mockActionHandler}
        onFilterChange={mockFilterHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
      />
    );

    // Find the search input and type in it
    const searchInput = screen.getByPlaceholderText('Search teachers...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Check if onFilterChange was called with the correct parameters
    expect(mockFilterHandler).toHaveBeenCalledWith(expect.objectContaining({
      search: 'John'
    }));
  });
});
