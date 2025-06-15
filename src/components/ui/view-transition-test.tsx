'use client';

import { ViewTransitionLink } from './view-transition-link';
import { Button } from './button';

/**
 * ViewTransitionTest - A component to test the View Transitions API
 * 
 * This component provides links to navigate between pages with smooth transitions.
 * It demonstrates the use of the ViewTransitionLink component with different styles.
 */
export function ViewTransitionTest() {
  return (
    <div className="p-6 space-y-6 bg-background rounded-lg border border-border">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">View Transitions API Test</h2>
        <p className="text-muted-foreground">
          Click the links below to test page transitions with the View Transitions API.
          Notice how the transitions maintain context and reduce cognitive load.
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <ViewTransitionLink 
          href="/dashboard" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          ariaLabel="Navigate to Dashboard"
        >
          Dashboard
        </ViewTransitionLink>
        
        <ViewTransitionLink 
          href="/activities" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2"
          ariaLabel="Navigate to Activities"
        >
          Activities
        </ViewTransitionLink>
        
        <ViewTransitionLink 
          href="/profile" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          ariaLabel="Navigate to Profile"
        >
          Profile
        </ViewTransitionLink>
        
        <ViewTransitionLink 
          href="/settings" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary underline-offset-4 hover:underline h-10 px-4 py-2"
          ariaLabel="Navigate to Settings"
        >
          Settings
        </ViewTransitionLink>
      </div>
      
      <div className="pt-4 border-t border-border">
        <h3 className="text-lg font-medium mb-2">With Button Styling</h3>
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <ViewTransitionLink 
              href="/dashboard" 
              ariaLabel="Navigate to Dashboard"
            >
              Dashboard
            </ViewTransitionLink>
          </Button>
          
          <Button variant="secondary" asChild>
            <ViewTransitionLink 
              href="/activities" 
              ariaLabel="Navigate to Activities"
            >
              Activities
            </ViewTransitionLink>
          </Button>
          
          <Button variant="outline" asChild>
            <ViewTransitionLink 
              href="/profile" 
              ariaLabel="Navigate to Profile"
            >
              Profile
            </ViewTransitionLink>
          </Button>
          
          <Button variant="link" asChild>
            <ViewTransitionLink 
              href="/settings" 
              ariaLabel="Navigate to Settings"
            >
              Settings
            </ViewTransitionLink>
          </Button>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          This component demonstrates the View Transitions API with haptic feedback on mobile devices,
          loading indicators for slow connections, and accessibility support.
        </p>
      </div>
    </div>
  );
}
