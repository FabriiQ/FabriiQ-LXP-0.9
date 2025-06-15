'use client';

/**
 * ContentTypeSelector Component
 *
 * This component provides a mobile-first UI for selecting content types.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, FileText, ClipboardList, LayoutGrid } from 'lucide-react';
import { ContentType } from './ContentCreationFlow';

interface ContentTypeSelectorProps {
  onSelect: (contentType: ContentType) => void;
}

interface ContentTypeOption {
  type: ContentType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ContentTypeSelector({ onSelect }: ContentTypeSelectorProps) {
  // Define content type options
  const contentTypeOptions: ContentTypeOption[] = [
    {
      type: ContentType.ACTIVITY,
      title: 'Activity',
      description: 'Create interactive online activities for students',
      icon: <LayoutGrid className="h-8 w-8 text-primary" />
    },
    {
      type: ContentType.ASSESSMENT,
      title: 'Assessment',
      description: 'Create graded assessments to evaluate student learning',
      icon: <ClipboardList className="h-8 w-8 text-primary" />
    },
    {
      type: ContentType.WORKSHEET,
      title: 'Worksheet',
      description: 'Create printable worksheets for classroom or homework use',
      icon: <FileText className="h-8 w-8 text-primary" />
    },
    {
      type: ContentType.LESSON_PLAN,
      title: 'Lesson Plan',
      description: 'Create comprehensive lesson plans with activities and assessments',
      icon: <BookOpen className="h-8 w-8 text-primary" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">What would you like to create?</h2>
        <p className="text-muted-foreground mt-1">
          Choose the type of content you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentTypeOptions.map((option) => (
          <Card
            key={option.type}
            className="cursor-pointer transition-colors hover:bg-muted border-2 hover:border-primary"
            onClick={() => onSelect(option.type)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(option.type);
              }
            }}
            tabIndex={0}
            role="article"
            aria-label={`Select ${option.title}: ${option.description}`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div
                  className="bg-primary/10 p-4 rounded-full mb-4"
                  data-testid="icon-container"
                  aria-hidden="true"
                >
                  {option.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
                <p className="text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
