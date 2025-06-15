"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface DatePickerProps {
  value?: Date
  onChange?: (date?: Date) => void
  placeholder?: string
  label?: string
  disabled?: boolean
  className?: string
  error?: string
  helperText?: string
  required?: boolean
  fromDate?: Date
  toDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  disabled,
  className,
  error,
  helperText,
  required,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value)
  const [inputValue, setInputValue] = React.useState<string>(
    value ? format(value, "PP") : ""
  )
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  // Update the input value when the value prop changes
  React.useEffect(() => {
    if (value) {
      setDate(value)
      setInputValue(format(value, "PP"))
    } else {
      setDate(undefined)
      setInputValue("")
    }
  }, [value])

  // Handle date selection from calendar
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (selectedDate) {
      setInputValue(format(selectedDate, "PP"))
      onChange?.(selectedDate)
    } else {
      setInputValue("")
      onChange?.(undefined)
    }
    setIsPopoverOpen(false)
  }

  // Handle manual input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Try to parse the date
    if (value) {
      try {
        const parsedDate = parse(value, "PP", new Date())
        if (isValid(parsedDate)) {
          setDate(parsedDate)
          onChange?.(parsedDate)
        }
      } catch (error) {
        // Invalid date format, don't update the date
        setDate(undefined)
        onChange?.(undefined)
      }
    } else {
      setDate(undefined)
      onChange?.(undefined)
    }
  }

  // Handle input blur
  const handleInputBlur = () => {
    if (!inputValue) {
      setDate(undefined)
      onChange?.(undefined)
      return
    }

    try {
      const parsedDate = parse(inputValue, "PP", new Date())
      if (isValid(parsedDate)) {
        setDate(parsedDate)
        setInputValue(format(parsedDate, "PP"))
        onChange?.(parsedDate)
      } else {
        // Reset to previous valid date or empty
        setInputValue(date ? format(date, "PP") : "")
      }
    } catch (error) {
      // Reset to previous valid date or empty
      setInputValue(date ? format(date, "PP") : "")
    }
  }

  return (
    <div className="relative">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <div className="flex">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full",
              error && "border-red-500",
              className
            )}
            required={required}
          />
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("ml-2 px-2", disabled && "opacity-50")}
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={(date) => {
              if (fromDate && date < fromDate) return true
              if (toDate && date > toDate) return true
              return false
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && (
        <span className="text-sm text-red-500 mt-1">{error}</span>
      )}
      {helperText && !error && (
        <span className="text-sm text-gray-500 mt-1">{helperText}</span>
      )}
    </div>
  )
} 

