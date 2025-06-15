import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClassSelector } from '../ClassSelector';
import { api } from '@/utils/api';
import { useSession } from 'next-auth/react';

// Mock the API and next-auth
jest.mock('@/utils/api', () => ({
  api: {
    user: {
      getById: {
        useQuery: jest.fn(),
      },
    },
    class: {
      getTeacherClasses: {
        useQuery: jest.fn(),
      },
    },
  },
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('ClassSelector', () => {
  const mockOnClassSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: 'user123' } },
      status: 'authenticated',
    });
    
    (api.user.getById.useQuery as jest.Mock).mockReturnValue({
      data: { teacherProfile: { id: 'teacher123' } },
    });
    
    (api.class.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
  });
  
  it('renders loading state correctly', () => {
    (api.class.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });
    
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);
    
    expect(screen.getByText('Loading classes...')).toBeInTheDocument();
  });
  
  it('shows empty state when no classes are available', () => {
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);
    
    fireEvent.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('You don\'t have any classes assigned yet')).toBeInTheDocument();
  });
  
  it('renders classes correctly', () => {
    const mockClasses = [
      { id: '1', name: 'Class A', code: 'CA101' },
      { id: '2', name: 'Class B', code: 'CB101' },
    ];
    
    (api.class.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: mockClasses,
      isLoading: false,
    });
    
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);
    
    fireEvent.click(screen.getByRole('combobox'));
    
    expect(screen.getByText('Class A')).toBeInTheDocument();
    expect(screen.getByText('Class B')).toBeInTheDocument();
    expect(screen.getByText('CA101')).toBeInTheDocument();
    expect(screen.getByText('CB101')).toBeInTheDocument();
  });
  
  it('filters classes based on search query', () => {
    const mockClasses = [
      { id: '1', name: 'Class A', code: 'CA101' },
      { id: '2', name: 'Class B', code: 'CB101' },
    ];
    
    (api.class.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: mockClasses,
      isLoading: false,
    });
    
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);
    
    fireEvent.click(screen.getByRole('combobox'));
    
    const searchInput = screen.getByPlaceholderText('Search classes...');
    fireEvent.change(searchInput, { target: { value: 'Class A' } });
    
    expect(screen.getByText('Class A')).toBeInTheDocument();
    expect(screen.queryByText('Class B')).not.toBeInTheDocument();
  });
  
  it('calls onClassSelect when a class is selected', () => {
    const mockClasses = [
      { id: '1', name: 'Class A', code: 'CA101' },
    ];
    
    (api.class.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: mockClasses,
      isLoading: false,
    });
    
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);
    
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Class A'));
    
    expect(mockOnClassSelect).toHaveBeenCalledWith('1');
  });
  
  it('displays selected class name', () => {
    const mockClasses = [
      { id: '1', name: 'Class A', code: 'CA101' },
      { id: '2', name: 'Class B', code: 'CB101' },
    ];
    
    (api.class.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: mockClasses,
      isLoading: false,
    });
    
    render(<ClassSelector selectedClassId="1" onClassSelect={mockOnClassSelect} />);
    
    expect(screen.getByText('Class A')).toBeInTheDocument();
  });
  
  it('disables interaction when disabled prop is true', () => {
    render(<ClassSelector onClassSelect={mockOnClassSelect} disabled={true} />);
    
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeDisabled();
  });
});
