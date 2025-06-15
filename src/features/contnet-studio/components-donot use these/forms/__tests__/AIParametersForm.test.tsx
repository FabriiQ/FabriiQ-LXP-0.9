import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIParametersForm } from '../AIParametersForm';
import { z } from 'zod';

describe('AIParametersForm', () => {
  // Test rendering
  it('renders the form with default values', () => {
    const handleSubmit = jest.fn();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="activity"
      />
    );
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/Activity Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Prompt for AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Complexity Level/i)).toBeInTheDocument();
    expect(screen.getByText(/Tone/i)).toBeInTheDocument();
    expect(screen.getByText(/Include Examples/i)).toBeInTheDocument();
    expect(screen.getByText(/Include Explanations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Maximum Length/i)).toBeInTheDocument();
    
    // Check if submit button is rendered
    expect(screen.getByRole('button', { name: /Generate Activity/i })).toBeInTheDocument();
  });
  
  it('renders with custom default values', () => {
    const handleSubmit = jest.fn();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="assessment"
        defaultValues={{
          title: 'Test Assessment',
          prompt: 'Create a test assessment',
          complexity: 'advanced',
          tone: 'formal',
          includeExamples: false,
          includeExplanations: false,
          maxLength: 2000,
        }}
      />
    );
    
    // Check if default values are applied
    expect(screen.getByLabelText(/Assessment Title/i)).toHaveValue('Test Assessment');
    expect(screen.getByLabelText(/Prompt for AI/i)).toHaveValue('Create a test assessment');
    expect(screen.getByLabelText(/Maximum Length/i)).toHaveValue('2000');
  });
  
  it('renders with different content types', () => {
    const handleSubmit = jest.fn();
    
    // Render with assessment content type
    const { unmount } = render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="assessment"
      />
    );
    
    expect(screen.getByLabelText(/Assessment Title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Assessment/i })).toBeInTheDocument();
    
    // Unmount and render with worksheet content type
    unmount();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="worksheet"
      />
    );
    
    expect(screen.getByLabelText(/Worksheet Title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Worksheet/i })).toBeInTheDocument();
    
    // Unmount and render with lesson plan content type
    unmount();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="lessonPlan"
      />
    );
    
    expect(screen.getByLabelText(/Lesson Plan Title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Lesson Plan/i })).toBeInTheDocument();
  });
  
  it('renders with extended schema and additional fields', () => {
    // Create extended schema
    const extendedSchema = z.object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
      complexity: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
      tone: z.enum(['formal', 'casual', 'friendly', 'professional']).default('professional'),
      includeExamples: z.boolean().default(true),
      includeExplanations: z.boolean().default(true),
      maxLength: z.number().int().min(100).max(5000).default(1000),
      customField: z.string().optional(),
    });
    
    const handleSubmit = jest.fn();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="activity"
        extendedSchema={extendedSchema as any}
        renderAdditionalFields={(form) => (
          <div>
            <label htmlFor="custom-field">Custom Field</label>
            <input 
              id="custom-field"
              data-testid="custom-field"
              {...form.register('customField')}
            />
          </div>
        )}
      />
    );
    
    // Check if additional field is rendered
    expect(screen.getByTestId('custom-field')).toBeInTheDocument();
  });
  
  // Test form submission
  it('submits the form with valid data', async () => {
    const handleSubmit = jest.fn();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="activity"
      />
    );
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Activity Title/i), {
      target: { value: 'Test Activity' },
    });
    
    fireEvent.change(screen.getByLabelText(/Prompt for AI/i), {
      target: { value: 'Create a test activity with multiple choice questions' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Generate Activity/i }));
    
    // Check if onSubmit was called with the correct data
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Test Activity',
        prompt: 'Create a test activity with multiple choice questions',
        complexity: 'intermediate',
        tone: 'professional',
        includeExamples: true,
        includeExplanations: true,
        maxLength: 1000,
      });
    });
  });
  
  it('validates required fields', async () => {
    const handleSubmit = jest.fn();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="activity"
      />
    );
    
    // Submit the form without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /Generate Activity/i }));
    
    // Check if validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/Title must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Prompt must be at least 10 characters/i)).toBeInTheDocument();
    });
    
    // Check that onSubmit was not called
    expect(handleSubmit).not.toHaveBeenCalled();
  });
  
  // Test loading state
  it('disables the form when loading', () => {
    const handleSubmit = jest.fn();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        contentType="activity"
        isLoading={true}
      />
    );
    
    // Check if submit button is disabled
    expect(screen.getByRole('button', { name: /Generate Activity/i })).toBeDisabled();
  });
  
  // Test cancel button
  it('calls onCancel when cancel button is clicked', () => {
    const handleSubmit = jest.fn();
    const handleCancel = jest.fn();
    render(
      <AIParametersForm 
        onSubmit={handleSubmit} 
        onCancel={handleCancel}
        contentType="activity"
      />
    );
    
    // Check if cancel button is rendered
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toBeInTheDocument();
    
    // Click cancel button
    fireEvent.click(cancelButton);
    
    // Check if onCancel was called
    expect(handleCancel).toHaveBeenCalled();
  });
});
