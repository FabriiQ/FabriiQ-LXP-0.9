# Student Portal Documentation

## Overview

The Student Portal is a comprehensive learning environment designed to enhance student engagement, motivation, and achievement through a variety of interactive features and psychological principles. This documentation provides an overview of the key components and features of the Student Portal.

## Key Components

1. [Class Profile](./commitment-tracking-system.md)
2. Activities Dashboard
3. Leaderboard
4. Points System
5. Learning Journey
6. [Learning Time Tracking](./learning-time-tracking.md)

## UX Psychology Principles

The Student Portal implements various UX psychology principles to enhance engagement and learning:

### Motivation & Engagement
- **Goal Gradient Effect**: Increasing motivation as users approach goals
- **Endowment Effect**: Making users feel ownership of their learning
- **IKEA Effect**: Increasing value through user participation in creation
- **Labor Illusion**: Showing the work being done to increase perceived value
- **Loss Aversion**: Framing to avoid losing progress rather than gaining rewards
- **Sunk Cost Effect**: Leveraging previous investment to encourage continuation
- **Investment Loops**: Creating cycles of investment that increase engagement
- **Variable Reward**: Providing unexpected positive reinforcement
- **Temptation Bundling**: Pairing challenging tasks with enjoyable experiences

### Information Processing
- **Progressive Disclosure**: Revealing information gradually to avoid overwhelm
- **Chunking**: Grouping information into manageable units (3-5 items)
- **Recognition Over Recall**: Providing visual cues rather than requiring memory
- **Cognitive Load Theory**: Minimizing extraneous cognitive load
- **Hick's Law**: Reducing choices to speed decision-making
- **Serial Position Effect**: Placing important items at beginning and end of lists

## Feature Documentation

### Class Profile

The Class Profile provides a comprehensive view of a student's progress and achievements within a specific class. It includes:

- **Achievements Tab**: Displays earned and available achievements
- **Learning Goals Tab**: Allows students to set and track personal learning goals
- **Points Tab**: Shows points history and trends visualization
- **Journey Tab**: Displays a chronological timeline of learning milestones
- **Personal Bests Tab**: Highlights the student's top achievements
- **[Commitment Contracts Tab](./commitment-tracking-system.md)**: Enables students to make and track learning commitments

For detailed information about the Commitment Tracking System, see the [dedicated documentation](./commitment-tracking-system.md).

### Activities Dashboard

The Activities Dashboard provides access to all learning activities assigned to the student. Features include:

- Activity filtering and sorting
- Status indicators (pending, completed, graded)
- Progress tracking
- Offline access capabilities
- Activity type indicators

### Leaderboard

The Leaderboard feature promotes healthy competition and social motivation through:

- Class, grade, and campus leaderboards
- Multiple timeframe options (daily, weekly, monthly, term)
- Personal position tracking
- Position change indicators

### Points System

The Points System rewards student engagement and achievement through:

- Points for activity completion
- Bonus points for achievements
- Streak rewards for consistent engagement
- Level progression based on accumulated points
- Visual representations of points trends

### Learning Journey

The Learning Journey provides a narrative timeline of a student's educational progress:

- Chronological display of significant events
- Multiple event types (achievements, level-ups, activities, enrollments)
- Visual storytelling elements
- Integration with commitments and achievements

### Learning Time Tracking

The [Learning Time Tracking](./learning-time-tracking.md) system monitors and visualizes student time investment:

- Automatic tracking of time spent on activities
- Aggregation of time data by subject and activity type
- Visual representation of learning time investment
- Insights into learning patterns and efficiency
- Real-time tracking display during activities

## Technical Implementation

The Student Portal is built using:

- Next.js 15.2.2 for the frontend framework
- tRPC for type-safe API calls
- Prisma for database access
- ShadowDB for offline capabilities
- Tailwind CSS for styling
- Framer Motion for animations

## Data Models

Key data models in the Student Portal include:

- StudentProfile
- Class
- Activity
- ActivityAttempt
- StudentPoints
- Achievement
- LearningGoal
- JourneyEvent
- PersonalBest
- CommitmentContract

For detailed information about specific data models, refer to the relevant feature documentation.

## Contributing

When contributing to the Student Portal, please follow these guidelines:

1. **Code Reusability**: Always check existing components before creating new ones
2. **Clean, Commented Code**: Write clear, self-documenting code with meaningful names
3. **UI/UX Consistency**: Follow existing patterns and the design system
4. **Dependency Management**: Avoid introducing new packages when existing solutions are available
5. **File Organization**: Follow the established project structure

## Related Documentation

- [Design System](../design-system.md)
- [Login Flow](../login-flow.md)
- [Commitment Tracking System](./commitment-tracking-system.md)
- [Learning Time Tracking](./learning-time-tracking.md)
