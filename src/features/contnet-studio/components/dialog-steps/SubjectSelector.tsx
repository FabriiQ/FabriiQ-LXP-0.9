'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Search } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubjectId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function SubjectSelector({ subjects, selectedSubjectId, onSelect, isLoading }: SubjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            className="pl-8"
            disabled
            value=""
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Check if there are any subjects at all
  if (subjects.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-4 text-center">
        <div className="bg-muted p-6 rounded-lg max-w-md">
          <h3 className="text-xl font-semibold mb-2">No Subjects Available</h3>
          <p className="text-muted-foreground mb-4">
            You don't have any subjects assigned to you. Please contact your administrator to get subjects assigned to your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[calc(100%-40px)] max-h-[400px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <Card
                key={subject.id}
                className={`cursor-pointer transition-colors hover:bg-muted ${
                  selectedSubjectId === subject.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelect(subject.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">{subject.code}</span>
                    <span className="text-lg font-medium">{subject.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">No subjects found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
