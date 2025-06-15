import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubjectSelector } from '../components/SubjectSelector';
import { api } from '@/utils/api';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    subject: {
      getAllSubjects: {
        useQuery: jest.fn()
      }
    }
  }
}));

describe('SubjectSelector', () => {
  const mockOnSelect = jest.fn();
  
  // Mock data
  const mockSubjects = [
    {
      id: 'subject1',
      name: 'Mathematics',
      code: 'MATH101'
    },
    {
      id: 'subject2',
      name: 'Science',
      code: 'SCI101'
    },
    {
      id: 'subject3',
      name: 'English',
      code: 'ENG101'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock subjects query
    (api.subject.getAllSubjects.useQuery as jest.Mock).mockReturnValue({
      data: mockSubjects,
      isLoading: false
    });
  });

  it('renders the subject selector with search input', () => {
    render(<SubjectSelector classId="class1" onSelect={mockOnSelect} />);
    
    expect(screen.getByPlaceholderText('Search subjects...')).toBeInTheDocument();
  });

  it('shows loading state when subjects are loading', () => {
    (api.subject.getAllSubjects.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true
    });
    
    render(<SubjectSelector classId="class1" onSelect={mockOnSelect} />);
    
    // Check for loading skeletons
    const skeletons = document.querySelectorAll('.cursor-not-allowed');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays all subjects when loaded', () => {
    render(<SubjectSelector classId="class1" onSelect={mockOnSelect} />);
    
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    
    expect(screen.getByText('MATH101')).toBeInTheDocument();
    expect(screen.getByText('SCI101')).toBeInTheDocument();
    expect(screen.getByText('ENG101')).toBeInTheDocument();
  });

  it('filters subjects based on search query', () => {
    render(<SubjectSelector classId="class1" onSelect={mockOnSelect} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search subjects...');
    fireEvent.change(searchInput, { target: { value: 'math' } });
    
    // Check if only the matching subject is displayed
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.queryByText('Science')).not.toBeInTheDocument();
    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('calls onSelect when a subject is clicked', () => {
    render(<SubjectSelector classId="class1" onSelect={mockOnSelect} />);
    
    // Click on a subject
    fireEvent.click(screen.getByText('Science'));
    
    // Check if onSelect was called with the correct subject ID
    expect(mockOnSelect).toHaveBeenCalledWith('subject2');
  });

  it('highlights the selected subject', () => {
    render(<SubjectSelector classId="class1" selectedSubjectId="subject1" onSelect={mockOnSelect} />);
    
    // Check if the selected subject has the correct styling
    const selectedSubject = screen.getByText('Mathematics').closest('.border-primary');
    expect(selectedSubject).toBeInTheDocument();
  });

  it('shows a message when no subjects match the search query', () => {
    render(<SubjectSelector classId="class1" onSelect={mockOnSelect} />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search subjects...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // Check if the no results message is displayed
    expect(screen.getByText('No subjects found matching "nonexistent"')).toBeInTheDocument();
  });

  it('is disabled when the disabled prop is true', () => {
    render(<SubjectSelector classId="class1" onSelect={mockOnSelect} disabled={true} />);
    
    // Check if the search input is disabled
    expect(screen.getByPlaceholderText('Search subjects...')).toBeDisabled();
    
    // Check if subjects are visually disabled
    const subjects = document.querySelectorAll('.opacity-50.cursor-not-allowed');
    expect(subjects.length).toBeGreaterThan(0);
    
    // Click on a subject and verify onSelect is not called
    fireEvent.click(screen.getByText('Science'));
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});
