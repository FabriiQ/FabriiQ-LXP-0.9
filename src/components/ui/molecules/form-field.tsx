import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "../atoms/input";

export interface FormFieldProps extends InputProps {
  label: string;
  required?: boolean;
  helperText?: string;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, required, className, id, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-red-500"
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Input
          id={id}
          ref={ref}
          error={error}
          helperText={helperText}
          {...props}
        />
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField }; 