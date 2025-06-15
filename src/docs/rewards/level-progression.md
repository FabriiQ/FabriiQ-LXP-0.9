# Level Progression Thresholds

This document outlines the level progression system used in the student portal reward system, including thresholds, visual indicators, and benefits.

## Overview

The level progression system provides students with a sense of advancement and achievement as they earn points through activities, logins, and achievements. Each level requires more points than the previous one, creating an increasing challenge that keeps students engaged over time.

## Level Thresholds

The following table shows the points required to reach each level:

| Level | Points Required | Points to Next Level |
|-------|----------------|---------------------|
| Level 1 | 0-100 points | 101 points |
| Level 2 | 101-250 points | 150 points |
| Level 3 | 251-500 points | 250 points |
| Level 4 | 501-1000 points | 500 points |
| Level 5 | 1001-2000 points | 1000 points |
| Level 6 | 2001-3500 points | 1500 points |
| Level 7 | 3501-5500 points | 2000 points |
| Level 8 | 5501-8000 points | 2500 points |
| Level 9 | 8001-11000 points | 3000 points |
| Level 10 | 11001-15000 points | 4000 points |
| Level 11 | 15001-20000 points | 5000 points |
| Level 12 | 20001-26000 points | 6000 points |
| Level 13 | 26001-33000 points | 7000 points |
| Level 14 | 33001-41000 points | 8000 points |
| Level 15 | 41001+ points | Mastery level |

## Level Calculation Formula

The current level is calculated based on the total points earned:

```
function calculateLevel(totalPoints) {
  if (totalPoints < 101) return 1;
  if (totalPoints < 251) return 2;
  if (totalPoints < 501) return 3;
  if (totalPoints < 1001) return 4;
  if (totalPoints < 2001) return 5;
  if (totalPoints < 3501) return 6;
  if (totalPoints < 5501) return 7;
  if (totalPoints < 8001) return 8;
  if (totalPoints < 11001) return 9;
  if (totalPoints < 15001) return 10;
  if (totalPoints < 20001) return 11;
  if (totalPoints < 26001) return 12;
  if (totalPoints < 33001) return 13;
  if (totalPoints < 41001) return 14;
  return 15;
}
```

## Progress to Next Level

The progress toward the next level is calculated as:

```
function calculateLevelProgress(totalPoints) {
  const currentLevel = calculateLevel(totalPoints);
  const currentLevelMinPoints = getLevelMinPoints(currentLevel);
  const nextLevelMinPoints = getLevelMinPoints(currentLevel + 1);
  
  // For the highest level, show 100% progress
  if (currentLevel === 15) return 100;
  
  const pointsInCurrentLevel = totalPoints - currentLevelMinPoints;
  const pointsRequiredForNextLevel = nextLevelMinPoints - currentLevelMinPoints;
  
  return Math.min(100, Math.round((pointsInCurrentLevel / pointsRequiredForNextLevel) * 100));
}
```

## Visual Indicators

Each level has associated visual indicators:

### Level Colors

| Level Range | Color Scheme | CSS Classes |
|-------------|--------------|------------|
| Levels 1-3 | Bronze/Copper | `bg-amber-100 text-amber-800` |
| Levels 4-6 | Silver/Gray | `bg-gray-200 text-gray-800` |
| Levels 7-9 | Gold/Yellow | `bg-yellow-100 text-yellow-800` |
| Levels 10-12 | Emerald/Green | `bg-emerald-100 text-emerald-800` |
| Levels 13-15 | Sapphire/Blue | `bg-blue-100 text-blue-800` |

### Level Badges

Each level range has a distinct badge design that appears next to the student's name on leaderboards and profiles:

- **Levels 1-3**: Simple circle with level number
- **Levels 4-6**: Shield with level number
- **Levels 7-9**: Star with level number
- **Levels 10-12**: Diamond with level number
- **Levels 13-15**: Crown with level number

## Level-Up Celebrations

When a student advances to a new level, the following celebrations occur:

1. **Visual Animation**: A celebratory animation appears on screen
2. **Notification**: A toast notification congratulates the student
3. **Sound Effect**: A subtle sound effect plays (if enabled)
4. **Achievement**: A level-specific achievement is unlocked
5. **Bonus Points**: A small bonus is awarded for reaching certain level milestones

## Level Benefits

Higher levels provide students with certain benefits:

1. **Recognition**: Higher visibility on leaderboards with distinct badges
2. **Achievement Progress**: Automatic progress toward level-based achievements
3. **Profile Enhancement**: Enhanced profile customization options
4. **Point Multipliers**: Small point multipliers for certain activities (e.g., Level 10+ earns 1.05× points)

## Implementation Details

The level system is implemented in the following files:
- `src/features/rewards/levels/index.ts` - Core level progression logic
- `src/server/api/services/level.service.ts` - Server-side level service
- `src/components/rewards/LevelProgress.tsx` - UI component for displaying level progress

For technical details on the API endpoints, see the [API Endpoints documentation](./api-endpoints.md).
