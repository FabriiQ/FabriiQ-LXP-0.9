import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssessmentCard } from '../AssessmentCard';
import { Assessment, AssessmentStatus, AssessmentType, AssessmentGradingType, AssessmentVisibility } from '../types';

// Mock assessment data
const mockAssessment: Assessment = {
  id: '1',
  title: 'Test Assessment',
  description: 'This is a test assessment',
  type: AssessmentType.QUIZ,
  status: AssessmentStatus.PUBLISHED,
  gradingType: AssessmentGradingType.AUTOMATIC,
  visibility: AssessmentVisibility.PUBLIC,
  totalPoints: 100,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-02'),
  createdBy: 'user1',
  activities: ['activity1', 'activity2'],
  tags: ['tag1', 'tag2'],
};

describe('AssessmentCard', () => {
  test('renders assessment title and description', () => {
    render(<AssessmentCard assessment={mockAssessment} />);
    
    expect(screen.getByText('Test Assessment')).toBeInTheDocument();
    expect(screen.getByText('This is a test assessment')).toBeInTheDocument();
  });
  
  test('renders status and type badges', () => {
    render(<AssessmentCard assessment={mockAssessment} />);
    
    expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
    expect(screen.getByText('QUIZ')).toBeInTheDocument();
  });
  
  test('renders activity count and points', () => {
    render(<AssessmentCard assessment={mockAssessment} />);
    
    expect(screen.getByText('2 Activities')).toBeInTheDocument();
    expect(screen.getByText('100 Points')).toBeInTheDocument();
  });
  
  test('renders tags when showTags is true', () => {
    render(<AssessmentCard assessment={mockAssessment} showTags={true} />);
    
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });
  
  test('does not render tags when showTags is false', () => {
    render(<AssessmentCard assessment={mockAssessment} showTags={false} />);
    
    expect(screen.queryByText('tag1')).not.toBeInTheDocument();
    expect(screen.queryByText('tag2')).not.toBeInTheDocument();
  });
  
  test('calls onView when View button is clicked', () => {
    const handleView = jest.fn();
    render(<AssessmentCard assessment={mockAssessment} onView={handleView} />);
    
    fireEvent.click(screen.getByText('View'));
    expect(handleView).toHaveBeenCalledTimes(1);
  });
  
  test('calls onEdit when Edit button is clicked', () => {
    const handleEdit = jest.fn();
    render(<AssessmentCard assessment={mockAssessment} onEdit={handleEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
  
  test('calls onDelete when Delete button is clicked', () => {
    const handleDelete = jest.fn();
    render(<AssessmentCard assessment={mockAssessment} onDelete={handleDelete} />);
    
    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
  
  test('renders in compact mode', () => {
    render(<AssessmentCard assessment={mockAssessment} compact={true} />);
    
    // In compact mode, description should not be visible
    expect(screen.queryByText('This is a test assessment')).not.toBeInTheDocument();
    
    // Points should be shown with 'pts' abbreviation
    expect(screen.getByText('100 pts')).toBeInTheDocument();
  });
  
  test('does not render action buttons when showActions is false', () => {
    render(
      <AssessmentCard 
        assessment={mockAssessment} 
        showActions={false} 
        onView={() => {}} 
        onEdit={() => {}} 
        onDelete={() => {}} 
      />
    );
    
    expect(screen.queryByText('View')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
});
