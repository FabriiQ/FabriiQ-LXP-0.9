# Server-Side Rendering Fixes for Activities

This document outlines the changes made to fix server-side rendering (SSR) issues with the activities architecture.

## Issues Identified

1. **Window Reference Error**: The activity registry loader was trying to access the `window` object during server-side rendering, which is not available in a Node.js environment.

2. **Import Path Issues**: Several components were using incorrect import paths for UI components, particularly after the UI components unification plan was implemented.

3. **Static Imports in Server Components**: Server components were statically importing client-side code that uses browser APIs, causing SSR errors.

## Changes Made

### 1. Activity Registry Loader

**File**: `src/features/activities/registry/loader.ts`

**Changes**:
- Added checks for `typeof window !== 'undefined'` before accessing window-specific APIs
- Modified the `prefetchActivityType` function to safely handle server-side rendering
- Updated the `requestIdleCallback` usage to check for browser environment first

```typescript
export function prefetchActivityType(activityTypeId: string): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // We're in a server environment, so we can't prefetch
    return;
  }
  
  // Prefetch editor
  if (activityEditors[activityTypeId] && !activityEditors[activityTypeId].loaded && !activityEditors[activityTypeId].loading) {
    activityEditors[activityTypeId].loading = true;

    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleLoad = (typeof window !== 'undefined' && window.requestIdleCallback) 
      ? window.requestIdleCallback 
      : ((cb) => setTimeout(cb, 1));

    scheduleLoad(() => {
      // ...
    });
  }
}
```

### 2. Activity Registry Provider

**File**: `src/app/activity-registry-provider.tsx`

**Changes**:
- Converted static imports to dynamic imports to avoid SSR issues
- Added error handling for activity registry initialization
- Moved initialization logic inside a useEffect hook to ensure it only runs in the browser

```typescript
export function ActivityRegistryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only import and initialize in the browser environment
    const initializeRegistry = async () => {
      try {
        // Dynamically import the register-activities module
        await import('@/components/shared/entities/activities/register-activities');
        console.log('ActivityRegistryProvider: Initialized activity registry');
        // Log all registered activity types
        activityRegistry.logAllActivityTypes();
      } catch (error) {
        console.error('Failed to initialize activity registry:', error);
      }
    };

    initializeRegistry();
  }, []);

  return <>{children}</>;
}
```

### 3. Register Activities

**File**: `src/components/shared/entities/activities/register-activities.ts`

**Changes**:
- Replaced static imports with dynamic imports inside a browser-only block
- Added server-side safety checks to exported functions
- Implemented Promise.all for parallel loading of activity types

```typescript
// Check if we're in a browser environment before importing activity types
if (typeof window !== 'undefined') {
  // Import activity types - these imports will trigger the registration in each file
  // Using dynamic imports to avoid SSR issues
  const importActivityTypes = async () => {
    try {
      await Promise.all([
        import('@/features/activities/types/multiple-choice'),
        import('@/features/activities/types/multiple-response'),
        // ... other imports
      ]);
      console.log('All activity types loaded successfully');
    } catch (error) {
      console.error('Error loading activity types:', error);
    }
  };
  
  // Execute the import function
  importActivityTypes();
}

// Export a function to get all registered activity types for AI generation
export function getActivityTypesForAIGeneration() {
  // Check if we're in a server environment
  if (typeof window === 'undefined') {
    return []; // Return empty array on server
  }
  
  // ... rest of the function
}
```

### 4. UI Component Import Paths

**Files**: Various components in the content-studio directory

**Changes**:
- Updated import paths to match the new UI components structure
- Replaced imports from `@/components/ui/button` with `@/components/ui/core/button`
- Replaced imports from `@/components/ui/inputs/button` with `@/components/ui/core/button`
- Updated other UI component imports to use the correct paths

Example:
```typescript
// Before
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// After
import { Button } from '@/components/ui/core/button';
import { Input } from '@/components/ui/core/input';
```

## Testing

After making these changes, the application should:

1. Load correctly during server-side rendering without window reference errors
2. Initialize the activity registry only in the browser environment
3. Properly load and display activities in both the teacher and student portals
4. Maintain all functionality while avoiding SSR errors

## Future Considerations

1. **Component Architecture**: Consider updating the activities architecture to better support server components in Next.js 13+.

2. **Server Actions**: Explore using server actions for data mutations instead of client-side API calls.

3. **Streaming SSR**: Implement streaming SSR for activity components to improve initial load performance.

4. **Documentation**: Update the activities architecture documentation to include best practices for SSR compatibility.

## Conclusion

These changes address the immediate SSR issues with the activities architecture while maintaining compatibility with the existing codebase. The modifications follow a pattern of:

1. Checking for browser environment before accessing browser-specific APIs
2. Using dynamic imports for client-side code
3. Moving initialization logic to useEffect hooks
4. Providing fallbacks for server-side rendering

This approach ensures that the application can be rendered on the server without errors while still providing the full functionality in the browser.
