import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ContentTypeSelector } from '../components/ContentTypeSelector';
import { ContentType } from '../components/ContentCreationFlow';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

describe('ContentTypeSelector', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders all content type options', () => {
    render(<ContentTypeSelector onSelect={mockOnSelect} />);

    // Check if all content types are rendered
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Assessment')).toBeInTheDocument();
    expect(screen.getByText('Worksheet')).toBeInTheDocument();
    expect(screen.getByText('Lesson Plan')).toBeInTheDocument();

    // Check if the heading is rendered
    expect(screen.getByText('What would you like to create?')).toBeInTheDocument();
    expect(screen.getByText('Choose the type of content you want to create')).toBeInTheDocument();
  });

  it('calls onSelect with the correct content type when clicked', () => {
    render(<ContentTypeSelector onSelect={mockOnSelect} />);

    // Click on the Activity option
    fireEvent.click(screen.getByText('Activity'));
    expect(mockOnSelect).toHaveBeenCalledWith(ContentType.ACTIVITY);

    // Click on the Assessment option
    fireEvent.click(screen.getByText('Assessment'));
    expect(mockOnSelect).toHaveBeenCalledWith(ContentType.ASSESSMENT);

    // Click on the Worksheet option
    fireEvent.click(screen.getByText('Worksheet'));
    expect(mockOnSelect).toHaveBeenCalledWith(ContentType.WORKSHEET);

    // Click on the Lesson Plan option
    fireEvent.click(screen.getByText('Lesson Plan'));
    expect(mockOnSelect).toHaveBeenCalledWith(ContentType.LESSON_PLAN);
  });

  it('displays descriptions for each content type', () => {
    render(<ContentTypeSelector onSelect={mockOnSelect} />);

    expect(screen.getByText('Create interactive online activities for students')).toBeInTheDocument();
    expect(screen.getByText('Create graded assessments to evaluate student learning')).toBeInTheDocument();
    expect(screen.getByText('Create printable worksheets for classroom or homework use')).toBeInTheDocument();
    expect(screen.getByText('Create comprehensive lesson plans with activities and assessments')).toBeInTheDocument();
  });

  it('renders icons for each content type', () => {
    render(<ContentTypeSelector onSelect={mockOnSelect} />);

    // Find all cards
    const cards = screen.getAllByRole('article');
    expect(cards.length).toBe(4);

    // Check that each card has an icon
    cards.forEach(card => {
      const iconContainer = within(card).getByTestId('icon-container');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  it('has proper keyboard navigation', () => {
    render(<ContentTypeSelector onSelect={mockOnSelect} />);

    // Get all cards
    const cards = screen.getAllByRole('article');

    // Focus on the first card
    cards[0].focus();
    expect(document.activeElement).toBe(cards[0]);

    // Press Tab to move to the next card
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(cards[1]);

    // Press Enter to select the card
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(mockOnSelect).toHaveBeenCalledWith(ContentType.ASSESSMENT);
  });

  it('passes accessibility tests', async () => {
    const { container } = render(<ContentTypeSelector onSelect={mockOnSelect} />);

    // Run axe accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Check for proper ARIA attributes
    const cards = screen.getAllByRole('article');
    cards.forEach(card => {
      expect(card).toHaveAttribute('tabIndex', '0');
      expect(card).toHaveAttribute('aria-label');
    });
  });
});
