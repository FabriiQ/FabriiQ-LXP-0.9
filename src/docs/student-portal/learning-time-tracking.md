# Learning Time Tracking System

This document outlines the implementation of the learning time tracking system in the Aivy LXP platform, focusing on how student learning time is tracked, stored, and displayed.

## Overview

The learning time tracking system has been designed to:

1. Track time spent on learning activities in real-time
2. Aggregate time data by subject, activity type, and time period
3. Visualize learning time investment for students
4. Provide insights into learning patterns and habits

## Implementation Details

### Database Integration

The system stores time tracking data in the existing `ActivityGrade` model:

```prisma
model ActivityGrade {
  // Existing fields...
  content        Json?            // Student answers and time tracking data
}
```

Time tracking data is stored in the `content` JSON field with the following structure:

```json
{
  "timeSpent": 15,  // Time spent in minutes
  // Other content fields...
}
```

### Core Components

#### 1. Learning Time Service

The `LearningTimeService` handles recording and retrieving time tracking data:

- `recordTimeSpent`: Records time spent on an activity
- `getLearningTimeStats`: Retrieves aggregated time statistics

#### 2. Time Tracking Provider

The `TimeTrackingProvider` is a React context provider that manages real-time tracking:

- `startTracking`: Starts tracking time for an activity
- `stopTracking`: Stops tracking and records the time spent
- `isTracking`: Checks if an activity is being tracked
- `getElapsedTime`: Gets the current elapsed time for an activity

#### 3. withTimeTracking HOC

The `withTimeTracking` higher-order component makes it easy to add time tracking to any activity component:

```tsx
const TrackedActivityComponent = withTimeTracking(ActivityComponent);
```

### UI Components

#### 1. LearningTimeInvestment

Dashboard component that displays a summary of learning time investment:

- Total time spent
- Most time spent on (subject)
- Activity type breakdown

#### 2. LearningTimeAnalytics

Detailed analytics component for the dedicated learning time page:

- Time breakdown by subject
- Time breakdown by activity type
- Time trends over time periods

#### 3. TimeTrackingDisplay

Real-time display of time being tracked for an activity:

- Shows elapsed time in mm:ss format
- Only appears when an activity is being tracked

## User Flow

1. **Starting Time Tracking**:
   - Time tracking starts automatically when a student opens an activity
   - The `TimeTrackingProvider` begins tracking time

2. **During Activity**:
   - The `TimeTrackingDisplay` shows elapsed time (optional)
   - Time continues to accumulate as long as the activity is open

3. **Ending Time Tracking**:
   - When the student completes or leaves the activity, tracking stops
   - The time spent is recorded in the database

4. **Viewing Time Data**:
   - Students can see their time investment on the dashboard
   - Detailed analytics are available on the dedicated learning time page

## Integration Points

### Activity Components

To add time tracking to an activity component:

```tsx
// Option 1: Use the HOC
import { withTimeTracking } from '@/components/student/withTimeTracking';

const MyActivity = ({ activityId, ...props }) => {
  // Component implementation
};

export default withTimeTracking(MyActivity);

// Option 2: Use the provider directly
import { useTimeTracking } from '@/components/providers/TimeTrackingProvider';

function MyActivity({ activityId }) {
  const { startTracking, stopTracking } = useTimeTracking();
  
  useEffect(() => {
    startTracking(activityId);
    return () => stopTracking(activityId);
  }, [activityId]);
  
  // Component implementation
}
```

### Dashboard Integration

The dashboard displays a summary of learning time investment:

```tsx
import { LearningTimeInvestment } from '@/components/student/LearningTimeInvestment';

// In the dashboard component
<LearningTimeInvestment classId={classId} />
```

### Dedicated Analytics Page

A dedicated page provides detailed time tracking analytics:

```tsx
import { LearningTimeAnalytics } from '@/components/student/LearningTimeAnalytics';

// In the learning time page component
<LearningTimeAnalytics classId={classId} />
```

## UX Considerations

The learning time tracking system incorporates several UX principles:

1. **Sunk Cost Effect**: Showing students their time investment encourages continued engagement
2. **Transparency**: Clear visualization of where time is being spent
3. **Non-intrusive**: Time tracking happens in the background without disrupting learning
4. **Actionable Insights**: Data is presented in a way that can inform study habits

## Future Enhancements

1. **Offline Support**: Add support for tracking time when students are offline
2. **Learning Efficiency Metrics**: Calculate and display learning efficiency (points earned per time spent)
3. **Time Goals**: Allow students to set and track time investment goals
4. **Recommendations**: Provide recommendations based on time tracking data
5. **Teacher Insights**: Give teachers visibility into student time investment

## Technical Reference

### API Endpoints

The following tRPC endpoints are available for time tracking:

- `learningTime.recordTimeSpent`: Records time spent on an activity
- `learningTime.getLearningTimeStats`: Gets learning time statistics

### Component Props

#### LearningTimeInvestment

```tsx
interface LearningTimeInvestmentProps {
  classId: string;
}
```

#### LearningTimeAnalytics

```tsx
interface LearningTimeAnalyticsProps {
  classId: string;
}
```

#### TimeTrackingDisplay

```tsx
interface TimeTrackingDisplayProps {
  activityId: string;
  className?: string;
}
```

## Conclusion

The learning time tracking system provides valuable insights into student learning patterns and helps students understand their time investment. By making time investment visible, the system encourages more deliberate and efficient learning practices.
