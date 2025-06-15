import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanStructureEditor, PlanSection, SectionType } from '../PlanStructureEditor';

// Mock the drag and drop library
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => children,
  Droppable: ({ children }: { children: (provided: any) => React.ReactNode }) => 
    children({
      innerRef: jest.fn(),
      droppableProps: {},
      placeholder: null,
    }),
  Draggable: ({ children }: { children: (provided: any) => React.ReactNode }) => 
    children({
      innerRef: jest.fn(),
      draggableProps: {},
      dragHandleProps: {},
    }),
}));

// Sample sections for testing
const mockSections: PlanSection[] = [
  {
    id: 'section-1',
    type: SectionType.INTRODUCTION,
    title: 'Introduction',
    description: 'Introduction to the lesson',
    timeAllocation: 10,
    content: 'This is the introduction content',
    activities: [],
    resources: [],
  },
  {
    id: 'section-2',
    type: SectionType.CONTENT,
    title: 'Main Content',
    description: 'Main content of the lesson',
    timeAllocation: 30,
    content: 'This is the main content',
    activities: [
      {
        id: 'activity-1',
        title: 'Group Discussion',
        description: 'Students discuss the topic in groups',
        timeAllocation: 15,
      },
    ],
    resources: [
      {
        id: 'resource-1',
        title: 'Textbook Chapter 5',
        type: 'document',
        url: 'https://example.com/textbook',
      },
    ],
  },
];

describe('PlanStructureEditor', () => {
  // Test rendering
  it('renders the component with sections', () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange} 
      />
    );
    
    // Check if section titles are rendered
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    
    // Check if time allocations are rendered
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    
    // Check if total time is rendered
    expect(screen.getByText('40 / 60 minutes')).toBeInTheDocument();
  });
  
  it('renders with empty sections', () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={[]} 
        onChange={handleChange} 
      />
    );
    
    // Check if the add section button is rendered
    expect(screen.getByRole('button', { name: /add section/i })).toBeInTheDocument();
    
    // Check if no sections are rendered
    expect(screen.queryByText('Introduction')).not.toBeInTheDocument();
  });
  
  // Test adding a section
  it('adds a new section when the add button is clicked', () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange} 
      />
    );
    
    // Click the add section button
    fireEvent.click(screen.getByRole('button', { name: /add section/i }));
    
    // Check if onChange was called with a new section
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].length).toBe(mockSections.length + 1);
    expect(handleChange.mock.calls[0][0][2].title).toBe('New Section');
  });
  
  // Test removing a section
  it('removes a section when the remove button is clicked', () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange} 
      />
    );
    
    // Click the remove button for the first section
    const removeButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(removeButtons[1]); // The second button is the remove button
    
    // Check if onChange was called with the section removed
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0].length).toBe(mockSections.length - 1);
    expect(handleChange.mock.calls[0][0].find(s => s.id === 'section-1')).toBeUndefined();
  });
  
  // Test expanding a section
  it('expands a section when clicked', async () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange} 
      />
    );
    
    // Initially, section content should not be visible
    expect(screen.queryByLabelText(/section title/i)).not.toBeInTheDocument();
    
    // Click the expand button for the first section
    const expandButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(expandButtons[0]); // The first button is the expand button
    
    // Check if section content is now visible
    await waitFor(() => {
      expect(screen.getByLabelText(/section title/i)).toBeInTheDocument();
    });
  });
  
  // Test updating a section
  it('updates a section when fields are changed', async () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange} 
      />
    );
    
    // Expand the first section
    const expandButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(expandButtons[0]);
    
    // Wait for the section to expand
    await waitFor(() => {
      expect(screen.getByLabelText(/section title/i)).toBeInTheDocument();
    });
    
    // Change the section title
    fireEvent.change(screen.getByLabelText(/section title/i), {
      target: { value: 'Updated Introduction' },
    });
    
    // Check if onChange was called with the updated section
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0][0].title).toBe('Updated Introduction');
  });
  
  // Test adding an activity
  it('adds an activity to a section', async () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange} 
      />
    );
    
    // Expand the first section
    const expandButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(expandButtons[0]);
    
    // Wait for the section to expand
    await waitFor(() => {
      expect(screen.getByLabelText(/section title/i)).toBeInTheDocument();
    });
    
    // Click the add activity button
    fireEvent.click(screen.getByRole('button', { name: /add activity/i }));
    
    // Check if onChange was called with a new activity
    expect(handleChange).toHaveBeenCalled();
    const updatedSections = handleChange.mock.calls[0][0];
    const updatedSection = updatedSections.find(s => s.id === 'section-1');
    expect(updatedSection?.activities?.length).toBe(1);
    expect(updatedSection?.activities?.[0].title).toBe('New Activity');
  });
  
  // Test adding a resource
  it('adds a resource to a section', async () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange} 
      />
    );
    
    // Expand the first section
    const expandButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(expandButtons[0]);
    
    // Wait for the section to expand
    await waitFor(() => {
      expect(screen.getByLabelText(/section title/i)).toBeInTheDocument();
    });
    
    // Click the add resource button
    fireEvent.click(screen.getByRole('button', { name: /add resource/i }));
    
    // Check if onChange was called with a new resource
    expect(handleChange).toHaveBeenCalled();
    const updatedSections = handleChange.mock.calls[0][0];
    const updatedSection = updatedSections.find(s => s.id === 'section-1');
    expect(updatedSection?.resources?.length).toBe(1);
    expect(updatedSection?.resources?.[0].title).toBe('New Resource');
  });
  
  // Test hiding time allocation
  it('hides time allocation when showTimeAllocation is false', () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange}
        showTimeAllocation={false}
      />
    );
    
    // Check if time allocations are not rendered
    expect(screen.queryByText('10 min')).not.toBeInTheDocument();
    expect(screen.queryByText('30 min')).not.toBeInTheDocument();
    expect(screen.queryByText('40 / 60 minutes')).not.toBeInTheDocument();
  });
  
  // Test hiding activities
  it('hides activities when showActivities is false', async () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange}
        showActivities={false}
      />
    );
    
    // Expand the second section
    const expandButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(expandButtons[2]); // The third button is for the second section
    
    // Wait for the section to expand
    await waitFor(() => {
      expect(screen.getByLabelText(/section title/i)).toBeInTheDocument();
    });
    
    // Check if activities are not rendered
    expect(screen.queryByText(/activities/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add activity/i })).not.toBeInTheDocument();
  });
  
  // Test hiding resources
  it('hides resources when showResources is false', async () => {
    const handleChange = jest.fn();
    render(
      <PlanStructureEditor 
        sections={mockSections} 
        onChange={handleChange}
        showResources={false}
      />
    );
    
    // Expand the second section
    const expandButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(expandButtons[2]); // The third button is for the second section
    
    // Wait for the section to expand
    await waitFor(() => {
      expect(screen.getByLabelText(/section title/i)).toBeInTheDocument();
    });
    
    // Check if resources are not rendered
    expect(screen.queryByText(/resources/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add resource/i })).not.toBeInTheDocument();
  });
});
