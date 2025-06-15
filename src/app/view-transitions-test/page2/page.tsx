'use client';

import { ViewTransitionLink, PageTransitionWrapper } from '@/components/ui';
import { Button } from '@/components/ui/button';

export default function Page2() {
  return (
    <PageTransitionWrapper className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Page 2</h1>
      <p className="mb-6 text-muted-foreground">
        This is Page 2 of the View Transitions API demo. Notice how the transition
        maintains context and reduces cognitive load when navigating between pages.
      </p>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <Button asChild>
          <ViewTransitionLink 
            href="/view-transitions-test" 
            ariaLabel="Back to Demo Home"
          >
            Back to Demo Home
          </ViewTransitionLink>
        </Button>
        
        <Button variant="secondary" asChild>
          <ViewTransitionLink 
            href="/view-transitions-test/page1" 
            ariaLabel="Go to Page 1"
          >
            Go to Page 1
          </ViewTransitionLink>
        </Button>
        
        <Button variant="outline" asChild>
          <ViewTransitionLink 
            href="/view-transitions-test/page3" 
            ariaLabel="Go to Page 3"
          >
            Go to Page 3
          </ViewTransitionLink>
        </Button>
      </div>
      
      <div className="p-6 bg-secondary/10 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Page 2 Content</h2>
        <p>
          This page demonstrates the View Transitions API with a secondary color theme.
          The transitions are designed to be smooth and maintain context between pages.
        </p>
      </div>
    </PageTransitionWrapper>
  );
}
