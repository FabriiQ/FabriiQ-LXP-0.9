# ClassDashboard Component

The `ClassDashboard` component implements a comprehensive dashboard for students to view their progress and activities in a specific class, following UX psychology principles to enhance usability and engagement.

## Features

### Progressive Disclosure
- Information is organized by importance, with the most critical metrics (grades, points, attendance) displayed first
- Secondary information (continue learning, achievements, time investment) is displayed below
- This reduces cognitive load and helps users focus on what matters most

### Picture Superiority Effect
- Meaningful icons reinforce concepts throughout the dashboard
- Icons are consistently used to represent specific types of information
- This improves recognition and recall of information

### Chunking & Miller's Law
- Related metrics are grouped into visual chunks of 3-5 items
- Primary metrics are displayed in a 3-column grid
- This makes information easier to process and remember

### Labor Illusion
- "Calculating your progress" animations during loading create perceived value
- Educational facts are displayed during loading to make waiting time productive
- Skeleton UI matches the final layout to prime users for the content

### Color Psychology
- Green is used for positive progress (≥90%)
- Yellow indicates areas needing attention (75-89%)
- Red highlights critical issues (<75%)
- This provides intuitive visual feedback on performance

### Zeigarnik Effect
- Incomplete task indicators for assignments maintain engagement
- Progress bars show partial completion to create tension that motivates completion
- "Last active" timestamps create urgency to return to incomplete activities

### Goal Gradient Effect
- "Continue learning" section highlights incomplete activities
- Progress indicators show how close users are to completion
- This increases motivation as users get closer to completing activities

### Sunk Cost Effect
- Time investment tracking shows hours spent learning
- Weekly goals with progress indicators encourage continued engagement
- This leverages users' tendency to continue investing in activities they've already spent time on

### Micro-interactions
- Subtle entrance animations for card appearance (staggered by 50ms)
- Hover/focus effects with scale transforms (1.02-1.05)
- These create a more engaging and responsive interface

## Implementation Details

### Animation System
- Staggered animations for different sections of the dashboard
- Sections fade in and slide up in sequence
- Individual cards within sections have additional staggered delays

### Loading State
- Skeleton UI that matches the final layout
- Educational facts displayed during loading
- Animated spinner with "calculating your progress" message

### Error Handling
- Empathetic error states with clear messages
- Recovery options (retry button)
- Contextual guidance on what to do next

### Responsive Design
- Adapts to different screen sizes
- Card layout changes from 3 columns to 1 column on mobile
- Touch-friendly interaction targets

## Usage

```tsx
import { ClassDashboard } from '@/components/student/ClassDashboard';
import { ClassProvider } from '@/contexts/class-context';

// Wrap with ClassProvider to provide data
<ClassProvider classId="123">
  <ClassDashboard />
</ClassProvider>
```

## Dependencies

- Requires the `ClassProvider` from `@/contexts/class-context`
- Uses UI components from `@/components/ui/*`
- Uses Lucide icons for visual elements

## Testing

You can test the component using the test page at `/student/class-dashboard-test`.
