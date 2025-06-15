import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityTypeSelector } from '@/features/activities/components/activity-creators/ActivityTypeSelector';
import { activityRegistry } from '@/features/activities/registry/ActivityTypeRegistry';
import { ActivityPurpose } from '@/server/api/constants';

// Mock the activity registry
jest.mock('@/features/activities/registry/ActivityTypeRegistry', () => ({
  activityRegistry: {
    getAll: jest.fn(),
    getByCategory: jest.fn(),
  },
}));

describe('ActivityTypeSelector', () => {
  const mockOnSelect = jest.fn();

  // Sample activity types for testing
  const mockActivityTypes = [
    {
      id: 'multiple-choice',
      name: 'Multiple Choice',
      description: 'A multiple choice question with one correct answer',
      category: ActivityPurpose.ASSESSMENT,
      capabilities: {
        isGradable: true,
        hasInteraction: true,
        requiresTeacherReview: false,
      },
    },
    {
      id: 'reading',
      name: 'Reading',
      description: 'A reading activity with text content',
      category: ActivityPurpose.LEARNING,
      capabilities: {
        isGradable: false,
        hasInteraction: true,
        requiresTeacherReview: false,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (activityRegistry.getAll as jest.Mock).mockReturnValue(mockActivityTypes);
    (activityRegistry.getByCategory as jest.Mock).mockImplementation((category) => {
      return mockActivityTypes.filter(type => type.category === category);
    });
  });

  it('renders activity type cards', () => {
    render(<ActivityTypeSelector onSelect={mockOnSelect} />);

    // Check if activity type names are displayed
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
  });

  it('filters activity types by category', () => {
    render(<ActivityTypeSelector onSelect={mockOnSelect} />);

    // Click on the Assessment tab
    fireEvent.click(screen.getByRole('tab', { name: /assessment/i }));

    // Check if only assessment activities are shown
    expect(activityRegistry.getByCategory).toHaveBeenCalledWith(ActivityPurpose.ASSESSMENT);
  });

  it('filters activity types by search term', () => {
    render(<ActivityTypeSelector onSelect={mockOnSelect} />);

    // Enter search term
    fireEvent.change(screen.getByPlaceholderText('Search activities...'), {
      target: { value: 'multiple' },
    });

    // Check if only matching activities are shown
    expect(screen.getByText('Multiple Choice')).toBeInTheDocument();
    expect(screen.queryByText('Reading')).not.toBeInTheDocument();
  });

  it('calls onSelect when an activity type is selected', () => {
    render(<ActivityTypeSelector onSelect={mockOnSelect} />);

    // Click on the Select button for Multiple Choice
    fireEvent.click(screen.getAllByText('Select')[0]);

    // Check if onSelect was called with the correct activity type ID
    expect(mockOnSelect).toHaveBeenCalledWith('multiple-choice');
  });

  it('shows gradable badge for gradable activities', () => {
    render(<ActivityTypeSelector onSelect={mockOnSelect} />);

    // Check if the Gradable badge is shown for Multiple Choice
    expect(screen.getByText('Gradable')).toBeInTheDocument();
  });
});
