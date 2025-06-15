'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityTypeSelectorGridProps {
  onSelect?: (type: string) => void;
  className?: string;
}

/**
 * ActivityTypeSelectorGrid
 * 
 * A placeholder component for the activity type selector grid
 */
export function ActivityTypeSelectorGrid({ onSelect, className }: ActivityTypeSelectorGridProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Select Activity Type</CardTitle>
        <CardDescription>
          Choose the type of activity you want to create
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div 
            className="p-4 border rounded-md cursor-pointer hover:bg-muted"
            onClick={() => onSelect?.('quiz')}
          >
            <h3 className="font-medium">Quiz</h3>
            <p className="text-sm text-muted-foreground">Multiple choice questions</p>
          </div>
          <div 
            className="p-4 border rounded-md cursor-pointer hover:bg-muted"
            onClick={() => onSelect?.('reading')}
          >
            <h3 className="font-medium">Reading</h3>
            <p className="text-sm text-muted-foreground">Text-based content</p>
          </div>
          <div 
            className="p-4 border rounded-md cursor-pointer hover:bg-muted"
            onClick={() => onSelect?.('video')}
          >
            <h3 className="font-medium">Video</h3>
            <p className="text-sm text-muted-foreground">Video-based content</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
