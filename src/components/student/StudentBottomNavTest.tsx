'use client';

import { useState } from 'react';
import { StudentBottomNav } from './StudentBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Test component for StudentBottomNav
 * 
 * This component allows testing the StudentBottomNav with different class IDs
 * and provides information about the component's features.
 */
export function StudentBottomNavTest() {
  const [classId, setClassId] = useState('123');
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Student Bottom Navigation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2">Enter a class ID to test navigation links:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="px-3 py-2 border rounded-md"
                placeholder="Class ID"
              />
              <Button onClick={() => setClassId(classId)}>Update</Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Features Implemented:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Limited to 5 options (Hick's Law)</li>
              <li>Collapsible functionality with clear visual affordance</li>
              <li>Subtle animation for expand/collapse (50ms duration)</li>
              <li>Consistent iconography with text labels (dual-coding principle)</li>
              <li>Haptic feedback on touch devices (10ms vibration)</li>
              <li>Visual indicators for current section (reducing cognitive load)</li>
              <li>Mobile optimization with min 44px touch targets</li>
              <li>Accessible with proper ARIA attributes</li>
              <li>Keyboard navigation support</li>
              <li>State persistence using localStorage</li>
            </ul>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">
              Note: The navigation links will use the class ID provided above.
              Try collapsing and expanding the navigation, and test keyboard navigation
              by using Tab to focus on the toggle and Enter to activate it.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Placeholder content to demonstrate scrolling */}
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p>Scroll content {i + 1}</p>
              <p className="text-muted-foreground">
                This content demonstrates how the bottom navigation stays fixed
                while the page content scrolls.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* The StudentBottomNav component */}
      <StudentBottomNav classId={classId} />
    </div>
  );
}
