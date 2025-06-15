'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';

interface RubricSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * RubricSelector component for selecting a rubric from the available rubrics
 */
export function RubricSelector({
  value,
  onChange,
  className,
  placeholder = 'Select a rubric',
  disabled = false,
}: RubricSelectorProps) {
  const [open, setOpen] = useState(false);
  
  // Fetch available rubrics
  const { data: rubrics, isLoading } = api.rubric.getAll.useQuery();
  
  // Handle selection
  const handleSelect = (rubricId: string) => {
    onChange(rubricId);
    setOpen(false);
  };
  
  // Find the selected rubric
  const selectedRubric = rubrics?.find(rubric => rubric.id === value);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Skeleton className="h-4 w-[100px]" />
          ) : value && selectedRubric ? (
            selectedRubric.title
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search rubrics..." />
          <CommandEmpty>No rubrics found.</CommandEmpty>
          <CommandGroup>
            {isLoading ? (
              <div className="p-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full mt-2" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            ) : (
              rubrics?.map(rubric => (
                <CommandItem
                  key={rubric.id}
                  value={rubric.id}
                  onSelect={() => handleSelect(rubric.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === rubric.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{rubric.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {rubric.description || 'No description'}
                    </span>
                  </div>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
