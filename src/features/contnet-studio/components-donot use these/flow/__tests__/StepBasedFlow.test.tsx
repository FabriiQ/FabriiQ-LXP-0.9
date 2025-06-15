import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StepBasedFlow, Step } from '../StepBasedFlow';

// Mock steps for testing
const mockSteps: Step[] = [
  {
    id: 'STEP_ONE',
    title: 'Step One',
    component: <div data-testid="step-one-content">Step One Content</div>,
  },
  {
    id: 'STEP_TWO',
    title: 'Step Two',
    component: <div data-testid="step-two-content">Step Two Content</div>,
  },
  {
    id: 'STEP_THREE',
    title: 'Step Three',
    component: <div data-testid="step-three-content">Step Three Content</div>,
  },
];

// Mock steps with validation
const mockStepsWithValidation: Step[] = [
  {
    id: 'STEP_ONE',
    title: 'Step One',
    component: <div data-testid="step-one-content">Step One Content</div>,
    validate: jest.fn().mockReturnValue(true),
  },
  {
    id: 'STEP_TWO',
    title: 'Step Two',
    component: <div data-testid="step-two-content">Step Two Content</div>,
    validate: jest.fn().mockReturnValue(false),
  },
];

// Mock steps with function components
const mockStepsWithFunctionComponents: Step[] = [
  {
    id: 'STEP_ONE',
    title: 'Step One',
    component: ({ onNext, onBack, isFirstStep, isLastStep, currentStepId }) => (
      <div data-testid="step-one-function-component">
        <p>Step One Content</p>
        <p>Current Step ID: {currentStepId}</p>
        <p>Is First Step: {isFirstStep.toString()}</p>
        <p>Is Last Step: {isLastStep.toString()}</p>
        <button data-testid="custom-next-button" onClick={onNext}>Next</button>
        <button data-testid="custom-back-button" onClick={onBack}>Back</button>
      </div>
    ),
  },
  {
    id: 'STEP_TWO',
    title: 'Step Two',
    component: ({ onNext, onBack }) => (
      <div data-testid="step-two-function-component">
        <p>Step Two Content</p>
        <button data-testid="custom-next-button" onClick={onNext}>Next</button>
        <button data-testid="custom-back-button" onClick={onBack}>Back</button>
      </div>
    ),
  },
];

describe('StepBasedFlow', () => {
  // Test rendering
  it('renders the first step by default', () => {
    render(<StepBasedFlow steps={mockSteps} />);
    
    expect(screen.getByTestId('step-one-content')).toBeInTheDocument();
    expect(screen.queryByTestId('step-two-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('step-three-content')).not.toBeInTheDocument();
  });
  
  it('renders the specified initial step', () => {
    render(<StepBasedFlow steps={mockSteps} initialStepId="STEP_TWO" />);
    
    expect(screen.queryByTestId('step-one-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('step-two-content')).toBeInTheDocument();
    expect(screen.queryByTestId('step-three-content')).not.toBeInTheDocument();
  });
  
  it('renders the progress bar correctly', () => {
    render(<StepBasedFlow steps={mockSteps} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '33.333333333333336');
  });
  
  // Test navigation
  it('navigates to the next step when Next button is clicked', () => {
    render(<StepBasedFlow steps={mockSteps} />);
    
    // Initial step
    expect(screen.getByTestId('step-one-content')).toBeInTheDocument();
    
    // Click Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Should show second step
    expect(screen.queryByTestId('step-one-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('step-two-content')).toBeInTheDocument();
  });
  
  it('navigates to the previous step when Back button is clicked', () => {
    render(<StepBasedFlow steps={mockSteps} initialStepId="STEP_TWO" />);
    
    // Initial step (second)
    expect(screen.getByTestId('step-two-content')).toBeInTheDocument();
    
    // Click Back button
    fireEvent.click(screen.getByText('Back'));
    
    // Should show first step
    expect(screen.getByTestId('step-one-content')).toBeInTheDocument();
    expect(screen.queryByTestId('step-two-content')).not.toBeInTheDocument();
  });
  
  it('calls onComplete when Next is clicked on the last step', () => {
    const handleComplete = jest.fn();
    render(
      <StepBasedFlow 
        steps={mockSteps} 
        initialStepId="STEP_THREE" 
        onComplete={handleComplete} 
      />
    );
    
    // Click Next button on last step
    fireEvent.click(screen.getByText('Complete'));
    
    // Should call onComplete
    expect(handleComplete).toHaveBeenCalled();
  });
  
  it('calls onCancel when Back is clicked on the first step', () => {
    const handleCancel = jest.fn();
    render(
      <StepBasedFlow 
        steps={mockSteps} 
        onCancel={handleCancel} 
      />
    );
    
    // Click Back button on first step
    fireEvent.click(screen.getByText('Cancel'));
    
    // Should call onCancel
    expect(handleCancel).toHaveBeenCalled();
  });
  
  // Test validation
  it('validates the current step before proceeding to the next step', async () => {
    render(<StepBasedFlow steps={mockStepsWithValidation} />);
    
    // Click Next button on first step
    fireEvent.click(screen.getByText('Next'));
    
    // Should call validate function
    await waitFor(() => {
      expect(mockStepsWithValidation[0].validate).toHaveBeenCalled();
    });
    
    // Should proceed to next step (validation passes)
    expect(screen.getByTestId('step-two-content')).toBeInTheDocument();
    
    // Try to proceed from second step
    fireEvent.click(screen.getByText('Next'));
    
    // Should call validate function
    await waitFor(() => {
      expect(mockStepsWithValidation[1].validate).toHaveBeenCalled();
    });
    
    // Should not proceed (validation fails)
    expect(screen.getByTestId('step-two-content')).toBeInTheDocument();
  });
  
  // Test function components
  it('renders function components with correct props', () => {
    render(<StepBasedFlow steps={mockStepsWithFunctionComponents} />);
    
    // Check if function component is rendered
    expect(screen.getByTestId('step-one-function-component')).toBeInTheDocument();
    
    // Check if props are passed correctly
    expect(screen.getByText('Current Step ID: STEP_ONE')).toBeInTheDocument();
    expect(screen.getByText('Is First Step: true')).toBeInTheDocument();
    expect(screen.getByText('Is Last Step: false')).toBeInTheDocument();
  });
  
  it('handles navigation with custom buttons in function components', () => {
    render(<StepBasedFlow steps={mockStepsWithFunctionComponents} />);
    
    // Initial step
    expect(screen.getByTestId('step-one-function-component')).toBeInTheDocument();
    
    // Click custom Next button
    fireEvent.click(screen.getByTestId('custom-next-button'));
    
    // Should show second step
    expect(screen.queryByTestId('step-one-function-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('step-two-function-component')).toBeInTheDocument();
    
    // Click custom Back button
    fireEvent.click(screen.getByTestId('custom-back-button'));
    
    // Should show first step again
    expect(screen.getByTestId('step-one-function-component')).toBeInTheDocument();
    expect(screen.queryByTestId('step-two-function-component')).not.toBeInTheDocument();
  });
  
  // Test callbacks
  it('calls onStepChange when the step changes', () => {
    const handleStepChange = jest.fn();
    render(
      <StepBasedFlow 
        steps={mockSteps} 
        onStepChange={handleStepChange} 
      />
    );
    
    // Should call onStepChange on initial render
    expect(handleStepChange).toHaveBeenCalledWith('STEP_ONE');
    
    // Click Next button
    fireEvent.click(screen.getByText('Next'));
    
    // Should call onStepChange with new step
    expect(handleStepChange).toHaveBeenCalledWith('STEP_TWO');
  });
});
