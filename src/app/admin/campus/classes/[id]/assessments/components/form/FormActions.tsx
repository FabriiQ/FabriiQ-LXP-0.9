'use client';

import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./types";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

interface FormActionsProps {
  form: UseFormReturn<FormValues>;
  isLoading: boolean;
  action: 'create' | 'edit';
  onCancel: () => void;
  currentStep?: number;
  totalSteps?: number;
  onPrevious?: () => void;
  onNext?: () => void;
}

interface ChunkedFormActionsProps extends Omit<FormActionsProps, 'currentStep' | 'totalSteps' | 'onPrevious' | 'onNext'> {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
}

// Helper function to determine if we have chunked form props
function isChunkedFormProps(props: FormActionsProps): props is ChunkedFormActionsProps {
  return (
    typeof props.currentStep === 'number' &&
    typeof props.totalSteps === 'number' &&
    typeof props.onPrevious === 'function' &&
    typeof props.onNext === 'function'
  );
}

export function FormActions(props: FormActionsProps) {
  const { form, isLoading, action, onCancel } = props;

  // Check if we have chunked form props
  if (isChunkedFormProps(props)) {
    const { currentStep, totalSteps, onPrevious, onNext } = props;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    // Render chunked form actions
    return (
      <div className="flex justify-between gap-4">
        <div>
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>

          {isLastStep ? (
            <Button
              type="button" // Changed from submit to button for more control
              disabled={isLoading}
              onClick={(e) => {
                console.log('Submit button clicked', e);

                // Get the form values directly and submit manually
                const formValues = form.getValues();
                console.log('Form values from submit button:', formValues);

                // Validate the form first
                form.trigger().then((isValid) => {
                  console.log('Form validation result:', isValid);

                  if (isValid) {
                    // Submit the form manually by calling the form's handleSubmit method
                    console.log('Form is valid, submitting manually');
                    form.handleSubmit((data) => {
                      console.log('Form handleSubmit callback with data:', data);
                      // The actual submission logic is in the onSubmit handler of the form
                    })();
                  } else {
                    console.error('Form validation failed');
                    // Show validation errors
                    console.log('Form errors:', form.formState.errors);
                  }
                });
              }}
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {action === 'create' ? 'Create Assessment' : 'Update Assessment'}
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onNext}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {/* Debug button for development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                console.log('Debug button clicked');
                console.log('Form values:', form.getValues());
                console.log('Form errors:', form.formState.errors);
              }}
            >
              Debug
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default form actions (non-chunked form)
  return (
    <div className="flex justify-end gap-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>

      <Button
        type="submit"
        disabled={isLoading}
      >
        {isLoading
          ? 'Saving...'
          : action === 'create'
          ? 'Create Assessment'
          : 'Update Assessment'
        }
      </Button>

      {/* Debug button for development */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            console.log('Debug button clicked');
            console.log('Form values:', form.getValues());
            console.log('Form errors:', form.formState.errors);
          }}
        >
          Debug
        </Button>
      )}
    </div>
  );
}