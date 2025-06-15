'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Search, Users } from 'lucide-react';
import { api } from '@/utils/api';

// Class interface is inferred from the API response

interface ClassSelectorProps {
  teacherId: string;
  selectedClassId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function ClassSelector({ teacherId, selectedClassId, onSelect, isLoading }: ClassSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch classes for this teacher
  const { data: classes = [], isLoading: isLoadingClasses } = api.teacher.getTeacherClasses.useQuery(
    {
      teacherId
    },
    {
      enabled: !!teacherId,
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching teacher classes:', error);
      }
    }
  );

  // Filter classes based on search query
  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  const showLoading = isLoading || isLoadingClasses;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Select Class</h2>
        <p className="text-muted-foreground mt-1">
          Choose the class for which you want to create an activity
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search classes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[calc(100%-40px)] max-h-[400px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="cursor-not-allowed">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-6 w-2/3 mb-1" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredClasses.length > 0 ? (
            filteredClasses.map((cls) => (
              <Card
                key={cls.id}
                className={`cursor-pointer transition-colors hover:bg-muted ${
                  selectedClassId === cls.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelect(cls.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{cls.code}</span>
                    </div>
                    <span className="text-lg font-medium">{cls.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No classes found matching "${searchQuery}"`
                  : 'No classes available'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
