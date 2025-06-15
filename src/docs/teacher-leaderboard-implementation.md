# Teacher Leaderboard Implementation

## Overview

The Teacher Leaderboard system is designed to gamify and incentivize teacher engagement and performance within the platform. Similar to the Student Leaderboard, it provides a competitive element that encourages teachers to create high-quality content, provide timely feedback, maintain good attendance, and improve overall class performance.

## Points System

Teachers earn points through various activities and achievements:

### Point Sources

1. **Lesson Plan Creation** (10-50 points)
   - Basic lesson plan: 10 points
   - Detailed lesson plan with resources: 25 points
   - Comprehensive lesson plan with assessments: 50 points

2. **Activity Creation** (5-30 points)
   - Quiz creation: 5 points
   - Assignment creation: 10 points
   - Interactive activity: 15 points
   - Project-based learning activity: 30 points

3. **Feedback Timeliness** (1-20 points)
   - Within 24 hours: 20 points
   - Within 48 hours: 10 points
   - Within 72 hours: 5 points
   - Beyond 72 hours: 1 point

4. **Class Performance** (0-100 points)
   - Points awarded based on average class performance
   - Formula: (Average Class Score / 100) * 100 points

5. **Attendance** (0-10 points per day)
   - Present: 10 points
   - Late: 5 points
   - Excused absence: 2 points
   - Unexcused absence: 0 points

6. **Student Engagement** (0-50 points)
   - Based on student activity completion rates
   - Formula: (Completion Rate %) / 2 points

7. **Coordinator Recognition** (1-100 points)
   - Points awarded by coordinators through the Coordinator Award Points Dialog
   - Categories include lesson plans, activities, feedback, attendance, class performance, and special recognition

## Leaderboard Types

The Teacher Leaderboard system supports multiple views:

1. **Overall Leaderboard**
   - Ranks all teachers based on total points
   - Provides a global view of teacher performance

2. **Course-specific Leaderboard**
   - Ranks teachers within a specific course
   - Useful for subject-specific comparisons

3. **Class-specific Leaderboard**
   - Ranks teachers for a specific class
   - Useful for comparing teachers of the same student group

4. **Program-specific Leaderboard**
   - Ranks teachers within an educational program
   - Useful for program-level analysis

## Timeframes

Leaderboards can be filtered by different timeframes:

1. **Daily** - Points earned in the current day
2. **Weekly** - Points earned in the current week
3. **Monthly** - Points earned in the current month
4. **Term** - Points earned in the current academic term
5. **All-time** - Total points earned since joining

## Teacher Types and Scoring

The system accounts for different teacher roles:

1. **Class Teachers**
   - Primary responsibility for a class
   - Points weighted more heavily for class performance (1.2x multiplier)
   - Attendance tracking is mandatory

2. **Subject Teachers**
   - Teach specific subjects across multiple classes
   - Points weighted more heavily for content creation (1.2x multiplier)
   - Attendance tracked per class session

## Achievements System

Teachers can earn achievements based on their performance:

1. **Content Creator**
   - Bronze: Create 10 activities
   - Silver: Create 25 activities
   - Gold: Create 50 activities

2. **Feedback Champion**
   - Bronze: Provide feedback within 24 hours for 1 week
   - Silver: Provide feedback within 24 hours for 1 month
   - Gold: Provide feedback within 24 hours for 1 term

3. **Perfect Attendance**
   - Bronze: 1 week of perfect attendance
   - Silver: 1 month of perfect attendance
   - Gold: 1 term of perfect attendance

4. **Class Performance**
   - Bronze: Class average of 75%+
   - Silver: Class average of 85%+
   - Gold: Class average of 95%+

5. **Master Educator**
   - Requires Gold level in at least 3 other achievement categories

## Database Schema

The Teacher Leaderboard system uses the following database models:

1. **TeacherPoints**
   - Records individual point transactions
   - Links to source activities (lesson plans, feedback, etc.)
   - Includes timestamps for time-based filtering

2. **TeacherPointsAggregate**
   - Pre-calculated aggregations for efficient leaderboard queries
   - Stores daily, weekly, monthly, term, and total points
   - Updated via background jobs for performance

3. **TeacherAchievement**
   - Tracks progress toward achievements
   - Records unlocked achievements and timestamps
   - Includes achievement metadata (icon, description)

4. **TeacherPerformanceMetrics**
   - Stores calculated performance metrics
   - Includes student performance, attendance rate, feedback time
   - Used for detailed analytics and comparisons

## Implementation Details

### API Endpoints

1. **GET /api/teacher-leaderboard**
   - Returns the teacher leaderboard based on filters
   - Supports pagination, sorting, and filtering

2. **GET /api/teacher-achievements**
   - Returns achievements for a specific teacher
   - Includes progress toward locked achievements

3. **GET /api/teacher-points-history**
   - Returns point history for a specific teacher
   - Supports filtering by source, date range, etc.

4. **POST /api/teacher-points/award**
   - Awards points to a teacher
   - Requires coordinator or admin permissions
   - Supports various point sources and categories

### Background Jobs

1. **Daily Points Aggregation**
   - Runs nightly to calculate daily point totals
   - Updates TeacherPointsAggregate records

2. **Achievement Processor**
   - Checks for newly unlocked achievements
   - Runs after point calculations

