'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkle } from '@/components/ui/icons/sparkle';
import { Edit } from 'lucide-react';
import { ActivityPurpose, LearningActivityType } from '@/server/api/constants';
import { recordAIStudioPerformance } from '@/features/content-studio/utils/performance-monitoring';

export type GenerationMethod = 'ai' | 'manual';

interface GenerationMethodSelectorProps {
  activityType: LearningActivityType;
  activityPurpose: ActivityPurpose;
  onSelect: (method: GenerationMethod) => void;
}

export function GenerationMethodSelector({
  activityType,
  activityPurpose,
  onSelect,
}: GenerationMethodSelectorProps) {
  const startTime = performance.now();

  const handleSelect = (method: GenerationMethod) => {
    const selectStartTime = performance.now();
    onSelect(method);
    const selectEndTime = performance.now();
    recordAIStudioPerformance('GenerationMethodSelector', 'selectMethod', selectStartTime, selectEndTime);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">Choose Creation Method</h2>
        <p className="text-muted-foreground mt-1">
          How would you like to create this activity?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted border-2 hover:border-primary"
          onClick={() => handleSelect('ai')}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Sparkle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Generated</h3>
              <p className="text-muted-foreground">
                Let AI create your activity based on your parameters. You can refine the content afterward.
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Quick content generation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Customizable parameters</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Editable after generation</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted border-2 hover:border-primary"
          onClick={() => handleSelect('manual')}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Edit className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Manual Creation</h3>
              <p className="text-muted-foreground">
                Create your activity from scratch with full control over all content and settings.
              </p>
              <ul className="mt-4 text-sm text-left space-y-2">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Complete creative control</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Structured activity editor</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Use your own content</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
