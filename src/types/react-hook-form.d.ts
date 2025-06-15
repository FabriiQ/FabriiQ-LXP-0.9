declare module 'react-hook-form' {
  export type FieldValues = Record<string, any>;
  
  export type UseFormReturn<TFieldValues extends FieldValues = FieldValues> = {
    register: any;
    handleSubmit: any;
    formState: {
      errors: Record<string, any>;
      isSubmitting: boolean;
      isDirty: boolean;
      isValid: boolean;
    };
    reset: any;
    setValue: any;
    getValues: any;
    watch: any;
    control: any;
    trigger: any;
    clearErrors: any;
    setError: any;
    setFocus: any;
  };
  
  export function useForm<TFieldValues extends FieldValues = FieldValues>(options?: any): UseFormReturn<TFieldValues>;
  
  export type ControllerProps = {
    name: string;
    control?: any;
    defaultValue?: any;
    rules?: any;
    render: (props: any) => React.ReactElement;
  };
  
  export function Controller(props: ControllerProps): React.ReactElement;
  
  export type ControllerRenderProps = {
    field: {
      onChange: (event: any) => void;
      onBlur: () => void;
      value: any;
      name: string;
      ref: React.Ref<any>;
    };
    fieldState: {
      invalid: boolean;
      isTouched: boolean;
      isDirty: boolean;
      error?: {
        type: string;
        message?: string;
      };
    };
    formState: {
      errors: Record<string, any>;
      isSubmitting: boolean;
      isDirty: boolean;
      isValid: boolean;
    };
  };
  
  export type UseControllerProps = {
    name: string;
    control?: any;
    defaultValue?: any;
    rules?: any;
  };
  
  export function useController(props: UseControllerProps): {
    field: {
      onChange: (event: any) => void;
      onBlur: () => void;
      value: any;
      name: string;
      ref: React.Ref<any>;
    };
    fieldState: {
      invalid: boolean;
      isTouched: boolean;
      isDirty: boolean;
      error?: {
        type: string;
        message?: string;
      };
    };
    formState: {
      errors: Record<string, any>;
      isSubmitting: boolean;
      isDirty: boolean;
      isValid: boolean;
    };
  };
}
