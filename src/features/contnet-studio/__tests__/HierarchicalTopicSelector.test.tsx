import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HierarchicalTopicSelector } from '../components/HierarchicalTopicSelector';
import { api } from '@/utils/api';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    subjectTopic: {
      list: {
        useQuery: jest.fn()
      }
    }
  }
}));

describe('HierarchicalTopicSelector', () => {
  const mockOnTopicsChange = jest.fn();
  
  // Mock data
  const mockTopics = [
    {
      id: 'topic1',
      title: 'Algebra',
      code: 'ALG',
      description: 'Basic algebra concepts',
      parentTopicId: null
    },
    {
      id: 'topic2',
      title: 'Linear Equations',
      code: 'LE',
      description: 'Solving linear equations',
      parentTopicId: 'topic1'
    },
    {
      id: 'topic3',
      title: 'Quadratic Equations',
      code: 'QE',
      description: 'Solving quadratic equations',
      parentTopicId: 'topic1'
    },
    {
      id: 'topic4',
      title: 'Geometry',
      code: 'GEO',
      description: 'Basic geometry concepts',
      parentTopicId: null
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock topics query
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: mockTopics,
      isLoading: false
    });
  });

  it('renders the topic selector with search input', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    expect(screen.getByPlaceholderText('Search topics...')).toBeInTheDocument();
  });

  it('shows loading state when topics are loading', () => {
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true
    });
    
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    // Check for loading skeletons
    const skeletons = document.querySelectorAll('.h-16.w-full');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays root level topics', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    expect(screen.getByText('Algebra')).toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();
    
    // Child topics should not be visible initially
    expect(screen.queryByText('Linear Equations')).not.toBeInTheDocument();
    expect(screen.queryByText('Quadratic Equations')).not.toBeInTheDocument();
  });

  it('expands topics when the expand button is clicked', async () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    // Find and click the expand button for Algebra
    const expandButtons = document.querySelectorAll('button');
    const algebraExpandButton = Array.from(expandButtons).find(
      button => button.parentElement?.textContent?.includes('Algebra')
    );
    
    if (algebraExpandButton) {
      fireEvent.click(algebraExpandButton);
    }
    
    // Child topics should now be visible
    await waitFor(() => {
      expect(screen.getByText('Linear Equations')).toBeInTheDocument();
      expect(screen.getByText('Quadratic Equations')).toBeInTheDocument();
    });
  });

  it('selects a topic when clicked', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    // Click on a topic
    fireEvent.click(screen.getByText('Algebra'));
    
    // Check if onTopicsChange was called with the correct topic ID
    expect(mockOnTopicsChange).toHaveBeenCalledWith(['topic1'], []);
  });

  it('deselects a topic when clicked again', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={['topic1']} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    // Click on the already selected topic
    fireEvent.click(screen.getByText('Algebra'));
    
    // Check if onTopicsChange was called with an empty array
    expect(mockOnTopicsChange).toHaveBeenCalledWith([], []);
  });

  it('filters topics based on search query', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search topics...');
    fireEvent.change(searchInput, { target: { value: 'linear' } });
    
    // Check if only the matching topic is displayed
    expect(screen.getByText('Linear Equations')).toBeInTheDocument();
    expect(screen.queryByText('Quadratic Equations')).not.toBeInTheDocument();
    expect(screen.queryByText('Algebra')).not.toBeInTheDocument();
    expect(screen.queryByText('Geometry')).not.toBeInTheDocument();
  });

  it('adds a custom topic', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    // Type in the custom topic input
    const customTopicInput = screen.getByPlaceholderText('Enter custom topic');
    fireEvent.change(customTopicInput, { target: { value: 'Custom Topic' } });
    
    // Click the add button
    fireEvent.click(screen.getByText('Add'));
    
    // Check if onTopicsChange was called with the custom topic
    expect(mockOnTopicsChange).toHaveBeenCalledWith([], ['Custom Topic']);
  });

  it('removes a custom topic', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        customTopics={['Custom Topic']} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    // Find and click the remove button for the custom topic
    const removeButtons = document.querySelectorAll('button');
    const customTopicRemoveButton = Array.from(removeButtons).find(
      button => button.parentElement?.textContent?.includes('Custom Topic')
    );
    
    if (customTopicRemoveButton) {
      fireEvent.click(customTopicRemoveButton);
    }
    
    // Check if onTopicsChange was called with an empty array
    expect(mockOnTopicsChange).toHaveBeenCalledWith([], []);
  });

  it('is disabled when the disabled prop is true', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject1" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
        disabled={true}
      />
    );
    
    // Check if the search input is disabled
    expect(screen.getByPlaceholderText('Search topics...')).toBeDisabled();
    
    // Check if the custom topic input is disabled
    expect(screen.getByPlaceholderText('Enter custom topic')).toBeDisabled();
    
    // Check if the add button is disabled
    expect(screen.getByText('Add')).toBeDisabled();
    
    // Click on a topic and verify onTopicsChange is not called
    fireEvent.click(screen.getByText('Algebra'));
    expect(mockOnTopicsChange).not.toHaveBeenCalled();
  });
});
