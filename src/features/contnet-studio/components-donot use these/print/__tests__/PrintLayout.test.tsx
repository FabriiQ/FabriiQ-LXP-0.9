import React from 'react';
import { render, screen } from '@testing-library/react';
import { PrintLayout } from '../PrintLayout';

describe('PrintLayout', () => {
  // Test rendering
  it('renders the component with title', () => {
    render(
      <PrintLayout title="Test Document">
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if title is rendered
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    
    // Check if content is rendered
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('renders with subtitle and author', () => {
    render(
      <PrintLayout 
        title="Test Document" 
        subtitle="A test subtitle" 
        author="Test Author"
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if subtitle is rendered
    expect(screen.getByText('A test subtitle')).toBeInTheDocument();
    
    // Check if author is rendered
    expect(screen.getByText('Author:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
  });
  
  it('renders with custom date', () => {
    render(
      <PrintLayout 
        title="Test Document" 
        date="January 1, 2023"
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if date is rendered
    expect(screen.getByText('Date:', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/January 1, 2023/)).toBeInTheDocument();
  });
  
  it('renders with Date object', () => {
    const testDate = new Date('2023-01-01');
    render(
      <PrintLayout 
        title="Test Document" 
        date={testDate}
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if date is rendered (format depends on locale)
    expect(screen.getByText('Date:', { exact: false })).toBeInTheDocument();
    // We don't check the exact formatted date as it depends on the locale
  });
  
  it('renders with custom logo', () => {
    render(
      <PrintLayout 
        title="Test Document" 
        logo={<div data-testid="test-logo">Logo</div>}
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if logo is rendered
    expect(screen.getByTestId('test-logo')).toBeInTheDocument();
  });
  
  it('renders with custom footer', () => {
    render(
      <PrintLayout 
        title="Test Document" 
        footer={<div data-testid="test-footer">Custom Footer</div>}
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if custom footer is rendered
    expect(screen.getByTestId('test-footer')).toBeInTheDocument();
  });
  
  it('renders with page numbers', () => {
    render(
      <PrintLayout 
        title="Test Document" 
        showPageNumbers={true}
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if page numbers are rendered
    const pageNumbers = screen.getAllByText('Page', { exact: false });
    expect(pageNumbers.length).toBe(2); // One in metadata and one in footer
  });
  
  it('renders without page numbers', () => {
    render(
      <PrintLayout 
        title="Test Document" 
        showPageNumbers={false}
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if page numbers are not rendered
    expect(screen.queryByText('Page', { exact: false })).not.toBeInTheDocument();
  });
  
  // Test page size and orientation
  it('applies correct page size class for A4 portrait', () => {
    const { container } = render(
      <PrintLayout 
        title="Test Document" 
        pageSize="a4"
        orientation="portrait"
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if the correct class is applied
    expect(container.firstChild).toHaveClass('w-[210mm]');
    expect(container.firstChild).toHaveClass('h-[297mm]');
  });
  
  it('applies correct page size class for A4 landscape', () => {
    const { container } = render(
      <PrintLayout 
        title="Test Document" 
        pageSize="a4"
        orientation="landscape"
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if the correct class is applied
    expect(container.firstChild).toHaveClass('w-[297mm]');
    expect(container.firstChild).toHaveClass('h-[210mm]');
  });
  
  it('applies correct page size class for letter portrait', () => {
    const { container } = render(
      <PrintLayout 
        title="Test Document" 
        pageSize="letter"
        orientation="portrait"
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if the correct class is applied
    expect(container.firstChild).toHaveClass('w-[216mm]');
    expect(container.firstChild).toHaveClass('h-[279mm]');
  });
  
  it('applies correct page size class for legal landscape', () => {
    const { container } = render(
      <PrintLayout 
        title="Test Document" 
        pageSize="legal"
        orientation="landscape"
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if the correct class is applied
    expect(container.firstChild).toHaveClass('w-[356mm]');
    expect(container.firstChild).toHaveClass('h-[216mm]');
  });
  
  // Test custom class names
  it('applies custom class names', () => {
    const { container } = render(
      <PrintLayout 
        title="Test Document" 
        className="custom-class"
        contentClassName="content-class"
        headerClassName="header-class"
        footerClassName="footer-class"
      >
        <p>Test content</p>
      </PrintLayout>
    );
    
    // Check if custom classes are applied
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.querySelector('.content-class')).toBeInTheDocument();
    expect(container.querySelector('.header-class')).toBeInTheDocument();
    expect(container.querySelector('.footer-class')).toBeInTheDocument();
  });
});
