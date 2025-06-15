import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClassFilters, ClassFiltersState } from '../ClassFilters';
import { UserRole } from '../types';

// Mock onFilterChange callback
const mockOnFilterChange = jest.fn();

// Mock filter options
const mockFilterOptions = {
  terms: [
    { id: 'term-1', name: 'Fall 2023' },
    { id: 'term-2', name: 'Spring 2024' },
  ],
  programs: [
    { id: 'program-1', name: 'Computer Science' },
    { id: 'program-2', name: 'Business Administration' },
  ],
  courses: [
    { id: 'course-1', name: 'Programming Fundamentals' },
    { id: 'course-2', name: 'Data Structures' },
  ],
  teachers: [
    { id: 'teacher-1', name: 'John Doe' },
    { id: 'teacher-2', name: 'Jane Smith' },
  ],
  daysOfWeek: [
    { id: 'monday', name: 'Monday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'friday', name: 'Friday' },
  ],
  timesOfDay: [
    { id: 'morning', name: 'Morning' },
    { id: 'afternoon', name: 'Afternoon' },
    { id: 'evening', name: 'Evening' },
  ],
};

describe('ClassFilters Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search form', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    expect(screen.getByPlaceholderText('Search classes...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('calls onFilterChange when search is submitted', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search classes...');
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(searchInput, { target: { value: 'programming' } });
    fireEvent.click(searchButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({ search: 'programming' });
  });

  it('renders status filter', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders term filter for teacher role', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    expect(screen.getByText('Term')).toBeInTheDocument();
  });

  it('renders course filter for teacher role', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    expect(screen.getByText('Course')).toBeInTheDocument();
  });

  it('does not render program filter for teacher role', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    expect(screen.queryByText('Program')).not.toBeInTheDocument();
  });

  it('renders all filters for system admin role', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.SYSTEM_ADMIN}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Term')).toBeInTheDocument();
    expect(screen.getByText('Program')).toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Teacher')).toBeInTheDocument();
    expect(screen.getByText('Day of Week')).toBeInTheDocument();
    expect(screen.getByText('Time of Day')).toBeInTheDocument();
  });

  it('renders active filter chips', () => {
    const activeFilters: ClassFiltersState = {
      search: 'programming',
      status: 'ACTIVE',
      termId: 'term-1',
    };
    
    render(
      <ClassFilters
        filters={activeFilters}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    expect(screen.getByText('Search: programming')).toBeInTheDocument();
    expect(screen.getByText('Status: Active')).toBeInTheDocument();
    expect(screen.getByText('Term: Fall 2023')).toBeInTheDocument();
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('calls onFilterChange when clear all is clicked', () => {
    const activeFilters: ClassFiltersState = {
      search: 'programming',
      status: 'ACTIVE',
      termId: 'term-1',
    };
    
    render(
      <ClassFilters
        filters={activeFilters}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    const clearAllButton = screen.getByText('Clear all');
    fireEvent.click(clearAllButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
  });

  it('calls onFilterChange when a filter chip is removed', () => {
    const activeFilters: ClassFiltersState = {
      search: 'programming',
      status: 'ACTIVE',
      termId: 'term-1',
    };
    
    render(
      <ClassFilters
        filters={activeFilters}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
      />
    );
    
    // Find the remove button for the status filter
    const removeButtons = screen.getAllByRole('button', { name: /remove filter/i });
    const statusRemoveButton = removeButtons[1]; // Status is the second filter
    
    fireEvent.click(statusRemoveButton);
    
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: 'programming',
      termId: 'term-1',
    });
  });

  it('renders in vertical layout', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
        layout="vertical"
      />
    );
    
    // In vertical layout, filters should be stacked
    const filterControls = screen.getByPlaceholderText('Search classes...').closest('div');
    expect(filterControls).toHaveClass('space-y-4');
  });

  it('renders in dropdown layout', () => {
    render(
      <ClassFilters
        filters={{}}
        userRole={UserRole.TEACHER}
        availableFilters={mockFilterOptions}
        onFilterChange={mockOnFilterChange}
        layout="dropdown"
      />
    );
    
    // In dropdown layout, there should be a filters button
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });
});