3. **Performance Metrics Calculator**
   - Updates teacher performance metrics
   - Runs weekly for efficiency

### Frontend Components

1. **TeacherLeaderboardView**
   - Displays the leaderboard with filtering options
   - Shows teacher rankings, points, and trends
   - Supports filtering by campus, program, course, and class
   - Provides sorting by different metrics (points, activities, performance, etc.)
   - Includes a transparency section explaining how points are calculated
   - Supports real-time data updates with refresh functionality

2. **TeacherAchievementsView**
   - Displays unlocked and locked achievements
   - Shows progress toward locked achievements

3. **TeacherPointsHistoryView**
   - Displays point history with filtering
   - Shows point sources and timestamps
   - Supports filtering by date range, source, and class
   - Connects to real database operations for accurate history

4. **CoordinatorAwardPointsDialog**
   - Allows coordinators to award points to teachers
   - Supports selecting multiple teachers at once
   - Provides preset point categories with customizable values
   - Requires a reason for awarding points for accountability
   - Updates points in real-time after awarding

5. **TeacherRewardsPage**
   - Main page for managing teacher rewards in the coordinator portal
   - Combines leaderboard, points history, and award points functionality
   - Provides filtering by campus, program, course, and teacher
   - Includes responsive design for mobile and desktop views

## Integration with Existing Systems

The Teacher Leaderboard integrates with:

1. **Activity System**
   - Awards points for creating activities
   - Tracks student completion for engagement metrics

2. **Feedback System**
   - Tracks feedback timeliness
   - Awards points based on response time

3. **Attendance System**
   - Records teacher attendance
   - Awards points for attendance consistency

4. **Assessment System**
   - Tracks class performance
   - Awards points based on student achievement

## Coordinator Award Points System

The Coordinator Award Points system allows coordinators to recognize and reward teacher achievements and contributions directly through the Coordinator Portal.

### Award Points Dialog

The Coordinator Award Points Dialog provides the following features:

1. **Multiple Teacher Selection**
   - Coordinators can select one or more teachers to award points to
   - Filtered by campus, program, and course

2. **Point Categories**
   - **Lesson Plan Creation**: Up to 50 points for exceptional lesson plans
   - **Activity Creation**: Up to 30 points for innovative activities
   - **Feedback Timeliness**: Up to 20 points for consistently providing timely feedback
   - **Perfect Attendance**: Up to 20 points for maintaining perfect attendance
   - **Class Performance**: Up to 100 points for exceptional class performance
   - **Special Recognition**: Up to 100 points for outstanding achievements or contributions

3. **Point Customization**
   - Slider control to adjust point values within category limits
   - Default values provided for each category

4. **Reason Documentation**
   - Required field to document the reason for awarding points
   - Ensures accountability and transparency
   - Visible in the teacher's points history

### Teacher Rewards Page

The Teacher Rewards page in the Coordinator Portal provides a comprehensive interface for managing teacher rewards:

1. **Filtering Options**
   - Filter by campus, program, course, and teacher name
   - Search functionality for quick teacher lookup

2. **Tabbed Interface**
   - Leaderboard tab showing teacher rankings
   - Points history tab showing detailed point transactions

3. **Award Points Button**
   - Prominent button to open the Award Points Dialog
   - Available when teachers are selected

## Implementation Status

### Completed

1. **Schema Updates**
   - ✅ Added TeacherPoints model to track individual point transactions
   - ✅ Added TeacherPointsAggregate model for efficient leaderboard queries
   - ✅ Added TeacherAchievement model to track progress toward achievements
   - ✅ Updated TeacherProfile with totalPoints field for quick access to total points

2. **API Endpoints**
   - ✅ Implemented teacher leaderboard endpoint with filtering and sorting
   - ✅ Implemented teacher achievements endpoint
   - ✅ Implemented teacher points history endpoint
   - ✅ Implemented award teacher points endpoint for coordinators

3. **Frontend Components**
   - ✅ Created TeacherLeaderboardView component with sorting and filtering
   - ✅ Created TeacherPointsHistoryView component
   - ✅ Created CoordinatorAwardPointsDialog component
   - ✅ Created TeacherRewardsPage component

4. **Integration**
   - ✅ Added leaderboard to coordinator portal
   - ✅ Implemented filtering by campus, program, course, and class
   - ✅ Implemented sorting by different metrics
   - ✅ Added award points functionality for coordinators

### Recently Completed

1. **Real Data Implementation**
   - ✅ Connected the teacher points service to the database
   - ✅ Implemented real-time leaderboard updates with refresh functionality
   - ✅ Added transparency section to explain point calculation
   - ✅ Fixed TypeScript errors for better code quality

### In Progress

1. **Historical Data Tracking**
   - 🔄 Implementing historical rank tracking for trend analysis
   - 🔄 Adding rank change indicators with accurate data

2. **Achievement System**
   - 🔄 Implementing automatic achievement unlocking
   - 🔄 Creating achievement badges and notifications

## Future Enhancements

1. **Customizable Point Values**
   - Allow administrators to adjust point values
   - Support institution-specific priorities

2. **Team Competitions**
   - Group teachers by department or subject
   - Create team-based leaderboards

3. **Reward Integration**
   - Connect achievements to real-world rewards
   - Support badge display on teacher profiles

4. **Advanced Analytics**
   - Provide insights on teacher performance trends
   - Identify areas for professional development
