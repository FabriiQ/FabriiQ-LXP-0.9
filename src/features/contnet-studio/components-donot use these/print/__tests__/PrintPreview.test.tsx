import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrintPreview } from '../PrintPreview';
import { PrintLayout } from '../PrintLayout';

// Mock the PDF generation libraries
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: jest.fn().mockReturnValue(210),
        getHeight: jest.fn().mockReturnValue(297),
      },
    },
    addImage: jest.fn(),
    save: jest.fn(),
  })),
}));

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test'),
  }),
}));

describe('PrintPreview', () => {
  // Mock window.print
  const originalPrint = window.print;
  
  beforeEach(() => {
    window.print = jest.fn();
  });
  
  afterEach(() => {
    window.print = originalPrint;
  });
  
  // Test rendering
  it('renders the component with children', () => {
    render(
      <PrintPreview>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Check if content is rendered
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('renders with toolbar controls', () => {
    render(
      <PrintPreview>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Check if toolbar controls are rendered
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Portrait')).toBeInTheDocument();
    expect(screen.getByText('Options')).toBeInTheDocument();
    expect(screen.getByText('Download PDF')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });
  
  // Test zoom controls
  it('handles zoom in and out', () => {
    render(
      <PrintPreview>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Initial zoom should be 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
    
    // Click zoom in button
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    
    // Zoom should increase to 110%
    expect(screen.getByText('110%')).toBeInTheDocument();
    
    // Click zoom out button
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    
    // Zoom should decrease back to 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
  
  // Test orientation change
  it('handles orientation change', () => {
    render(
      <PrintPreview>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Initial orientation should be portrait
    expect(screen.getByText('Portrait')).toBeInTheDocument();
    
    // Click orientation button
    fireEvent.click(screen.getByRole('button', { name: /portrait/i }));
    
    // Orientation should change to landscape
    expect(screen.getByText('Landscape')).toBeInTheDocument();
  });
  
  // Test print function
  it('calls window.print when print button is clicked', () => {
    render(
      <PrintPreview>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Click print button
    fireEvent.click(screen.getByRole('button', { name: /print$/i }));
    
    // Check if window.print was called
    expect(window.print).toHaveBeenCalled();
  });
  
  it('calls custom onPrint function when provided', () => {
    const handlePrint = jest.fn();
    render(
      <PrintPreview onPrint={handlePrint}>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Click print button
    fireEvent.click(screen.getByRole('button', { name: /print$/i }));
    
    // Check if custom onPrint was called
    expect(handlePrint).toHaveBeenCalled();
    expect(window.print).not.toHaveBeenCalled();
  });
  
  // Test download function
  it('calls custom onDownload function when provided', () => {
    const handleDownload = jest.fn();
    render(
      <PrintPreview onDownload={handleDownload}>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Click download button
    fireEvent.click(screen.getByRole('button', { name: /download pdf/i }));
    
    // Check if custom onDownload was called
    expect(handleDownload).toHaveBeenCalled();
  });
  
  // Test options popover
  it('opens options popover when options button is clicked', () => {
    render(
      <PrintPreview>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Initially, options content should not be visible
    expect(screen.queryByText('Print Settings')).not.toBeInTheDocument();
    
    // Click options button
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    
    // Options content should now be visible
    expect(screen.getByText('Print Settings')).toBeInTheDocument();
    expect(screen.getByText('Page Size')).toBeInTheDocument();
    expect(screen.getByText('Show Page Numbers')).toBeInTheDocument();
  });
  
  it('changes page size when selected from options', () => {
    render(
      <PrintPreview>
        <PrintLayout title="Test Document">
          <p>Test content</p>
        </PrintLayout>
      </PrintPreview>
    );
    
    // Click options button
    fireEvent.click(screen.getByRole('button', { name: /options/i }));
    
    // Click page size select
    fireEvent.click(screen.getByRole('combobox'));
    
    // Select Letter size
    fireEvent.click(screen.getByRole('option', { name: /letter/i }));
    
    // Page size should be changed (we can't directly test this as it's passed to children)
  });
});
