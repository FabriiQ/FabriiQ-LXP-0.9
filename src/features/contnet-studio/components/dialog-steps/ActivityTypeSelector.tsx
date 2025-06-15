'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, FileText } from 'lucide-react';
import { Dumbbell as DumbbellIcon } from '@/components/ui/icons/dumbbell';
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';
// Import directly from the new activities architecture
import * as Activities from '@/features/activties';
import { Badge } from '@/components/ui/badge';
// Performance monitoring removed

// Define activity types directly
const ACTIVITY_TYPES = [
  {
    id: 'multiple-choice',
    name: 'Multiple Choice',
    description: 'Create a quiz with multiple choice questions.',
    category: ActivityPurpose.ASSESSMENT,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  },
  {
    id: 'true-false',
    name: 'True/False',
    description: 'Create a quiz with true/false statements.',
    category: ActivityPurpose.ASSESSMENT,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  },
  {
    id: 'multiple-response',
    name: 'Multiple Response',
    description: 'Create a quiz with multiple response questions (select all that apply).',
    category: ActivityPurpose.ASSESSMENT,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  },
  {
    id: 'fill-in-the-blanks',
    name: 'Fill in the Blanks',
    description: 'Create a fill in the blanks activity.',
    category: ActivityPurpose.ASSESSMENT,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  },
  {
    id: 'matching',
    name: 'Matching',
    description: 'Create a matching activity.',
    category: ActivityPurpose.ASSESSMENT,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  },
  {
    id: 'sequence',
    name: 'Sequence',
    description: 'Create an activity where students arrange items in the correct order.',
    category: ActivityPurpose.ASSESSMENT,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  },
  {
    id: 'reading',
    name: 'Reading',
    description: 'Create a reading activity with text content.',
    category: ActivityPurpose.LEARNING,
    capabilities: {
      isGradable: false,
      hasSubmission: false,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  },
  {
    id: 'video',
    name: 'Video',
    description: 'Create a video activity with embedded video content.',
    category: ActivityPurpose.LEARNING,
    capabilities: {
      isGradable: false,
      hasSubmission: false,
      hasInteraction: true,
      hasRealTimeComponents: false,
    }
  }
];

interface ActivityTypeSelectorProps {
  onSelect: (typeId: string, purpose?: ActivityPurpose) => void;
  initialPurpose?: ActivityPurpose;
  showSearch?: boolean;
  showTabs?: boolean;
  showCapabilities?: boolean;
}

export function ActivityTypeSelector({
  onSelect,
  initialPurpose = ActivityPurpose.ASSESSMENT,
  showSearch = true,
  showTabs = true,
  showCapabilities = true,
}: ActivityTypeSelectorProps) {
  // Performance monitoring removed
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>(initialPurpose);

  // Filter activities by category
  const learningActivities = useMemo(() => {
    return ACTIVITY_TYPES.filter(type => type.category === ActivityPurpose.LEARNING);
  }, []);

  const assessmentActivities = useMemo(() => {
    return ACTIVITY_TYPES.filter(type => type.category === ActivityPurpose.ASSESSMENT);
  }, []);

  const practiceActivities = useMemo(() => {
    return ACTIVITY_TYPES.filter(type => type.category === ActivityPurpose.PRACTICE);
  }, []);

  // Filter activities based on search query with memoization for performance
  const filteredLearningActivities = useMemo(() => {
    // Performance monitoring removed
    const result = learningActivities.filter(activity =>
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Performance monitoring removed
    return result;
  }, [learningActivities, searchQuery]);

  const filteredAssessmentActivities = useMemo(() => {
    return assessmentActivities.filter(activity =>
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [assessmentActivities, searchQuery]);

  const filteredPracticeActivities = useMemo(() => {
    return practiceActivities.filter(activity =>
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [practiceActivities, searchQuery]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle activity type selection
  const handleSelectActivity = (id: string, purpose: ActivityPurpose) => {
    // Performance monitoring removed

    // Find the activity type in our predefined list
    const activityDef = ACTIVITY_TYPES.find(type => type.id === id);

    if (!activityDef) {
      console.error(`Activity type ${id} not found in activity types`);
      return;
    }

    console.log(`Selected activity type: ${id} with purpose: ${purpose}`);

    // Simply pass the activity type ID and purpose to the parent component
    onSelect(id, purpose);

    // Performance monitoring removed
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Select Activity Type</h2>
        <p className="text-muted-foreground mt-1">
          Choose the type of activity you want to create
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search activity types..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            // Performance monitoring removed
          }}
        />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value={ActivityPurpose.LEARNING} className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Learning
          </TabsTrigger>
          <TabsTrigger value={ActivityPurpose.ASSESSMENT} className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value={ActivityPurpose.PRACTICE} className="flex items-center">
            <DumbbellIcon className="h-4 w-4 mr-2" />
            Practice
          </TabsTrigger>
        </TabsList>

        <TabsContent value={ActivityPurpose.LEARNING}>
          <ScrollArea className="h-[calc(100%-40px)] max-h-[350px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLearningActivities.length > 0 ? (
                filteredLearningActivities.map((activity) => (
                  <Card
                    key={activity.id}
                    className="cursor-pointer transition-colors hover:bg-muted"
                    onClick={() => handleSelectActivity(activity.id, ActivityPurpose.LEARNING)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-medium">{activity.name}</span>
                          <Badge variant="outline">Learning</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">No learning activities found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value={ActivityPurpose.ASSESSMENT}>
          <ScrollArea className="h-[calc(100%-40px)] max-h-[350px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssessmentActivities.length > 0 ? (
                filteredAssessmentActivities.map((activity) => (
                  <Card
                    key={activity.id}
                    className="cursor-pointer transition-colors hover:bg-muted"
                    onClick={() => handleSelectActivity(activity.id, ActivityPurpose.ASSESSMENT)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-medium">{activity.name}</span>
                          <Badge variant="outline">Assessment</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">No assessment activities found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value={ActivityPurpose.PRACTICE}>
          <ScrollArea className="h-[calc(100%-40px)] max-h-[350px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPracticeActivities.length > 0 ? (
                filteredPracticeActivities.map((activity) => (
                  <Card
                    key={activity.id}
                    className="cursor-pointer transition-colors hover:bg-muted"
                    onClick={() => handleSelectActivity(activity.id, ActivityPurpose.PRACTICE)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-lg font-medium">{activity.name}</span>
                          <Badge variant="outline">Practice</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-8">
                  <p className="text-muted-foreground">No practice activities found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
