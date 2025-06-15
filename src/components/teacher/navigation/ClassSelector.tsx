'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface ClassSelectorProps {
  teacherId: string;
  currentClassId?: string;
}

export function ClassSelector({ teacherId, currentClassId }: ClassSelectorProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch classes for this teacher
  const { data: classes, isLoading } = api.teacher.getTeacherClasses.useQuery(
    {
      teacherId
    },
    {
      // refetchOnWindowFocus: false, // Previous setting
      refetchOnWindowFocus: true,    // Explicitly set to true
      // retry: 1, // Removing to use React Query default retry behavior
      // staleTime: 1 * 60 * 1000, // Optional: Consider if data doesn't change hyper-frequently
    }
  );

  // Filter classes based on search query
  const filteredClasses = classes?.filter(cls => {
    const nameMatch = cls.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const codeMatch = cls.code?.toLowerCase().includes(searchQuery.toLowerCase());
    const courseMatch = cls.courseCampusId?.toLowerCase().includes(searchQuery.toLowerCase());

    return nameMatch || codeMatch || courseMatch;
  });

  // Handle class selection
  const handleSelectClass = (classId: string) => {
    // Use window.location for a hard navigation to ensure proper loading
    window.location.href = `/teacher/classes/${classId}`;
    setOpen(false);
  };

  // Get current class name
  const currentClass = classes?.find(cls => cls.id === currentClassId);
  const currentClassName = currentClass?.name || 'Select Class';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between",
            isMobile ? "w-full h-12" : "w-[200px] lg:w-[250px]", // Increased height for mobile
            "transition-all duration-200 ease-in-out",
            open && "ring-2 ring-primary ring-opacity-50" // Visual feedback when open
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Users className={cn(
              "h-4 w-4 shrink-0",
              "transition-transform duration-200",
              open && "text-primary"
            )} />
            <span className="truncate">{currentClassName}</span>
          </div>
          <ChevronsUpDown className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50",
            "transition-transform duration-200",
            open && "transform rotate-180 opacity-100"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 max-h-[80vh] overflow-hidden" align="start">
        <Command className="overflow-hidden flex flex-col h-full">
          <CommandInput
            placeholder="Search classes..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="flex-shrink-0"
          />
          <CommandList className="overflow-y-auto max-h-[50vh] flex-grow">
            <CommandEmpty>
              <div className="py-6 text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground mb-1">No classes found</p>
                <p className="text-xs text-muted-foreground/70">
                  {searchQuery
                    ? `Try a different search term`
                    : `You don't have any classes assigned yet`}
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                // Loading skeletons
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="px-2 py-1.5">
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))
              ) : (
                filteredClasses?.map(cls => (
                  <CommandItem
                    key={cls.id}
                    value={cls.name} // Use name instead of ID for better matching
                    onSelect={() => handleSelectClass(cls.id)}
                    className={cn(
                      "flex items-center justify-between",
                      "py-3 cursor-pointer", // Added cursor-pointer for better UX
                      cls.id === currentClassId && "bg-primary/10"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className={cn(
                        "font-medium",
                        cls.id === currentClassId && "text-primary font-semibold"
                      )}>
                        {cls.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {cls.code || 'No code'}
                        </span>
                      </div>
                    </div>
                    {cls.id === currentClassId && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-3 flex-shrink-0">
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              className={cn(
                "w-full",
                isMobile && "h-12", // Taller button for mobile
                "transition-colors duration-200"
              )}
              onClick={() => {
                // Provide haptic feedback if supported
                if (navigator.vibrate) {
                  navigator.vibrate(10); // Subtle 10ms vibration
                }
                // Use window.location for a hard navigation to ensure proper loading
                window.location.href = '/teacher/classes';
                setOpen(false);
              }}
            >
              View All Classes
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
