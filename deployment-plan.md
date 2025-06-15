# Teacher Activities Update Deployment Plan

This document outlines the plan for deploying the enhanced teacher activities components that use the new activities architecture from the `features/activities` folder.

## Overview

The enhanced components have been developed and tested in parallel with the existing components. This plan outlines the steps to replace the existing components with the enhanced versions.

## Deployment Steps

### 1. Backup Existing Files

Before making any changes, create backups of the existing files:

```bash
# Create a backup directory
mkdir -p backups/teacher/activities

# Copy existing files to the backup directory
cp -r src/app/teacher/classes/[classId]/activities/* backups/teacher/activities/
```

### 2. Copy Enhanced Components

Copy the enhanced components to their final locations:

```bash
# Copy enhanced components
cp -r src/components/teacher/activities/enhanced/* src/components/teacher/activities/
```

### 3. Update Import Paths

Update import paths in the following files:

- `src/app/teacher/classes/[classId]/activities/create/page.tsx`
- `src/app/teacher/classes/[classId]/activities/[activityId]/page.tsx`
- `src/app/teacher/classes/[classId]/activities/page.tsx`
- `src/app/teacher/classes/[classId]/activities/[activityId]/grade/page.tsx`

Replace:
```tsx
import {
  ActivityTypeSelectorGrid,
  ReadingActivityCreator,
  QuizActivityCreator,
  VideoActivityCreator,
  H5PActivityCreator
} from '@/features/activities/components';
```

With:
```tsx
import {
  ActivityTypeSelectorGrid,
  UnifiedActivityCreator,
  ActivityViewer,
  ActivityEditor,
  ActivityList,
  ActivityGrading
} from '@/components/teacher/activities';
```

### 4. Replace Page Components

Replace the existing page components with the enhanced versions:

1. **Create Activity Page**:
   - Replace `src/app/teacher/classes/[classId]/activities/create/page.tsx` with the enhanced version
   - Update the component to use `UnifiedActivityCreator` instead of specific activity creators

2. **Activity Detail Page**:
   - Replace `src/app/teacher/classes/[classId]/activities/[activityId]/page.tsx` with the enhanced version
   - Update the component to use `ActivityViewer` and `ActivityEditor`

3. **Activities List Page**:
   - Replace `src/app/teacher/classes/[classId]/activities/page.tsx` with the enhanced version
   - Update the component to use `ActivityList`

4. **Activity Grading Page**:
   - Replace `src/app/teacher/classes/[classId]/activities/[activityId]/grade/page.tsx` with the enhanced version
   - Update the component to use `ActivityGrading`

### 5. Test the Deployment

After deploying the changes, test the following functionality:

1. **Activity Creation**:
   - Create activities of different types
   - Verify that the activities are created with the correct content structure
   - Check that the `useComponentSystem` flag is set to `true`

2. **Activity Viewing**:
   - View activities of different types
   - Verify that the correct viewer component is loaded
   - Check that the activity details are displayed correctly

3. **Activity Editing**:
   - Edit activities of different types
   - Verify that the correct editor component is loaded
   - Check that the changes are saved correctly

4. **Activity Grading**:
   - Grade activities of different types
   - Verify that the correct grading component is loaded
   - Check that the grades are saved correctly

### 6. Rollback Plan

If issues are encountered during deployment, follow these steps to roll back the changes:

```bash
# Restore backup files
cp -r backups/teacher/activities/* src/app/teacher/classes/[classId]/activities/

# Remove enhanced components
rm -rf src/components/teacher/activities/enhanced
```

## Post-Deployment Tasks

After successful deployment, perform the following tasks:

1. **Documentation**:
   - Update the documentation to reflect the new architecture
   - Document any changes to the API or component interfaces

2. **Training**:
   - Train developers on the new architecture
   - Provide examples of how to use the enhanced components

3. **Cleanup**:
   - Remove any deprecated components or files
   - Update import paths in other files that may be using the old components

## Conclusion

This deployment plan provides a structured approach to replacing the existing teacher activities components with the enhanced versions. By following this plan, we can ensure a smooth transition to the new architecture while minimizing the risk of issues.
