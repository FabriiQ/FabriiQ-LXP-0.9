'use client';

/**
 * ClassSelector Component
 *
 * This component provides a UI for selecting a class.
 * It fetches classes for the current teacher and allows selection.
 */

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple responsive hook
const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
};

interface ClassSelectorProps {
  selectedClassId?: string;
  onClassSelect: (classId: string) => void;
  disabled?: boolean;
}

export function ClassSelector({ selectedClassId, onClassSelect, disabled = false }: ClassSelectorProps) {
  const { data: session } = useSession();
  const { isMobile } = useResponsive();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Get the teacher ID from the session
  api.user.getById.useQuery(
    session?.user?.id || "",
    {
      enabled: !!session?.user?.id,
      onSuccess: (data) => {
        if (data?.teacherProfile?.id) {
          setTeacherId(data.teacherProfile.id);
        }
      }
    }
  );

  // Fetch classes for this teacher
  const { data: classes, isLoading } = api.class.getTeacherClasses.useQuery(
    {
      teacherId: teacherId || "",
      status: "ACTIVE"
    },
    {
      enabled: !!teacherId,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Filter classes based on search query
  const filteredClasses = classes?.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle class selection
  const handleSelectClass = (classId: string) => {
    onClassSelect(classId);
    setOpen(false);
  };

  // Get current class name
  const currentClass = classes?.find(cls => cls.id === selectedClassId);
  const currentClassName = currentClass?.name || 'Select Class';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "justify-between",
            isMobile ? "w-full" : "w-full"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Users className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {isLoading ? 'Loading classes...' : currentClassName}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search classes..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
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
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="px-2 py-3">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : (
                filteredClasses?.map(cls => (
                  <CommandItem
                    key={cls.id}
                    value={cls.id}
                    onSelect={() => handleSelectClass(cls.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{cls.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {cls.code}
                        </span>
                      </div>
                    </div>
                    {cls.id === selectedClassId && (
                      <Check className="h-4 w-4" />
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
