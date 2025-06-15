'use client';

import { ClassDashboard } from '@/components/student/ClassDashboard';
import { ClassProvider } from '@/contexts/class-context';
import { ThemeProvider } from '@/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/**
 * Test page for ClassDashboard component
 * 
 * This page wraps the ClassDashboard component with necessary providers
 * and allows testing different states (loading, error, etc.)
 */
export default function ClassDashboardTestPage() {
  const [classId, setClassId] = useState('123');
  const [key, setKey] = useState(0);
  
  // Force a refresh of the component
  const refreshDashboard = () => {
    setKey(prev => prev + 1);
  };
  
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Class Dashboard Test</h1>
              <p className="text-muted-foreground">
                Testing the ClassDashboard component with UX psychology principles
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={refreshDashboard}>
                Refresh Dashboard
              </Button>
            </div>
          </div>
          
          <div className="mb-8 p-4 border rounded-md bg-muted/50">
            <h2 className="text-lg font-semibold mb-2">UX Psychology Principles Implemented:</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Progressive Disclosure:</strong> Information organized by importance</li>
              <li><strong>Picture Superiority Effect:</strong> Meaningful icons reinforce concepts</li>
              <li><strong>Chunking & Miller's Law:</strong> Related metrics grouped into 3-5 items</li>
              <li><strong>Labor Illusion:</strong> "Calculating progress" animations during loading</li>
              <li><strong>Color Psychology:</strong> Green for positive progress, yellow for areas needing attention</li>
              <li><strong>Zeigarnik Effect:</strong> Incomplete task indicators for assignments</li>
              <li><strong>Goal Gradient Effect:</strong> "Continue learning" section highlighting incomplete activities</li>
              <li><strong>Sunk Cost Effect:</strong> Time investment tracking to encourage continued engagement</li>
              <li><strong>Micro-interactions:</strong> Subtle animations and hover effects (scale: 1.02-1.05)</li>
            </ul>
          </div>
          
          <ClassProvider key={key} classId={classId}>
            <ClassDashboard />
          </ClassProvider>
        </div>
      </div>
    </ThemeProvider>
  );
}
