import * as React from "react";
import { TimeValue } from "@/types/forms";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  required = false,
  className = "",
}: TimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    // Validate time format (HH:mm)
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeValue)) {
      onChange(timeValue);
    }
  };

  return (
    <Input
      type="time"
      value={value}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      className={className}
    />
  );
} 