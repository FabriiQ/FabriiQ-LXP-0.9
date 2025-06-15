# Student Portal Components

This directory contains components specific to the student portal.

## ClassProfile

The `ClassProfile` component displays a student's profile for a specific class, implementing several UX psychology principles to enhance engagement.

### Features

- **Student Information**: Display with customizable avatar (IKEA Effect)
- **Performance Metrics**: Level, points, attendance, grades, and activities
- **Achievements Section**: With progress indicators (Endowed Progress Effect)
- **Learning Goals**: Students can create and customize goals (IKEA Effect)
- **Points History**: With positive framing (Sunk Cost Effect)
- **Next Milestone**: "X away from unlocking" messages (Goal Gradient Effect)
- **Themed Collections**: Grouped achievements (Chunking)

### Usage

```tsx
import { ClassProfile } from '@/components/student/ClassProfile';

<ClassProfile
  classId="class-1"
  className="Mathematics 101"
  studentId="student-1"
  studentName="John Doe"
  studentImage="https://avatar.vercel.sh/johndoe"
  achievements={achievements}
  learningGoals={learningGoals}
  pointsHistory={pointsHistory}
  stats={stats}
  onAchievementClick={handleAchievementClick}
  onGoalCreate={handleGoalCreate}
  onGoalEdit={handleGoalEdit}
  onAvatarChange={handleAvatarChange}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| classId | string | The ID of the class |
| className | string | The name of the class |
| studentId | string | The ID of the student |
| studentName | string | The name of the student |
| studentImage | string | URL of the student's avatar image (optional) |
| achievements | Achievement[] | Array of achievement objects |
| learningGoals | LearningGoal[] | Array of learning goal objects |
| pointsHistory | PointsHistory[] | Array of points history objects |
| stats | Stats | Object containing performance statistics |
| onAchievementClick | function | Callback for achievement click |
| onGoalCreate | function | Callback for creating a new learning goal |
| onGoalEdit | function | Callback for editing a learning goal |
| onAvatarChange | function | Callback for changing the avatar |

### UX Psychology Principles Applied

- **IKEA Effect**: Customizable avatar and learning goals
- **Sunk Cost Effect**: Showing accumulated points and achievements
- **Endowed Progress Effect**: Showing partially completed achievements
- **Goal Gradient Effect**: "X away from unlocking" messages
- **Chunking**: Grouping achievements into themed collections
- **Picture Superiority Effect**: Using meaningful icons and colors for achievement categories

### Example

An example implementation can be found at `/examples/class-profile`.

## StudentBottomNav

The `StudentBottomNav` component implements a mobile-optimized bottom navigation bar for the student portal, following UX psychology principles to enhance usability.

### Features

- **Limited Options (Hick's Law)**: Maximum of 5 navigation options to reduce decision paralysis
- **Collapsible Functionality**: Clear visual affordance for expanding/collapsing
- **Subtle Animation**: 50ms duration for expand/collapse to provide immediate feedback
- **Consistent Iconography**: Icons with text labels (dual-coding principle)
- **Haptic Feedback**: 10ms vibration on touch devices for physical feedback
- **Visual Indicators**: Clear indicators for current section (reducing cognitive load)
- **Mobile Optimization**: Minimum 44px touch targets for better accessibility
- **Accessibility**: Proper ARIA attributes and keyboard navigation support
- **State Persistence**: Remembers expanded/collapsed state using localStorage

### Usage

```tsx
import { StudentBottomNav } from '@/components/student/StudentBottomNav';

// In a layout or page component
<StudentBottomNav classId="123" />
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| classId | string | The ID of the current class, used to generate navigation links |

### Implementation Details

1. **UX Psychology Principles Applied**:
   - Hick's Law: Limited to 5 navigation options to reduce decision paralysis
   - Cognitive Load: Visual indicators for current section
   - Dual-Coding Principle: Icons with text labels for better comprehension
   - Sensory Appeal: Haptic feedback on touch devices

2. **Responsive Behavior**:
   - Default to expanded on larger screens, collapsed on mobile
   - Remembers user preference using localStorage
   - Adapts to different screen sizes

3. **Accessibility**:
   - Minimum 44px touch targets
   - Proper ARIA attributes
   - Keyboard navigation support
   - High contrast for better readability

4. **Performance Optimization**:
   - Minimal animations (50ms duration)
   - Efficient state management
   - CSS optimizations for smooth transitions

### Navigation Structure

The component provides navigation to the following pages:

1. **Dashboard**: Overview of class progress and activities
2. **Activities**: List of class activities
3. **Leaderboard**: Class leaderboard showing student rankings
4. **Calendar**: Class calendar with events and deadlines
5. **Profile**: Student profile with achievements and progress

### CSS Classes

The component uses the following CSS classes:

- `student-bottom-nav`: Main container with safe area inset padding
- `student-bottom-nav-toggle`: Toggle button with subtle hover effect
- `student-bottom-nav-item`: Navigation items with ripple effect on touch

### Related Components

- `ViewTransitionLink`: Used for smooth page transitions
- `ThemeWrapper`: Ensures proper theme application

### Testing

You can test the component using the test page at `/student/bottom-nav-test` or by navigating to any class-specific page at `/student/class/[id]/dashboard`.
