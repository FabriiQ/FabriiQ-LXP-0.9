import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentCreationLayout } from '../ContentCreationLayout';
import { useRouter } from 'next/navigation';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('ContentCreationLayout', () => {
  // Setup router mock
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });
  
  // Test rendering
  it('renders the title and description', () => {
    render(
      <ContentCreationLayout 
        title="Test Title" 
        description="Test Description"
      >
        <div data-testid="content">Content</div>
      </ContentCreationLayout>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });
  
  it('renders the back button', () => {
    render(
      <ContentCreationLayout title="Test Title">
        <div>Content</div>
      </ContentCreationLayout>
    );
    
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
  
  it('renders the sidebar when provided', () => {
    render(
      <ContentCreationLayout 
        title="Test Title"
        sidebar={<div data-testid="sidebar">Sidebar</div>}
      >
        <div>Content</div>
      </ContentCreationLayout>
    );
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
  
  it('renders the actions when provided', () => {
    render(
      <ContentCreationLayout 
        title="Test Title"
        actions={<button data-testid="action-button">Action</button>}
      >
        <div>Content</div>
      </ContentCreationLayout>
    );
    
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });
  
  // Test navigation
  it('calls router.back when back button is clicked with no handlers', () => {
    render(
      <ContentCreationLayout title="Test Title">
        <div>Content</div>
      </ContentCreationLayout>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    
    expect(mockRouter.back).toHaveBeenCalled();
  });
  
  it('calls router.push with backHref when back button is clicked', () => {
    render(
      <ContentCreationLayout 
        title="Test Title"
        backHref="/test-back-url"
      >
        <div>Content</div>
      </ContentCreationLayout>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/test-back-url');
  });
  
  it('calls onBack when back button is clicked', () => {
    const handleBack = jest.fn();
    render(
      <ContentCreationLayout 
        title="Test Title"
        onBack={handleBack}
      >
        <div>Content</div>
      </ContentCreationLayout>
    );
    
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    
    expect(handleBack).toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
  
  // Test styling
  it('applies custom class names', () => {
    const { container } = render(
      <ContentCreationLayout 
        title="Test Title"
        className="custom-class"
        contentClassName="content-class"
        headerClassName="header-class"
      >
        <div>Content</div>
      </ContentCreationLayout>
    );
    
    // Check if custom classes are applied
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.querySelector('.content-class')).toBeInTheDocument();
    expect(container.querySelector('.header-class')).toBeInTheDocument();
  });
});
