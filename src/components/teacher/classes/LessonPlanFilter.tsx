'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Check, ChevronDown, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LessonPlan {
  id: string;
  title: string;
}

interface LessonPlanFilterProps {
  lessonPlans: LessonPlan[];
  selectedLessonPlans: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  className?: string;
}

/**
 * LessonPlanFilter component for filtering activities by lesson plan
 *
 * Features:
 * - Multi-select dropdown
 * - Search functionality
 * - Selected items displayed as badges
 * - Clear selection option
 */
export function LessonPlanFilter({
  lessonPlans,
  selectedLessonPlans,
  onSelectionChange,
  className,
}: LessonPlanFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter lesson plans based on search query
  const filteredLessonPlans = lessonPlans.filter(plan =>
    plan.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle selection of a lesson plan
  const toggleSelection = (id: string) => {
    if (selectedLessonPlans.includes(id)) {
      onSelectionChange(selectedLessonPlans.filter(planId => planId !== id));
    } else {
      onSelectionChange([...selectedLessonPlans, id]);
    }
  };

  // Clear all selections
  const clearSelections = () => {
    onSelectionChange([]);
    setOpen(false);
  };

  // Remove a single selection
  const removeSelection = (id: string) => {
    onSelectionChange(selectedLessonPlans.filter(planId => planId !== id));
  };

  // Get selected lesson plan titles
  const getSelectedLessonPlanTitles = () => {
    return lessonPlans
      .filter(plan => selectedLessonPlans.includes(plan.id))
      .map(plan => plan.title);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedLessonPlans.length > 0
                  ? `${selectedLessonPlans.length} lesson plan${selectedLessonPlans.length > 1 ? 's' : ''} selected`
                  : 'Filter by Lesson Plan'}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Search lesson plans..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No lesson plans found.</CommandEmpty>
              <CommandGroup>
                {filteredLessonPlans.map(plan => (
                  <CommandItem
                    key={plan.id}
                    onSelect={() => toggleSelection(plan.id)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      checked={selectedLessonPlans.includes(plan.id)}
                      onCheckedChange={() => toggleSelection(plan.id)}
                      aria-label={`Select ${plan.title}`}
                      className="mr-2"
                    />
                    <span>{plan.title}</span>
                    {selectedLessonPlans.includes(plan.id) && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {selectedLessonPlans.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={clearSelections}
                      className="justify-center text-center"
                    >
                      Clear filters
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected filters as badges */}
      {selectedLessonPlans.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {getSelectedLessonPlanTitles().map((title, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {title}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => removeSelection(selectedLessonPlans[index])}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {title}</span>
              </Button>
            </Badge>
          ))}
          {selectedLessonPlans.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={clearSelections}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
