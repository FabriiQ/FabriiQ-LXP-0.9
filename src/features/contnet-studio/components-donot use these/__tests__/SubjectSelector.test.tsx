import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubjectSelector } from '../SubjectSelector';
import { api } from '@/utils/api';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    subject: {
      list: {
        useQuery: jest.fn(),
      },
    },
    class: {
      getById: {
        useQuery: jest.fn(),
      },
      getSubjects: {
        useQuery: jest.fn(),
      },
    },
  },
}));

describe('SubjectSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (api.subject.list.useQuery as jest.Mock).mockReturnValue({
      data: { items: [] },
      isLoading: false,
    });

    (api.class.getSubjects.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (api.class.getById.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('renders loading state correctly', () => {
    (api.subject.list.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<SubjectSelector onSelect={mockOnSelect} />);

    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(6);
  });

  it('renders empty state when no subjects are available', () => {
    render(<SubjectSelector onSelect={mockOnSelect} />);

    expect(screen.getByText('No subjects available for this class')).toBeInTheDocument();
  });

  it('renders subjects correctly', () => {
    const mockSubjects = [
      { id: '1', name: 'Mathematics', code: 'MATH101' },
      { id: '2', name: 'Science', code: 'SCI101' },
    ];

    (api.subject.list.useQuery as jest.Mock).mockReturnValue({
      data: { items: mockSubjects },
      isLoading: false,
    });

    render(<SubjectSelector onSelect={mockOnSelect} />);

    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('MATH101')).toBeInTheDocument();
    expect(screen.getByText('SCI101')).toBeInTheDocument();
  });

  it('filters subjects based on search query', () => {
    const mockSubjects = [
      { id: '1', name: 'Mathematics', code: 'MATH101' },
      { id: '2', name: 'Science', code: 'SCI101' },
    ];

    (api.subject.list.useQuery as jest.Mock).mockReturnValue({
      data: { items: mockSubjects },
      isLoading: false,
    });

    render(<SubjectSelector onSelect={mockOnSelect} />);

    const searchInput = screen.getByPlaceholderText('Search subjects...');
    fireEvent.change(searchInput, { target: { value: 'math' } });

    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.queryByText('Science')).not.toBeInTheDocument();
  });

  it('calls onSelect when a subject is clicked', () => {
    const mockSubjects = [
      { id: '1', name: 'Mathematics', code: 'MATH101' },
    ];

    (api.subject.list.useQuery as jest.Mock).mockReturnValue({
      data: { items: mockSubjects },
      isLoading: false,
    });

    render(<SubjectSelector onSelect={mockOnSelect} />);

    const subjectCard = screen.getByText('Mathematics').closest('.cursor-pointer');
    fireEvent.click(subjectCard!);

    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('fetches class-specific subjects when classId is provided', () => {
    const mockClassSubjects = [
      { id: '1', name: 'Class Mathematics', code: 'CMATH101' },
    ];

    (api.class.getSubjects.useQuery as jest.Mock).mockReturnValue({
      data: mockClassSubjects,
      isLoading: false,
    });

    render(<SubjectSelector classId="class123" onSelect={mockOnSelect} />);

    expect(api.class.getSubjects.useQuery).toHaveBeenCalledWith(
      { classId: 'class123' },
      expect.any(Object)
    );

    expect(screen.getByText('Class Mathematics')).toBeInTheDocument();
    expect(screen.getByText('CMATH101')).toBeInTheDocument();
  });

  it('disables interaction when disabled prop is true', () => {
    const mockSubjects = [
      { id: '1', name: 'Mathematics', code: 'MATH101' },
    ];

    (api.subject.list.useQuery as jest.Mock).mockReturnValue({
      data: { items: mockSubjects },
      isLoading: false,
    });

    render(<SubjectSelector onSelect={mockOnSelect} disabled={true} />);

    const searchInput = screen.getByPlaceholderText('Search subjects...');
    expect(searchInput).toBeDisabled();

    const subjectCard = screen.getByText('Mathematics').closest('.cursor-pointer');
    fireEvent.click(subjectCard!);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});
