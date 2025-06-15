import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HierarchicalTopicSelector } from '../HierarchicalTopicSelector';
import { api } from '@/utils/api';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    subjectTopic: {
      list: {
        useQuery: jest.fn(),
      },
    },
  },
}));

describe('HierarchicalTopicSelector', () => {
  const mockOnTopicsChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
  });
  
  it('renders loading state correctly', () => {
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });
    
    render(
      <HierarchicalTopicSelector 
        subjectId="subject123" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    expect(screen.getAllByTestId('loading-skeleton')).toHaveLength(6);
  });
  
  it('shows message when no subject is selected', () => {
    render(
      <HierarchicalTopicSelector 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    expect(screen.getByText('Please select a subject first to view topics')).toBeInTheDocument();
  });
  
  it('shows message when no topics are available', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject123" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    expect(screen.getByText('No topics available for this subject. You can add custom topics below.')).toBeInTheDocument();
  });
  
  it('renders topics correctly', () => {
    const mockTopics = [
      { 
        id: '1', 
        title: 'Chapter 1', 
        code: 'CH1', 
        nodeType: 'CHAPTER',
        parentTopicId: null 
      },
      { 
        id: '2', 
        title: 'Topic 1.1', 
        code: 'T1.1', 
        nodeType: 'TOPIC',
        parentTopicId: '1' 
      },
    ];
    
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: { data: mockTopics },
      isLoading: false,
    });
    
    render(
      <HierarchicalTopicSelector 
        subjectId="subject123" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('CH1')).toBeInTheDocument();
  });
  
  it('allows topic selection', () => {
    const mockTopics = [
      { 
        id: '1', 
        title: 'Chapter 1', 
        code: 'CH1', 
        nodeType: 'CHAPTER',
        parentTopicId: null 
      },
    ];
    
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: { data: mockTopics },
      isLoading: false,
    });
    
    render(
      <HierarchicalTopicSelector 
        subjectId="subject123" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    const topicCard = screen.getByText('Chapter 1').closest('.cursor-pointer');
    fireEvent.click(topicCard!);
    
    expect(mockOnTopicsChange).toHaveBeenCalledWith(['1'], []);
  });
  
  it('allows adding custom topics', () => {
    render(
      <HierarchicalTopicSelector 
        subjectId="subject123" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    const customTopicInput = screen.getByPlaceholderText('Enter custom topic');
    fireEvent.change(customTopicInput, { target: { value: 'Custom Topic' } });
    
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    expect(mockOnTopicsChange).toHaveBeenCalledWith([], ['Custom Topic']);
  });
  
  it('filters topics based on search query', () => {
    const mockTopics = [
      { 
        id: '1', 
        title: 'Chapter 1', 
        code: 'CH1', 
        nodeType: 'CHAPTER',
        parentTopicId: null 
      },
      { 
        id: '2', 
        title: 'Chapter 2', 
        code: 'CH2', 
        nodeType: 'CHAPTER',
        parentTopicId: null 
      },
    ];
    
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: { data: mockTopics },
      isLoading: false,
    });
    
    render(
      <HierarchicalTopicSelector 
        subjectId="subject123" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange} 
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search topics...');
    fireEvent.change(searchInput, { target: { value: 'Chapter 1' } });
    
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.queryByText('Chapter 2')).not.toBeInTheDocument();
  });
  
  it('disables interaction when disabled prop is true', () => {
    const mockTopics = [
      { 
        id: '1', 
        title: 'Chapter 1', 
        code: 'CH1', 
        nodeType: 'CHAPTER',
        parentTopicId: null 
      },
    ];
    
    (api.subjectTopic.list.useQuery as jest.Mock).mockReturnValue({
      data: { data: mockTopics },
      isLoading: false,
    });
    
    render(
      <HierarchicalTopicSelector 
        subjectId="subject123" 
        selectedTopicIds={[]} 
        onTopicsChange={mockOnTopicsChange}
        disabled={true}
      />
    );
    
    const searchInput = screen.getByPlaceholderText('Search topics...');
    expect(searchInput).toBeDisabled();
    
    const topicCard = screen.getByText('Chapter 1').closest('.cursor-pointer');
    fireEvent.click(topicCard!);
    
    expect(mockOnTopicsChange).not.toHaveBeenCalled();
  });
});
