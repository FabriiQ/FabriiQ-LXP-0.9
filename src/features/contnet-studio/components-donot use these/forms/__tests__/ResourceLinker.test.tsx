import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResourceLinker, Resource, ResourceType } from '../ResourceLinker';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {},
}));

// Sample resources for testing
const mockResources: Resource[] = [
  {
    id: 'resource-1',
    title: 'Introduction to Algebra',
    description: 'A comprehensive guide to basic algebra concepts.',
    type: ResourceType.DOCUMENT,
    url: 'https://example.com/algebra-intro.pdf',
    fileId: 'file-1',
    fileName: 'algebra-intro.pdf',
    fileSize: 1024 * 1024 * 2, // 2MB
    fileType: 'application/pdf',
    tags: ['algebra', 'mathematics', 'introduction'],
  },
  {
    id: 'resource-2',
    title: 'Solving Equations Video Tutorial',
    description: 'Step-by-step video tutorial on solving linear equations.',
    type: ResourceType.VIDEO,
    url: 'https://example.com/solving-equations.mp4',
    tags: ['equations', 'tutorial', 'video'],
  },
];

describe('ResourceLinker', () => {
  // Test rendering
  it('renders the component with resources', () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={mockResources} 
        onChange={handleChange} 
      />
    );
    
    // Check if resource titles are rendered
    expect(screen.getByText('Introduction to Algebra')).toBeInTheDocument();
    expect(screen.getByText('Solving Equations Video Tutorial')).toBeInTheDocument();
    
    // Check if resource descriptions are rendered
    expect(screen.getByText('A comprehensive guide to basic algebra concepts.')).toBeInTheDocument();
    expect(screen.getByText('Step-by-step video tutorial on solving linear equations.')).toBeInTheDocument();
    
    // Check if tags are rendered
    expect(screen.getByText('algebra')).toBeInTheDocument();
    expect(screen.getByText('mathematics')).toBeInTheDocument();
    expect(screen.getByText('equations')).toBeInTheDocument();
  });
  
  it('renders with empty resources', () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={[]} 
        onChange={handleChange} 
      />
    );
    
    // Check if the add resource button is rendered
    expect(screen.getByRole('button', { name: /add resource/i })).toBeInTheDocument();
    
    // Check if the empty state message is rendered
    expect(screen.getByText(/no resources added yet/i)).toBeInTheDocument();
  });
  
  // Test opening the dialog
  it('opens the dialog when add resource button is clicked', () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={[]} 
        onChange={handleChange} 
      />
    );
    
    // Click the add resource button
    fireEvent.click(screen.getByRole('button', { name: /add resource/i }));
    
    // Check if the dialog is opened
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Resources')).toBeInTheDocument();
  });
  
  // Test removing a resource
  it('removes a resource when the remove button is clicked', () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={mockResources} 
        onChange={handleChange} 
      />
    );
    
    // Click the remove button for the first resource
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    fireEvent.click(removeButtons[0]);
    
    // Check if onChange was called with the resource removed
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].length).toBe(mockResources.length - 1);
    expect(handleChange.mock.calls[0][0].find(r => r.id === 'resource-1')).toBeUndefined();
  });
  
  // Test creating a new resource
  it('creates a new resource', async () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={[]} 
        onChange={handleChange} 
      />
    );
    
    // Click the add resource button
    fireEvent.click(screen.getByRole('button', { name: /add resource/i }));
    
    // Switch to the create tab
    fireEvent.click(screen.getByRole('tab', { name: /create/i }));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Resource' },
    });
    
    fireEvent.change(screen.getByLabelText(/url/i), {
      target: { value: 'https://example.com/new-resource' },
    });
    
    // Click the create button
    fireEvent.click(screen.getByRole('button', { name: /create resource/i }));
    
    // Check if onChange was called with the new resource
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].length).toBe(1);
    expect(handleChange.mock.calls[0][0][0].title).toBe('New Resource');
    expect(handleChange.mock.calls[0][0][0].url).toBe('https://example.com/new-resource');
  });
  
  // Test adding tags to a new resource
  it('adds tags to a new resource', async () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={[]} 
        onChange={handleChange} 
      />
    );
    
    // Click the add resource button
    fireEvent.click(screen.getByRole('button', { name: /add resource/i }));
    
    // Switch to the create tab
    fireEvent.click(screen.getByRole('tab', { name: /create/i }));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Resource' },
    });
    
    // Add a tag
    fireEvent.change(screen.getByPlaceholderText(/add a tag/i), {
      target: { value: 'new-tag' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /add$/i }));
    
    // Check if the tag was added
    expect(screen.getByText('new-tag')).toBeInTheDocument();
    
    // Add another tag
    fireEvent.change(screen.getByPlaceholderText(/add a tag/i), {
      target: { value: 'another-tag' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /add$/i }));
    
    // Check if the tag was added
    expect(screen.getByText('another-tag')).toBeInTheDocument();
    
    // Click the create button
    fireEvent.click(screen.getByRole('button', { name: /create resource/i }));
    
    // Check if onChange was called with the new resource including tags
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0][0].tags).toContain('new-tag');
    expect(handleChange.mock.calls[0][0][0].tags).toContain('another-tag');
  });
  
  // Test searching for resources
  it('searches for resources', async () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={[]} 
        onChange={handleChange} 
      />
    );
    
    // Click the add resource button
    fireEvent.click(screen.getByRole('button', { name: /add resource/i }));
    
    // Enter a search query
    fireEvent.change(screen.getByPlaceholderText(/search resources/i), {
      target: { value: 'algebra' },
    });
    
    // Click the search button
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
    
    // Wait for the search results
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
    
    // Mock the search results (this is handled by the setTimeout in the component)
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
  
  // Test hiding descriptions
  it('hides descriptions when showDescription is false', () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={mockResources} 
        onChange={handleChange}
        showDescription={false}
      />
    );
    
    // Check if descriptions are not rendered
    expect(screen.queryByText('A comprehensive guide to basic algebra concepts.')).not.toBeInTheDocument();
    expect(screen.queryByText('Step-by-step video tutorial on solving linear equations.')).not.toBeInTheDocument();
  });
  
  // Test hiding tags
  it('hides tags when showTags is false', () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={mockResources} 
        onChange={handleChange}
        showTags={false}
      />
    );
    
    // Check if tags are not rendered
    expect(screen.queryByText('algebra')).not.toBeInTheDocument();
    expect(screen.queryByText('mathematics')).not.toBeInTheDocument();
    expect(screen.queryByText('equations')).not.toBeInTheDocument();
  });
  
  // Test max resources limit
  it('disables the add button when max resources is reached', () => {
    const handleChange = jest.fn();
    render(
      <ResourceLinker 
        selectedResources={mockResources} 
        onChange={handleChange}
        maxResources={2}
      />
    );
    
    // Check if the add button is disabled
    expect(screen.getByRole('button', { name: /add resource/i })).toBeDisabled();
    
    // Check if the max resources message is displayed
    expect(screen.getByText(/maximum number of resources reached/i)).toBeInTheDocument();
  });
});
