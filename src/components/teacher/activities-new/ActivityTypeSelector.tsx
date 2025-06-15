'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityPurpose } from '@/server/api/constants';

// Activity type definitions
const activityTypes = [
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    description: 'Create questions with multiple options and one correct answer',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '📝',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'true-false',
    name: 'True/False',
    description: 'Create statements that students mark as true or false',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '✓✗',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'multiple-response',
    name: 'Multiple Response',
    description: 'Create questions with multiple options and multiple correct answers',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '☑️',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'fill-in-the-blanks',
    name: 'Fill in the Blanks',
    description: 'Create text with blanks for students to complete',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '___',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'matching',
    name: 'Matching',
    description: 'Create items for students to match correctly',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '🔄',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'sequence',
    name: 'Sequence',
    description: 'Create items for students to arrange in the correct order',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '🔢',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'drag-and-drop',
    name: 'Drag and Drop',
    description: 'Create items for students to drag to correct locations',
    purpose: ActivityPurpose.LEARNING,
    icon: '👆',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'drag-the-words',
    name: 'Drag the Words',
    description: 'Create text with words for students to drag into place',
    purpose: ActivityPurpose.LEARNING,
    icon: '📋',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'flash-cards',
    name: 'Flash Cards',
    description: 'Create cards with questions and answers for review',
    purpose: ActivityPurpose.LEARNING,
    icon: '🃏',
    isGradable: false,
    isInteractive: true,
  },
  {
    id: 'numeric',
    name: 'Numeric',
    description: 'Create questions with numeric answers',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '🔢',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Create a comprehensive quiz with multiple question types',
    purpose: ActivityPurpose.ASSESSMENT,
    icon: '📋',
    isGradable: true,
    isInteractive: true,
  },
  {
    id: 'reading',
    name: 'Reading',
    description: 'Create a reading activity with text and comprehension questions',
    purpose: ActivityPurpose.LEARNING,
    icon: '📚',
    isGradable: false,
    isInteractive: false,
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Create a video activity with embedded video and questions',
    purpose: ActivityPurpose.LEARNING,
    icon: '🎬',
    isGradable: false,
    isInteractive: true,
  },
];

interface ActivityTypeSelectorProps {
  onSelect: (activityTypeId: string) => void;
  className?: string;
}

export function ActivityTypeSelector({ onSelect, className }: ActivityTypeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'learning' | 'assessment'>('all');

  // Filter activity types based on search query and active tab
  const filteredActivityTypes = activityTypes.filter(type => {
    const matchesSearch = 
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'learning' && type.purpose === ActivityPurpose.LEARNING) ||
      (activeTab === 'assessment' && type.purpose === ActivityPurpose.ASSESSMENT);
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Select Activity Type</h2>
        <p className="text-muted-foreground">
          Choose the type of activity you want to create
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activity types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <ActivityTypeGrid 
            types={filteredActivityTypes} 
            onSelect={onSelect} 
          />
        </TabsContent>
        
        <TabsContent value="learning" className="mt-4">
          <ActivityTypeGrid 
            types={filteredActivityTypes} 
            onSelect={onSelect} 
          />
        </TabsContent>
        
        <TabsContent value="assessment" className="mt-4">
          <ActivityTypeGrid 
            types={filteredActivityTypes} 
            onSelect={onSelect} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ActivityTypeGridProps {
  types: typeof activityTypes;
  onSelect: (activityTypeId: string) => void;
}

function ActivityTypeGrid({ types, onSelect }: ActivityTypeGridProps) {
  if (types.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No activity types found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {types.map((type) => (
        <Card 
          key={type.id} 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => onSelect(type.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{type.icon}</span>
                <CardTitle>{type.name}</CardTitle>
              </div>
              <Badge variant={type.purpose === ActivityPurpose.LEARNING ? "secondary" : "default"}>
                {type.purpose === ActivityPurpose.LEARNING ? "Learning" : "Assessment"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>{type.description}</CardDescription>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between">
            <div className="flex space-x-2">
              {type.isGradable && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Gradable
                </Badge>
              )}
              {type.isInteractive && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Interactive
                </Badge>
              )}
            </div>
            <Button size="sm" onClick={() => onSelect(type.id)}>
              Select
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
