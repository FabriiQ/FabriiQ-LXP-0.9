'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/bloom-levels';
import { useToast } from '@/components/ui/use-toast';

interface EnhancedRubricSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  bloomsLevel?: BloomsTaxonomyLevel;
  subjectId?: string;
  topicId?: string;
  onCreateNew?: () => void;
}

/**
 * Enhanced RubricSelector component for selecting a rubric filtered by Bloom's taxonomy level
 */
export function EnhancedRubricSelector({
  value,
  onChange,
  className,
  placeholder = 'Select a rubric',
  disabled = false,
  bloomsLevel,
  subjectId,
  topicId,
  onCreateNew,
}: EnhancedRubricSelectorProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch available rubrics with filtering
  const { data: rubricsData, isLoading } = api.rubric.list.useQuery(
    {
      bloomsLevel,
      limit: 50,
    },
    {
      enabled: !disabled,
    }
  );

  const rubrics = rubricsData?.rubrics || [];

  // Handle selection
  const handleSelect = (rubricId: string) => {
    onChange(rubricId);
    setOpen(false);
  };

  // Find the selected rubric
  const selectedRubric = rubrics.find(rubric => rubric.id === value);

  // Handle create new
  const handleCreateNew = () => {
    setOpen(false);
    if (onCreateNew) {
      onCreateNew();
    } else {
      setCreateDialogOpen(true);
    }
  };

  // Get Bloom's level color and name
  const bloomsMetadata = bloomsLevel ? BLOOMS_LEVEL_METADATA[bloomsLevel] : null;

  return (
    <div className="space-y-2">
      <Label htmlFor="rubric">Rubric</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {value && selectedRubric ? selectedRubric.title : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search rubrics..." />
            <CommandEmpty>
              <div className="p-2 text-center">
                <p className="text-sm text-muted-foreground">No rubrics found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleCreateNew}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Rubric
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="p-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full mt-2" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              ) : (
                <>
                  {rubrics.map(rubric => (
                    <CommandItem
                      key={rubric.id}
                      value={rubric.id || ''}
                      onSelect={() => handleSelect(rubric.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === rubric.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{rubric.title || 'Untitled Rubric'}</span>
                        <span className="text-xs text-muted-foreground">
                          {rubric.criteria?.map(c => c.bloomsLevel).join(', ') || 'No criteria'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                  <CommandItem value="create-new-rubric" onSelect={handleCreateNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Rubric
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {bloomsLevel && (
        <p className="text-xs text-muted-foreground">
          Showing rubrics aligned with{' '}
          <span
            className="font-medium"
            style={{ color: bloomsMetadata?.color }}
          >
            {bloomsMetadata?.name}
          </span>{' '}
          level.
        </p>
      )}

      {/* Create Rubric Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Rubric</DialogTitle>
            <DialogDescription>
              Create a new rubric aligned with the selected Bloom's taxonomy level.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rubricTitle">Rubric Title</Label>
              <input
                id="rubricTitle"
                className="w-full p-2 border rounded-md"
                placeholder="Enter rubric title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubricDescription">Description</Label>
              <textarea
                id="rubricDescription"
                className="w-full p-2 border rounded-md"
                rows={3}
                placeholder="Enter rubric description"
              />
            </div>

            {bloomsLevel && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  This rubric will be aligned with the{' '}
                  <span
                    className="font-bold"
                    style={{ color: bloomsMetadata?.color }}
                  >
                    {bloomsMetadata?.name}
                  </span>{' '}
                  cognitive level.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // In a real implementation, this would save the rubric
              // For now, just close the dialog
              setCreateDialogOpen(false);
              toast({
                title: "Feature Coming Soon",
                description: "Creating new rubrics will be available in a future update.",
              });
            }}>
              Create Rubric
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
