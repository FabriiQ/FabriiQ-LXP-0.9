# Teacher Activities Components

This directory contains components for teacher activities, including both the original components and enhanced versions.

## Enhanced Components

The enhanced components are located in the `enhanced` subdirectory. These components use the new activities architecture from the `features/activities` folder.

### Available Enhanced Components

- `ActivityTypeSelectorGrid`: A grid of activity types for selection
- `UnifiedActivityCreator`: A unified component for creating activities of any type
- `ActivityViewer`: A component for viewing activities
- `ActivityEditor`: A component for editing activities
- `ActivityAnalyticsWrapper`: A wrapper for activity analytics

### Usage

To use the enhanced components, import them from `@/components/teacher/activities/enhanced`:

```tsx
import {
  ActivityTypeSelectorGrid,
  UnifiedActivityCreator,
  ActivityViewer,
  ActivityEditor,
  ActivityAnalyticsWrapper
} from '@/components/teacher/activities/enhanced';
```

### Enhanced Pages

Enhanced versions of the teacher activities pages are available with the `.enhanced.tsx` extension:

- `src/app/teacher/classes/[classId]/activities/page.enhanced.tsx`
- `src/app/teacher/classes/[classId]/activities/create/page.enhanced.tsx`
- `src/app/teacher/classes/[classId]/activities/[activityId]/page.enhanced.tsx`
- `src/app/teacher/classes/[classId]/activities/[activityId]/grade/page.enhanced.tsx`

To use these enhanced pages, rename them to replace the existing pages or create new routes for them.

## Implementation Details

The enhanced components use the activity registry from the `features/activities` folder to get information about activity types and load the appropriate editor components. They support all the capabilities of the new activities architecture, including:

- Gradable activities
- Manual grading
- Interactive activities
- Different activity purposes

## Migration Plan

To migrate from the original components to the enhanced components:

1. Start by using the enhanced components in new pages
2. Test thoroughly to ensure compatibility with your data
3. Gradually replace the original components with the enhanced components
4. Update the imports in your existing pages to use the enhanced components

## Future Work

The following components are planned for future implementation:

- `ActivityList`: A component for listing activities
- `ActivityGrading`: A component for grading activities
- `BatchGrading`: A component for batch grading activities
