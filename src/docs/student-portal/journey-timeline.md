# Learning Journey Visual Timeline

The Learning Journey Visual Timeline is a feature in the student profile that provides a chronological display of significant events in a student's educational progress. This feature implements the "Storytelling Effect" UX psychology principle to create a narrative of the student's achievements and progress.

## Features

- **Visual Timeline**: A vertical timeline with color-coded events and icons
- **Event Types**: Different types of events (achievements, level-ups, activities, enrollments, milestones)
- **Animations**: Subtle animations for a more engaging experience
- **Color Coding**: Different colors for different event types
- **Responsive Design**: Works well on both desktop and mobile devices

## Implementation Details

### Components

The visual timeline is implemented in the `ClassProfile` component in `src/components/student/ClassProfile.tsx`. The timeline is displayed in the "Journey" tab of the student profile.

### Data Model

Journey events are stored in the `JourneyEvent` model in the database:

```prisma
model JourneyEvent {
  id           String         @id @default(cuid())
  studentId    String
  title        String
  description  String
  date         DateTime
  type         String
  classId      String?
  subjectId    String?
  icon         String?
  metadata     Json?
  status       SystemStatus   @default(ACTIVE)
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
  partitionKey String?
  class        Class?         @relation(fields: [classId], references: [id])
  student      StudentProfile @relation(fields: [studentId], references: [id])
  subject      Subject?       @relation(fields: [subjectId], references: [id])
}
```

### Event Types

The timeline supports the following event types:

- `achievement`: When a student unlocks an achievement
- `level`: When a student reaches a new level
- `activity`: When a student completes a significant activity
- `enrollment`: When a student enrolls in a class or course
- `milestone`: Other significant milestones in the student's journey

### API

Journey events are fetched using the tRPC API:

```typescript
// Fetch journey events using tRPC
const { isLoading: isLoadingJourneyEvents } = api.journeyEvent.getStudentJourneyEvents.useQuery(
  {
    studentId,
    classId,
    limit: 10
  },
  {
    enabled: !!studentId && !!classId,
    onSuccess: (data) => {
      if (data) {
        // Transform API data to component-expected format
        const adaptedEvents = data.map(adaptJourneyEvent);
        setJourneyEvents(adaptedEvents);
      }
    }
  }
);
```

## Testing the Timeline

To test the visual timeline, you can use the provided script to add sample journey events:

1. Open the script at `src/scripts/add-sample-journey-events.ts`
2. Update the `studentId` and `classId` variables with actual values from your database
3. Run the script:
   ```bash
   npx ts-node -r tsconfig-paths/register src/scripts/add-sample-journey-events.ts
   ```
4. Navigate to the student profile page in the application
5. Click on the "Journey" tab to view the timeline

## UX Psychology Principles

The Learning Journey Timeline implements several UX psychology principles:

1. **Storytelling Effect**: Creating a narrative of the student's progress
2. **Visual Hierarchy**: Using size, color, and position to indicate importance
3. **Progressive Disclosure**: Showing events in chronological order
4. **Chunking**: Grouping related events visually
5. **Recognition Over Recall**: Using icons to help identify event types
6. **Endowed Progress Effect**: Showing how far the student has come
7. **Goal Gradient Effect**: Encouraging continued progress

## Creating Journey Events

Journey events can be created programmatically using the JourneyEventService:

```typescript
// Example of creating a journey event
const journeyEventService = new JourneyEventService({ prisma });
await journeyEventService.createJourneyEvent({
  studentId: "student-id",
  title: "Completed First Quiz",
  description: "Successfully completed your first quiz with a score of 90%",
  date: new Date(),
  type: "activity",
  classId: "class-id"
});
```

## Future Enhancements

Potential future enhancements for the Learning Journey Timeline:

1. **Interactive Timeline**: Allow students to click on events for more details
2. **Filtering**: Add ability to filter events by type or date range
3. **Sharing**: Allow students to share their journey milestones
4. **Customization**: Let students add their own milestone events
5. **Predictions**: Show projected future milestones based on current progress
