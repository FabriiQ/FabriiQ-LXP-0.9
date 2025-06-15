import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';
import { api } from '@/utils/api';

// Mock the API
jest.mock('@/utils/api', () => ({
  api: {
    activity: {
      create: {
        useMutation: jest.fn().mockReturnValue({
          mutate: jest.fn(),
          isLoading: false,
          error: null
        })
      }
    }
  }
}));

// Create a simple activity form schema for testing
const activityFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  purpose: z.nativeEnum(ActivityPurpose),
  learningType: z.nativeEnum(LearningActivityType).optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  content: z.object({
    activityType: z.string().min(1, 'Activity type is required'),
    version: z.number().min(1, 'Version is required')
  }).optional()
});

type ActivityFormValues = z.infer<typeof activityFormSchema>;

// Create a test form component
const TestActivityForm = ({ onSubmit }: { onSubmit: (data: ActivityFormValues) => void }) => {
  const methods = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: '',
      description: '',
      purpose: ActivityPurpose.LEARNING,
      learningType: LearningActivityType.SELF_STUDY,
      subjectId: '',
      topicId: '',
      classId: '',
      content: {
        activityType: '',
        version: 0
      }
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} data-testid="activity-form">
        <div>
          <label htmlFor="title">Title</label>
          <input id="title" {...methods.register('title')} data-testid="title-input" />
          {methods.formState.errors.title && (
            <p data-testid="title-error">{methods.formState.errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" {...methods.register('description')} data-testid="description-input" />
        </div>

        <div>
          <label htmlFor="purpose">Purpose</label>
          <select id="purpose" {...methods.register('purpose')} data-testid="purpose-select">
            <option value={ActivityPurpose.LEARNING}>Learning</option>
            <option value={ActivityPurpose.ASSESSMENT}>Assessment</option>
            <option value={ActivityPurpose.PRACTICE}>Practice</option>
          </select>
        </div>

        <div>
          <label htmlFor="subjectId">Subject</label>
          <input id="subjectId" {...methods.register('subjectId')} data-testid="subject-input" />
          {methods.formState.errors.subjectId && (
            <p data-testid="subject-error">{methods.formState.errors.subjectId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="classId">Class</label>
          <input id="classId" {...methods.register('classId')} data-testid="class-input" />
          {methods.formState.errors.classId && (
            <p data-testid="class-error">{methods.formState.errors.classId.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="content.activityType">Activity Type</label>
          <input 
            id="content.activityType" 
            {...methods.register('content.activityType')} 
            data-testid="activity-type-input" 
          />
          {methods.formState.errors.content?.activityType && (
            <p data-testid="activity-type-error">
              {methods.formState.errors.content.activityType.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="content.version">Version</label>
          <input 
            id="content.version" 
            type="number"
            {...methods.register('content.version', { valueAsNumber: true })} 
            data-testid="version-input" 
          />
          {methods.formState.errors.content?.version && (
            <p data-testid="version-error">
              {methods.formState.errors.content.version.message}
            </p>
          )}
        </div>

        <button type="submit" data-testid="submit-button">Create Activity</button>
      </form>
    </FormProvider>
  );
};

describe('Activity Form Validation', () => {
  const mockSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields', async () => {
    render(<TestActivityForm onSubmit={mockSubmit} />);
    
    // Submit the form without filling required fields
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByTestId('title-error')).toBeInTheDocument();
      expect(screen.getByTestId('subject-error')).toBeInTheDocument();
      expect(screen.getByTestId('class-error')).toBeInTheDocument();
    });
    
    // Form submission should not be called
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('validates activity type and version', async () => {
    render(<TestActivityForm onSubmit={mockSubmit} />);
    
    // Fill required fields except activity type and version
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Activity' } });
    fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'subject123' } });
    fireEvent.change(screen.getByTestId('class-input'), { target: { value: 'class123' } });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Check for validation errors on activity type and version
    await waitFor(() => {
      expect(screen.getByTestId('activity-type-error')).toBeInTheDocument();
      expect(screen.getByTestId('version-error')).toBeInTheDocument();
    });
    
    // Form submission should not be called
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits the form when all required fields are valid', async () => {
    render(<TestActivityForm onSubmit={mockSubmit} />);
    
    // Fill all required fields
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Activity' } });
    fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'subject123' } });
    fireEvent.change(screen.getByTestId('class-input'), { target: { value: 'class123' } });
    fireEvent.change(screen.getByTestId('activity-type-input'), { target: { value: 'multiple-choice' } });
    fireEvent.change(screen.getByTestId('version-input'), { target: { value: '1' } });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Form submission should be called with correct values
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'Test Activity',
        description: '',
        purpose: ActivityPurpose.LEARNING,
        learningType: LearningActivityType.SELF_STUDY,
        subjectId: 'subject123',
        topicId: '',
        classId: 'class123',
        content: {
          activityType: 'multiple-choice',
          version: 1
        }
      }, expect.anything());
    });
  });

  it('handles optional fields correctly', async () => {
    render(<TestActivityForm onSubmit={mockSubmit} />);
    
    // Fill required fields and some optional fields
    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Test Activity' } });
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'This is a test activity' } });
    fireEvent.change(screen.getByTestId('subject-input'), { target: { value: 'subject123' } });
    fireEvent.change(screen.getByTestId('class-input'), { target: { value: 'class123' } });
    fireEvent.change(screen.getByTestId('activity-type-input'), { target: { value: 'multiple-choice' } });
    fireEvent.change(screen.getByTestId('version-input'), { target: { value: '1' } });
    
    // Change purpose to ASSESSMENT
    fireEvent.change(screen.getByTestId('purpose-select'), { target: { value: ActivityPurpose.ASSESSMENT } });
    
    // Submit the form
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Form submission should be called with correct values including optional fields
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'Test Activity',
        description: 'This is a test activity',
        purpose: ActivityPurpose.ASSESSMENT,
        learningType: LearningActivityType.SELF_STUDY,
        subjectId: 'subject123',
        topicId: '',
        classId: 'class123',
        content: {
          activityType: 'multiple-choice',
          version: 1
        }
      }, expect.anything());
    });
  });
});
