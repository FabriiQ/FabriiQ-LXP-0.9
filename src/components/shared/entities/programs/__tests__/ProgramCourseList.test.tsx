import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgramCourseList from '../ProgramCourseList';
import { ProgramData, CourseInProgram, UserRole, SystemStatus } from '../types';

// Mock program data
const mockProgram: ProgramData = {
  id: '1',
  name: 'Computer Science Program',
  code: 'CS-2023',
  status: SystemStatus.ACTIVE,
  campusName: 'Main Campus'
};

// Mock courses data
const mockCourses: CourseInProgram[] = [
  {
    id: '1',
    name: 'Introduction to Programming',
    code: 'CS101',
    subjectName: 'Computer Science',
    classCount: 3,
    studentCount: 45,
    status: SystemStatus.ACTIVE
  },
  {
    id: '2',
    name: 'Data Structures',
    code: 'CS201',
    subjectName: 'Computer Science',
    classCount: 2,
    studentCount: 30,
    status: SystemStatus.ACTIVE
  },
  {
    id: '3',
    name: 'Algorithms',
    code: 'CS301',
    subjectName: 'Computer Science',
    classCount: 1,
    studentCount: 25,
    status: SystemStatus.INACTIVE
  }
];

// Mock handlers
const mockViewCourse = jest.fn();
const mockEditCourse = jest.fn();
const mockRemoveCourse = jest.fn();
const mockAddCourse = jest.fn();

describe('ProgramCourseList Component', () => {
  beforeEach(() => {
    mockViewCourse.mockClear();
    mockEditCourse.mockClear();
    mockRemoveCourse.mockClear();
    mockAddCourse.mockClear();
  });

  it('renders course list correctly', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={mockCourses}
        userRole={UserRole.SYSTEM_ADMIN}
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );

    // Check if title is displayed
    expect(screen.getByText('Courses')).toBeInTheDocument();
    
    // Check if add button is displayed for admin
    expect(screen.getByText('Add Course')).toBeInTheDocument();
    
    // Check if courses are displayed
    expect(screen.getByText('Introduction to Programming')).toBeInTheDocument();
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    
    // Check if course details are displayed
    expect(screen.getByText('Code: CS101')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    
    // Check if status badges are displayed
    const activeStatuses = screen.getAllByText('ACTIVE');
    expect(activeStatuses.length).toBe(2);
    expect(screen.getByText('INACTIVE')).toBeInTheDocument();
  });

  it('filters courses based on search query', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={mockCourses}
        userRole={UserRole.SYSTEM_ADMIN}
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search courses...');
    fireEvent.change(searchInput, { target: { value: 'data' } });
    
    // Check if only matching course is displayed
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.queryByText('Introduction to Programming')).not.toBeInTheDocument();
    expect(screen.queryByText('Algorithms')).not.toBeInTheDocument();
  });

  it('shows empty state when no courses match search', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={mockCourses}
        userRole={UserRole.SYSTEM_ADMIN}
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );

    // Type in search box with no matches
    const searchInput = screen.getByPlaceholderText('Search courses...');
    fireEvent.change(searchInput, { target: { value: 'xyz' } });
    
    // Check if empty state is displayed
    expect(screen.getByText('No courses found')).toBeInTheDocument();
    expect(screen.getByText('No courses match your search criteria.')).toBeInTheDocument();
  });

  it('shows empty state when no courses exist', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={[]}
        userRole={UserRole.SYSTEM_ADMIN}
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );
    
    // Check if empty state is displayed
    expect(screen.getByText('No courses found')).toBeInTheDocument();
    expect(screen.getByText("This program doesn't have any courses yet.")).toBeInTheDocument();
  });

  it('calls action handlers when buttons are clicked', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={mockCourses}
        userRole={UserRole.SYSTEM_ADMIN}
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );

    // Click add course button
    fireEvent.click(screen.getByText('Add Course'));
    expect(mockAddCourse).toHaveBeenCalled();
    
    // Open dropdown menu for first course
    const dropdownButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dropdownButtons[0]);
    
    // Click view button
    fireEvent.click(screen.getByText('View'));
    expect(mockViewCourse).toHaveBeenCalledWith(mockCourses[0]);
    
    // Open dropdown menu again
    fireEvent.click(dropdownButtons[0]);
    
    // Click edit button
    fireEvent.click(screen.getByText('Edit'));
    expect(mockEditCourse).toHaveBeenCalledWith(mockCourses[0]);
    
    // Open dropdown menu again
    fireEvent.click(dropdownButtons[0]);
    
    // Click remove button
    fireEvent.click(screen.getByText('Remove'));
    expect(mockRemoveCourse).toHaveBeenCalledWith(mockCourses[0]);
  });

  it('hides edit actions for non-admin roles', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={mockCourses}
        userRole={UserRole.COORDINATOR}
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );

    // Add Course button should not be visible
    expect(screen.queryByText('Add Course')).not.toBeInTheDocument();
    
    // Open dropdown menu for first course
    const dropdownButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(dropdownButtons[0]);
    
    // View should be visible
    expect(screen.getByText('View')).toBeInTheDocument();
    
    // Edit and Remove should not be visible
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={mockCourses}
        userRole={UserRole.SYSTEM_ADMIN}
        isLoading={true}
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );

    // Check if title is displayed
    expect(screen.getByText('Courses')).toBeInTheDocument();
    
    // Check for skeletons
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Courses should not be visible
    expect(screen.queryByText('Introduction to Programming')).not.toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    render(
      <ProgramCourseList
        program={mockProgram}
        courses={mockCourses}
        userRole={UserRole.SYSTEM_ADMIN}
        error="Failed to load courses"
        onViewCourse={mockViewCourse}
        onEditCourse={mockEditCourse}
        onRemoveCourse={mockRemoveCourse}
        onAddCourse={mockAddCourse}
      />
    );

    // Check if title is displayed
    expect(screen.getByText('Courses')).toBeInTheDocument();
    
    // Check if error message is displayed
    expect(screen.getByText('Failed to load courses')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    
    // Courses should not be visible
    expect(screen.queryByText('Introduction to Programming')).not.toBeInTheDocument();
  });
});
