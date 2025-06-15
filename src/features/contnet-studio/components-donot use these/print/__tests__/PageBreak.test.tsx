import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageBreak, NoBreakContainer } from '../PageBreak';

describe('PageBreak', () => {
  // Test rendering
  it('renders the component with default props', () => {
    const { container } = render(<PageBreak />);
    
    // Check if the page break element is rendered
    expect(container.firstChild).toHaveClass('page-break');
    
    // Check if the "Page Break" text is rendered
    expect(screen.getByText('Page Break')).toBeInTheDocument();
  });
  
  it('renders without visual indicator when showInPreview is false', () => {
    const { container } = render(<PageBreak showInPreview={false} />);
    
    // Check if the page break element is rendered
    expect(container.firstChild).toHaveClass('page-break');
    
    // Check if the "Page Break" text is not rendered
    expect(screen.queryByText('Page Break')).not.toBeInTheDocument();
  });
  
  it('applies custom class name', () => {
    const { container } = render(<PageBreak className="custom-class" />);
    
    // Check if the custom class is applied
    expect(container.firstChild).toHaveClass('custom-class');
  });
  
  it('has correct page break style', () => {
    const { container } = render(<PageBreak />);
    
    // Check if the page break style is applied
    expect(container.firstChild).toHaveStyle({
      pageBreakAfter: 'always',
    });
  });
});

describe('NoBreakContainer', () => {
  // Test rendering
  it('renders the component with children', () => {
    render(
      <NoBreakContainer>
        <p>Test content</p>
      </NoBreakContainer>
    );
    
    // Check if the content is rendered
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('applies custom class name', () => {
    const { container } = render(
      <NoBreakContainer className="custom-class">
        <p>Test content</p>
      </NoBreakContainer>
    );
    
    // Check if the custom class is applied
    expect(container.firstChild).toHaveClass('custom-class');
  });
  
  it('has correct page break style', () => {
    const { container } = render(
      <NoBreakContainer>
        <p>Test content</p>
      </NoBreakContainer>
    );
    
    // Check if the no-break style is applied
    expect(container.firstChild).toHaveStyle({
      pageBreakInside: 'avoid',
    });
  });
});
