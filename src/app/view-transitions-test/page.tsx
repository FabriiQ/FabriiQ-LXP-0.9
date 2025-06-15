'use client';

import { ViewTransitionTest, PageTransitionWrapper, ViewTransitionLink } from '@/components/ui';
import { Button } from '@/components/ui/button';

export default function ViewTransitionsTestPage() {
  return (
    <PageTransitionWrapper className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">View Transitions API Demo</h1>
      <p className="mb-6 text-muted-foreground">
        This page demonstrates the View Transitions API implementation for the Student Portal Revamp.
        The transitions are designed to reduce cognitive load and maintain context between page navigations.
      </p>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Pages</h2>
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <ViewTransitionLink
              href="/view-transitions-test/page1"
              ariaLabel="Go to Page 1"
            >
              Page 1
            </ViewTransitionLink>
          </Button>

          <Button variant="secondary" asChild>
            <ViewTransitionLink
              href="/view-transitions-test/page2"
              ariaLabel="Go to Page 2"
            >
              Page 2
            </ViewTransitionLink>
          </Button>

          <Button variant="outline" asChild>
            <ViewTransitionLink
              href="/view-transitions-test/page3"
              ariaLabel="Go to Page 3"
            >
              Page 3
            </ViewTransitionLink>
          </Button>
        </div>
      </div>

      <ViewTransitionTest />

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Smooth page transitions with 350ms duration (optimal for perception)</li>
          <li>Haptic feedback on mobile devices (10ms vibration)</li>
          <li>Loading indicators for slow connections</li>
          <li>Reduced motion support for accessibility</li>
          <li>Prefetching for perceived instant loading</li>
          <li>Fallback to regular navigation if View Transitions API is not supported</li>
        </ul>
      </div>
    </PageTransitionWrapper>
  );
}
