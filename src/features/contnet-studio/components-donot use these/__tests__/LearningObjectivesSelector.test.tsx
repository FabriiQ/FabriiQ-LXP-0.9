import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LearningObjectivesSelector } from '../LearningObjectivesSelector';
import { api } from '@/utils/api';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    lessonPlan: {
      getSuggestedLearningObjectives: {
        useQuery: jest.fn(),
      },
    },
  },
}));

describe('LearningObjectivesSelector', () => {
  const mockOnObjectivesChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });
  });
  
  it('renders loading state correctly', () => {
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      refetch: jest.fn(),
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
  
  it('shows message when no learning objectives are found', () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    expect(screen.getByText('No learning objectives found for the selected topics. Try selecting different topics or add custom objectives below.')).toBeInTheDocument();
  });
  
  it('renders suggested learning objectives correctly', () => {
    const mockObjectives = [
      'Understand the concept of addition',
      'Apply multiplication to solve problems',
    ];
    
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: mockObjectives,
      isLoading: false,
      refetch: jest.fn(),
    });
    
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    expect(screen.getByText('Understand the concept of addition')).toBeInTheDocument();
    expect(screen.getByText('Apply multiplication to solve problems')).toBeInTheDocument();
  });
  
  it('allows selecting suggested objectives', () => {
    const mockObjectives = [
      'Understand the concept of addition',
      'Apply multiplication to solve problems',
    ];
    
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: mockObjectives,
      isLoading: false,
      refetch: jest.fn(),
    });
    
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    const addButton = screen.getByText('Add Selected Objectives');
    fireEvent.click(addButton);
    
    expect(mockOnObjectivesChange).toHaveBeenCalledWith(['Understand the concept of addition']);
  });
  
  it('allows adding custom objectives', () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={[]} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    const customObjectiveInput = screen.getByPlaceholderText('Enter learning objective');
    fireEvent.change(customObjectiveInput, { target: { value: 'Custom Objective' } });
    
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);
    
    expect(mockOnObjectivesChange).toHaveBeenCalledWith(['Custom Objective']);
  });
  
  it('allows removing objectives', () => {
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={['Existing Objective']} 
        onObjectivesChange={mockOnObjectivesChange} 
      />
    );
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    expect(mockOnObjectivesChange).toHaveBeenCalledWith([]);
  });
  
  it('disables interaction when disabled prop is true', () => {
    const mockObjectives = [
      'Understand the concept of addition',
    ];
    
    (api.lessonPlan.getSuggestedLearningObjectives.useQuery as jest.Mock).mockReturnValue({
      data: mockObjectives,
      isLoading: false,
      refetch: jest.fn(),
    });
    
    render(
      <LearningObjectivesSelector 
        topicIds={['topic1']} 
        selectedObjectives={['Existing Objective']} 
        onObjectivesChange={mockOnObjectivesChange}
        disabled={true}
      />
    );
    
    const customObjectiveInput = screen.getByPlaceholderText('Enter learning objective');
    expect(customObjectiveInput).toBeDisabled();
    
    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);
    
    const addButton = screen.getByText('Add Selected Objectives');
    expect(addButton).toBeDisabled();
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    expect(mockOnObjectivesChange).not.toHaveBeenCalled();
  });
});
