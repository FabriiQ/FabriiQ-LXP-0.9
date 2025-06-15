import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClassSelector } from '../components/ClassSelector';
import { api } from '@/utils/api';
import { useSession } from 'next-auth/react';
// Mock the useResponsive hook that's defined in the component

// Mock the API and hooks
jest.mock('@/utils/api', () => ({
  api: {
    user: {
      getById: {
        useQuery: jest.fn()
      }
    },
    teacher: {
      getTeacherClasses: {
        useQuery: jest.fn()
      }
    }
  }
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));

// Mock the useResponsive hook that's defined in the component itself
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useState: jest.fn().mockImplementation(originalReact.useState),
    useEffect: jest.fn().mockImplementation((callback) => callback()),
  };
});

describe('ClassSelector', () => {
  const mockOnClassSelect = jest.fn();

  // Mock data
  const mockClasses = [
    {
      id: 'class1',
      name: 'Math Class',
      courseCampus: {
        course: {
          name: 'Mathematics'
        }
      },
      students: [{ id: 'student1' }, { id: 'student2' }]
    },
    {
      id: 'class2',
      name: 'Science Class',
      courseCampus: {
        course: {
          name: 'Science'
        }
      },
      students: [{ id: 'student1' }]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useSession
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user1'
        }
      }
    });

    // Mock useResponsive
    (useResponsive as jest.Mock).mockReturnValue({
      isMobile: false
    });

    // Mock user query
    (api.user.getById.useQuery as jest.Mock).mockReturnValue({
      data: {
        teacherProfile: {
          id: 'teacher1'
        }
      }
    });

    // Mock classes query
    (api.teacher.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: mockClasses,
      isLoading: false
    });
  });

  it('renders the class selector with default text', () => {
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);

    expect(screen.getByText('Select Class')).toBeInTheDocument();
  });

  it('shows loading state when classes are loading', () => {
    (api.teacher.getTeacherClasses.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true
    });

    render(<ClassSelector onClassSelect={mockOnClassSelect} />);

    expect(screen.getByText('Loading classes...')).toBeInTheDocument();
  });

  it('displays the selected class name when a class is selected', () => {
    render(<ClassSelector selectedClassId="class1" onClassSelect={mockOnClassSelect} />);

    expect(screen.getByText('Math Class')).toBeInTheDocument();
  });

  it('opens the popover when clicked', async () => {
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);

    // Click the button to open the popover
    fireEvent.click(screen.getByRole('combobox'));

    // Check if class options are displayed
    await waitFor(() => {
      expect(screen.getByText('Math Class')).toBeInTheDocument();
      expect(screen.getByText('Science Class')).toBeInTheDocument();
    });
  });

  it('calls onClassSelect when a class is selected', async () => {
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);

    // Click the button to open the popover
    fireEvent.click(screen.getByRole('combobox'));

    // Click on a class option
    await waitFor(() => {
      fireEvent.click(screen.getByText('Science Class'));
    });

    // Check if onClassSelect was called with the correct class ID
    expect(mockOnClassSelect).toHaveBeenCalledWith('class2');
  });

  it('filters classes based on search query', async () => {
    render(<ClassSelector onClassSelect={mockOnClassSelect} />);

    // Click the button to open the popover
    fireEvent.click(screen.getByRole('combobox'));

    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search classes...');
    fireEvent.change(searchInput, { target: { value: 'Science' } });

    // Check if only the matching class is displayed
    await waitFor(() => {
      expect(screen.getByText('Science Class')).toBeInTheDocument();
      expect(screen.queryByText('Math Class')).not.toBeInTheDocument();
    });
  });

  it('is disabled when the disabled prop is true', () => {
    render(<ClassSelector onClassSelect={mockOnClassSelect} disabled={true} />);

    expect(screen.getByRole('combobox')).toBeDisabled();
  });
});
