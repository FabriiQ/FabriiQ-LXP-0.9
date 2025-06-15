# Enhanced Teacher Activities Components

This directory contains enhanced versions of the teacher activities components that use the new activities architecture from the `features/activities` folder.

## Components

### ActivityTypeSelectorGrid

An enhanced version of the activity type selector that uses the activity registry from the `features/activities` folder. It provides:

- Filtering by activity purpose (Learning, Assessment)
- Searching by activity name and description
- Visual indicators for activity capabilities (gradable, interactive, etc.)
- Grouping activities by purpose
- Loading states and error handling

### UnifiedActivityCreator

A unified activity creator component that uses the activity registry to load the appropriate editor component for the selected activity type. It provides:

- Common fields for all activity types (title, description, etc.)
- Grading options for gradable activities
- Activity-specific configuration using the editor component from the registry
- Form validation using Zod schemas
- Loading states and error handling

### ActivityViewer

A component for viewing activities that uses the activity registry to load the appropriate viewer component. It provides:

- Activity details display
- Activity-specific viewer component
- Tabs for different views (preview, edit, analytics)
- Support for teacher and student views
- Error handling for missing activity types

### ActivityEditor

A component for editing existing activities that uses the activity registry to load the appropriate editor component. It provides:

- Form for editing common fields
- Activity-specific editor component
- Grading options for gradable activities
- Form validation using Zod schemas
- Error handling for missing activity types

### ActivityList

A component for displaying a list of activities with filtering and sorting options. It provides:

- Filtering by purpose and search term
- Sorting by date, title, or purpose
- Activity cards with details and actions
- Visual indicators for activity capabilities
- Loading states and error handling

### ActivityGrading

A component for grading student submissions for an activity. It provides:

- Student list with submission status
- Submission viewer using the activity-specific viewer component
- Grading form with score and feedback
- Support for manual grading
- Integration with the gradebook system

## Usage

```tsx
// Import the components
import {
  ActivityTypeSelectorGrid,
  UnifiedActivityCreator,
  ActivityViewer,
  ActivityEditor,
  ActivityList,
  ActivityGrading
} from '@/components/teacher/activities/enhanced';

// Use the ActivityTypeSelectorGrid to select an activity type
<ActivityTypeSelectorGrid onSelect={handleSelectActivityType} />

// Use the UnifiedActivityCreator to create an activity
<UnifiedActivityCreator
  activityTypeId={selectedActivityType}
  classId={classId}
  subjectId={subjectId}
  onSuccess={handleSuccess}
  onCancel={handleCancel}
/>

// Use the ActivityViewer to view an activity
<ActivityViewer
  activity={activity}
  onEdit={handleEditToggle}
  isTeacher={true}
/>

// Use the ActivityEditor to edit an activity
<ActivityEditor
  activity={activity}
  onSuccess={handleEditSuccess}
  onCancel={handleEditToggle}
/>

// Use the ActivityList to display a list of activities
<ActivityList
  classId={classId}
  activities={activities}
  isLoading={isLoading}
  onDelete={handleDelete}
  onRefresh={refetchActivities}
/>

// Use the ActivityGrading to grade student submissions
<ActivityGrading
  activityId={activityId}
  classId={classId}
  maxScore={activity.maxScore || 100}
/>
```

## Implementation Details

These components use the activity registry from the `features/activities` folder to get information about activity types and load the appropriate editor components. They support all the capabilities of the new activities architecture, including:

- Gradable activities
- Manual grading
- Interactive activities
- Different activity purposes

The components are designed to be used in the teacher activities pages, replacing the old activity creation components.

## Testing

The components include unit tests to ensure they work correctly. You can run the tests with:

```bash
npm test
```
