import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeacherFilters from '../TeacherFilters';
import { UserRole, SystemStatus } from '../types';

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

// Mock filter change handler
const mockFilterChangeHandler = jest.fn();

describe('TeacherFilters Component', () => {
  beforeEach(() => {
    mockFilterChangeHandler.mockClear();
  });

  it('renders compact filter view correctly', () => {
    render(
      <TeacherFilters
        userRole={UserRole.SYSTEM_ADMIN}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={true}
      />
    );

    // Check if search input is displayed
    expect(screen.getByPlaceholderText('Search teachers...')).toBeInTheDocument();
    
    // Check if filter button is displayed
    const filterButton = screen.getByRole('button', { name: /filter/i });
    expect(filterButton).toBeInTheDocument();
    
    // Check if sort button is displayed
    const sortButton = screen.getByRole('button', { name: /sort/i });
    expect(sortButton).toBeInTheDocument();
  });

  it('renders full filter view correctly', () => {
    render(
      <TeacherFilters
        userRole={UserRole.SYSTEM_ADMIN}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={false}
      />
    );

    // Check if search input is displayed
    expect(screen.getByPlaceholderText('Search teachers...')).toBeInTheDocument();
    
    // Check if filter sections are displayed
    expect(screen.getByText('Filter Teachers')).toBeInTheDocument();
    expect(screen.getByText('Campus')).toBeInTheDocument();
    expect(screen.getByText('Subject')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
    
    // Check if buttons are displayed
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Apply Filters')).toBeInTheDocument();
  });

  it('shows campus filter only for System Admin', () => {
    // Render for System Admin
    const { rerender } = render(
      <TeacherFilters
        userRole={UserRole.SYSTEM_ADMIN}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={false}
      />
    );

    // Campus filter should be visible
    expect(screen.getByText('Campus')).toBeInTheDocument();

    // Re-render for Campus Admin
    rerender(
      <TeacherFilters
        userRole={UserRole.CAMPUS_ADMIN}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={false}
      />
    );

    // Campus filter should not be visible
    expect(screen.queryByText('Campus')).not.toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    render(
      <TeacherFilters
        userRole={UserRole.SYSTEM_ADMIN}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={true}
      />
    );

    // Find the search input and type in it
    const searchInput = screen.getByPlaceholderText('Search teachers...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Check if onFilterChange was called with the correct parameters
    expect(mockFilterChangeHandler).toHaveBeenCalledWith(expect.objectContaining({
      search: 'John'
    }));
  });

  it('opens filter popover when filter button is clicked in compact mode', () => {
    render(
      <TeacherFilters
        userRole={UserRole.SYSTEM_ADMIN}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={true}
      />
    );

    // Find the filter button and click it
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    // Check if filter popover is displayed
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('resets filters when reset button is clicked', () => {
    render(
      <TeacherFilters
        userRole={UserRole.SYSTEM_ADMIN}
        initialFilters={{ search: 'John' }}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={false}
      />
    );

    // Find the reset button and click it
    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);
    
    // Check if onFilterChange was called with empty filters
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({});
  });

  it('displays active filter badges in compact mode', async () => {
    render(
      <TeacherFilters
        userRole={UserRole.SYSTEM_ADMIN}
        initialFilters={{ 
          status: [SystemStatus.ACTIVE, SystemStatus.INACTIVE] 
        }}
        onFilterChange={mockFilterChangeHandler}
        campuses={mockCampuses}
        subjects={mockSubjects}
        compact={true}
      />
    );

    // Check if status filter badge is displayed
    expect(screen.getByText('Status: 2')).toBeInTheDocument();
    
    // Find the clear button and click it
    const clearButton = screen.getByText('Clear all');
    fireEvent.click(clearButton);
    
    // Check if onFilterChange was called with empty filters
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({});
  });
});
