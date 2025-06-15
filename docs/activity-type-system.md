# Activity Type System

This document explains the activity type system in the LXP platform, including how activity types are represented and how to add new activity types.

## Activity Type Representations

The system uses two different representations of activity types:

1. **LearningActivityType Enum** (UPPERCASE_WITH_UNDERSCORES)
   - Defined in `src/server/api/constants.ts`
   - Used in the database schema as the `learningType` field
   - Example: `MULTIPLE_CHOICE`, `FILL_IN_THE_BLANKS`

2. **Display Names** (Title Case)
   - Human-readable names shown in the UI
   - Example: `Multiple Choice`, `Fill in the Blanks`

## Mapping Between Representations

The system uses a mapper utility in `src/features/activties/utils/activity-type-mapper.ts` to convert between these representations:

- `getActivityTypeDisplayName`: Converts from LearningActivityType enum values to display names
- `ensureActivityTypeConsistency`: Ensures `learningType` is set correctly

For backward compatibility, the following functions are also available:
- `mapActivityTypeToId`: Converts from enum values to kebab-case IDs (for components that expect kebab-case)
- `mapTypeIdToEnum`: Converts from kebab-case IDs to enum values

## Database Schema

The `Activity` model in the Prisma schema uses the `learningType` field to store the activity type:

```prisma
model Activity {
  // ...
  learningType   LearningActivityType? // Standardized activity type from enum (MULTIPLE_CHOICE, etc.)
  // ...
}
```

- `learningType`: The standardized enum value (e.g., `MULTIPLE_CHOICE`)

## Implemented Activity Types

The following activity types are currently implemented:

| LearningActivityType (Enum) | activityType (ID) | Display Name |
|----------------------------|-------------------|--------------|
| MULTIPLE_CHOICE | multiple-choice | Multiple Choice |
| TRUE_FALSE | true-false | True/False |
| MULTIPLE_RESPONSE | multiple-response | Multiple Response |
| FILL_IN_THE_BLANKS | fill-in-the-blanks | Fill in the Blanks |
| MATCHING | matching | Matching |
| SEQUENCE | sequence | Sequence |
| DRAG_AND_DROP | drag-and-drop | Drag and Drop |
| DRAG_THE_WORDS | drag-the-words | Drag the Words |
| FLASH_CARDS | flash-cards | Flash Cards |
| NUMERIC | numeric | Numeric |
| READING | reading | Reading |
| VIDEO | video | Video |
| QUIZ | quiz | Quiz |
| H5P | h5p | H5P |
| OTHER | other | Other |

## Adding a New Activity Type

To add a new activity type:

1. **Add to LearningActivityType Enum**
   ```typescript
   // src/server/api/constants.ts
   export enum LearningActivityType {
     // ...
     NEW_ACTIVITY_TYPE = "NEW_ACTIVITY_TYPE"
   }
   ```

2. **Create Activity Model**
   ```typescript
   // src/features/activties/models/new-activity-type.ts
   export interface NewActivityTypeActivity extends BaseActivity {
     // Define the activity-specific properties
     // ...
   }
   ```

3. **Update Activity Type Mapper**
   ```typescript
   // src/features/activties/utils/activity-type-mapper.ts
   // In enumDisplayNames
   'NEW_ACTIVITY_TYPE': 'New Activity Type',

   // For backward compatibility
   // In learningTypeMapping
   'NEW_ACTIVITY_TYPE': 'new-activity-type',

   // In reverseMapping
   'new-activity-type': LAT.NEW_ACTIVITY_TYPE,

   // In kebabCaseDisplayNames
   'new-activity-type': 'New Activity Type',
   ```

4. **Create Viewer and Editor Components**
   ```typescript
   // src/features/activties/components/new-activity-type/NewActivityTypeViewer.tsx
   // src/features/activties/components/new-activity-type/NewActivityTypeEditor.tsx
   ```

5. **Create Grading Function**
   ```typescript
   // src/features/activties/grading/new-activity-type.ts
   export function gradeNewActivityTypeActivity(activity, answers) {
     // ...
   }
   ```

6. **Register in Component Registry**
   ```typescript
   // Update any component registries to include the new activity type
   ```

## Best Practices

1. **Use LearningActivityType**: When creating or updating activities, always set the `learningType` field.
2. **Use the Mapper**: Use the `ensureActivityTypeConsistency` function to ensure `learningType` is set correctly.
3. **Consistent Naming**: Follow the naming conventions for each representation.
4. **Complete Implementation**: Ensure all components (model, viewer, editor, grading) are implemented for each activity type.
