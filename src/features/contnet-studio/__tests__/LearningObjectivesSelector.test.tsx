import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LearningObjectivesSelector } from '../components/LearningObjectivesSelector';
import { api } from '@/utils/api';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    lessonPlan: {
      getSuggestedLearningObjectives: {
        useQuery: jest.fn()
      }
    }
  }
}));

describe('LearningObjectivesSelector', () => {
  const mockOnObjectivesChange = jest.fn();
  
  // Mock data
  const mockSuggestedObjectives = [
    'Understand the properties of linear equations',
    'Solve quadratic equations using factoring',
    'Apply algebraic concepts to real-world problems',
    'Identify different types of functions and their properties'
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock learning objectives query
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: mockSuggestedObjectives,
      isLoading: false,
      refetch: jest.fn()
    });
  });

  it('renders the learning objectives selector with suggested objectives', () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    expect(screen.getByText('Suggested Learning Objectives')).toBeInTheDocument();
    expect(screen.getByText('Add Custom Learning Objective')).toBeInTheDocument();
    
    // Check if suggested objectives are displayed
    expect(screen.getByText('Understand the properties of linear equations')).toBeInTheDocument();
    expect(screen.getByText('Solve quadratic equations using factoring')).toBeInTheDocument();
  });

  it('shows loading state when objectives are loading', () => {
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: jest.fn()
    });
    
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    expect(screen.getByText('Loading learning objectives...')).toBeInTheDocument();
  });

  it('auto-selects suggested objectives when they load and no objectives are selected', () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    // Check if onObjectivesChange was called with all suggested objectives
    expect(mockOnObjectivesChange).toHaveBeenCalledWith(mockSuggestedObjectives);
  });

  it('allows selecting suggested objectives', async () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    // Reset mock to clear the auto-selection call
    mockOnObjectivesChange.mockClear();
    
    // Find and check a checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    
    // Click the "Add Selected Objectives" button
    fireEvent.click(screen.getByText('Add Selected Objectives'));
    
    // Check if onObjectivesChange was called with the selected objective
    expect(mockOnObjectivesChange).toHaveBeenCalled();
  });

  it('adds a custom objective', () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    // Reset mock to clear the auto-selection call
    mockOnObjectivesChange.mockClear();
    
    // Type in the custom objective input
    const customObjectiveInput = screen.getByPlaceholderText('Enter learning objective');
    fireEvent.change(customObjectiveInput, { target: { value: 'Custom Learning Objective' } });
    
    // Click the add button
    const addButtons = screen.getAllByText('Add');
    const addCustomButton = addButtons.find(button => 
      button.parentElement?.textContent?.includes('Enter learning objective')
    );
    
    if (addCustomButton) {
      fireEvent.click(addCustomButton);
    }
    
    // Check if onObjectivesChange was called with the custom objective
    expect(mockOnObjectivesChange).toHaveBeenCalled();
    const lastCall = mockOnObjectivesChange.mock.calls[mockOnObjectivesChange.mock.calls.length - 1];
    expect(lastCall[0]).toContain('Custom Learning Objective');
  });

  it('removes an objective', async () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={['Existing Objective']} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    // Reset mock to clear any auto-selection calls
    mockOnObjectivesChange.mockClear();
    
    // Wait for the component to render the current objectives
    await waitFor(() => {
      expect(screen.getByText('Existing Objective')).toBeInTheDocument();
    });
    
    // Find and click the remove button
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    // Check if onObjectivesChange was called with an empty array
    expect(mockOnObjectivesChange).toHaveBeenCalledWith([]);
  });

  it('refreshes suggested objectives when the refresh button is clicked', () => {
    const mockRefetch = jest.fn();
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: mockSuggestedObjectives,
      isLoading: false,
      refetch: mockRefetch
    });
    
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    // Click the refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Check if refetch was called
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('is disabled when the disabled prop is true', () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={['Existing Objective']} 
        onObjectivesChange={mockOnObjectivesChange} 
        disabled={true}
      />
    );
    
    // Check if the refresh button is disabled
    expect(screen.getByText('Refresh')).toBeDisabled();
    
    // Check if the custom objective input is disabled
    expect(screen.getByPlaceholderText('Enter learning objective')).toBeDisabled();
    
    // Check if the add button is disabled
    const addButtons = screen.getAllByText('Add');
    const addCustomButton = addButtons.find(button => 
      button.parentElement?.textContent?.includes('Enter learning objective')
    );
    
    if (addCustomButton) {
      expect(addCustomButton).toBeDisabled();
    }
    
    // Check if checkboxes are disabled
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
  });
});
