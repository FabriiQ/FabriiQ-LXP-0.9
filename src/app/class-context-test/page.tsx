'use client';

/**
 * Class Context Test Page
 * 
 * This page demonstrates the functionality of the ClassContext.
 * It shows how to use the ClassProvider and useClass hook in a real application.
 */

import { ClassContextTest } from '@/components/student/class-context-test';
import { PageTransitionWrapper } from '@/components/ui';

export default function ClassContextTestPage() {
  return (
    <PageTransitionWrapper className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Class Context Test</h1>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates the Class Context implementation for the Student Portal Revamp.
        The context provides information about a student's class, including performance metrics,
        achievements, and attendance. It follows mental models by organizing information in a
        way that aligns with how students think about their classes.
      </p>
      
      <div className="mb-8 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Loading states with educational micro-content (Did you know facts)</li>
          <li>Error states with empathetic messaging</li>
          <li>Organized data structure that matches student mental models</li>
          <li>Retry functionality for error recovery</li>
          <li>Integration with tRPC for data fetching</li>
        </ul>
      </div>
      
      <ClassContextTest />
    </PageTransitionWrapper>
  );
}
