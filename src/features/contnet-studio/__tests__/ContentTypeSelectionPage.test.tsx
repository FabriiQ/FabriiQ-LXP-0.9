import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentTypeSelectionPage } from '../pages/ContentTypeSelectionPage';
import { ContentType } from '../components/ContentCreationFlow';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContentStudio } from '../contexts/ContentStudioContext';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock the ContentStudio context
jest.mock('../contexts/ContentStudioContext', () => ({
  useContentStudio: jest.fn()
}));

describe('ContentTypeSelectionPage', () => {
  // Setup mocks
  const mockRouter = {
    push: jest.fn()
  };
  const mockSetContentType = jest.fn();
  const mockSetClassId = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Setup context mock
    (useContentStudio as jest.Mock).mockReturnValue({
      setContentType: mockSetContentType,
      classId: 'class123',
      setClassId: mockSetClassId
    });
  });

  it('renders the content type selector', () => {
    render(<ContentTypeSelectionPage />);
    
    // Check if the page title is rendered
    expect(screen.getByText('Content Studio')).toBeInTheDocument();
    expect(screen.getByText('Create educational content for your students with or without AI assistance')).toBeInTheDocument();
    
    // Check if the ContentTypeSelector is rendered
    expect(screen.getByText('What would you like to create?')).toBeInTheDocument();
  });

  it('navigates to the correct page when a content type is selected', () => {
    render(<ContentTypeSelectionPage />);
    
    // Find and click on the Activity option
    fireEvent.click(screen.getByText('Activity'));
    
    // Check if setContentType was called with the correct content type
    expect(mockSetContentType).toHaveBeenCalledWith(ContentType.ACTIVITY);
    
    // Check if router.push was called with the correct URL
    expect(mockRouter.push).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/teacher/content-studio/activity'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('contentType=ACTIVITY'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('classId=class123'));
  });

  it('syncs context from URL parameters on mount', () => {
    // Setup URL parameters
    const mockSearchParamsWithContext = new URLSearchParams();
    mockSearchParamsWithContext.set('contentType', ContentType.ASSESSMENT);
    mockSearchParamsWithContext.set('classId', 'class456');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParamsWithContext);
    
    // Render the component
    render(<ContentTypeSelectionPage />);
    
    // Check if context was updated from URL parameters
    expect(mockSetContentType).toHaveBeenCalledWith(ContentType.ASSESSMENT);
    expect(mockSetClassId).toHaveBeenCalledWith('class456');
  });

  it('handles navigation to all content type pages', () => {
    render(<ContentTypeSelectionPage />);
    
    // Test Activity navigation
    fireEvent.click(screen.getByText('Activity'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/teacher/content-studio/activity'));
    mockRouter.push.mockClear();
    
    // Test Assessment navigation
    fireEvent.click(screen.getByText('Assessment'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/teacher/content-studio/assessment'));
    mockRouter.push.mockClear();
    
    // Test Worksheet navigation
    fireEvent.click(screen.getByText('Worksheet'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/teacher/content-studio/worksheet'));
    mockRouter.push.mockClear();
    
    // Test Lesson Plan navigation
    fireEvent.click(screen.getByText('Lesson Plan'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('/teacher/content-studio/lesson-plan'));
  });
});
