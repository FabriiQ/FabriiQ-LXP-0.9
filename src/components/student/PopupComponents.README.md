# Popup Components

This directory contains popup components for the student portal, designed with UX psychology principles to enhance user engagement and satisfaction.

## AchievementPopup

The `AchievementPopup` component displays a notification when a user earns an achievement, with features that leverage the Peak-End Rule and Sensory Appeal principles.

### Features

- **Positive Framing**: Uses encouraging language that emphasizes growth mindset
- **Entrance/Exit Animations**: Smooth animations that draw attention without jarring users
- **Confetti Celebration**: Visual celebration effect for achievements (Peak-End Rule)
- **Haptic Feedback**: Vibration patterns for mobile users (Sensory Appeal)
- **Sound Effects**: Optional audio feedback that respects user preferences
- **Storytelling Elements**: Achievement descriptions that create narrative context
- **Social Validation**: Option to share achievements with others
- **Accessibility**: Keyboard navigation, ARIA attributes, and focus management
- **User Control**: "Snooze" option for notifications
- **Exit Points**: Clear options to continue after viewing the achievement

### Usage

```tsx
import { AchievementPopup } from '@/components/student/AchievementPopup';

// In a component
const [showAchievement, setShowAchievement] = useState(false);

// When achievement is earned
setShowAchievement(true);

// In JSX
<AchievementPopup
  title="Math Master"
  description="You've mastered 5 math concepts in a row!"
  type="class" // Options: class, subject, login, streak, milestone, special, grade, activity
  isVisible={showAchievement}
  onClose={() => setShowAchievement(false)}
  onShare={handleShare}
  onSnooze={handleSnooze}
  showConfetti={true}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | The title of the achievement |
| `description` | string (optional) | Description of the achievement |
| `type` | string (optional) | Type of achievement (determines icon and color) |
| `isVisible` | boolean | Whether the popup is visible |
| `onClose` | () => void | Function to call when popup is closed |
| `onShare` | () => void (optional) | Function to call when share button is clicked |
| `onSnooze` | () => void (optional) | Function to call when snooze button is clicked |
| `autoCloseDelay` | number (optional) | Delay in ms before auto-closing (default: 8000) |
| `showConfetti` | boolean (optional) | Whether to show confetti effect (default: true) |
| `className` | string (optional) | Additional CSS classes |

## PointsDetailPopup

The `PointsDetailPopup` component displays detailed information about a student's points and progress, with features that leverage Progressive Disclosure and Variable Reward principles.

### Features

- **Progress Visualization**: Clear visual representation of level progress
- **Variable Rewards**: Different rewards based on streak length (Variable Reward)
- **Entrance/Exit Animations**: Smooth transitions that don't disrupt the user experience
- **Haptic Feedback**: Subtle vibration for mobile users (Sensory Appeal)
- **Sound Effects**: Optional audio feedback that respects user preferences
- **Accessibility**: Keyboard navigation, ARIA attributes, and focus management
- **Information Hierarchy**: Organized by importance (Progressive Disclosure)
- **Celebration Effects**: Confetti for notable streaks (5+ days)

### Usage

```tsx
import { PointsDetailPopup } from '@/components/student/PointsDetailPopup';

// In a component
const [showPointsDetail, setShowPointsDetail] = useState(false);

// When points button is clicked
setShowPointsDetail(true);

// In JSX
<PointsDetailPopup
  isVisible={showPointsDetail}
  onClose={() => setShowPointsDetail(false)}
  points={{
    current: 1250,
    total: 1250,
    recentlyEarned: 75,
    breakdown: [
      { source: 'Completed Math Quiz', amount: 25, date: 'Today' },
      { source: 'Login Streak Bonus', amount: 15, date: 'Today' },
    ]
  }}
  level={{
    current: 5,
    progress: 65,
    pointsToNextLevel: 350
  }}
  streak={{
    days: 5,
    maxDays: 14
  }}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `isVisible` | boolean | Whether the popup is visible |
| `onClose` | () => void | Function to call when popup is closed |
| `points` | object | Points data including current, total, recently earned, and breakdown |
| `level` | object | Level data including current level, progress percentage, and points to next level |
| `streak` | object (optional) | Streak data including days and max days |
| `autoCloseDelay` | number (optional) | Delay in ms before auto-closing (default: 0, no auto-close) |
| `className` | string (optional) | Additional CSS classes |

## Utility Functions

Both components use shared utility functions for confetti, sound, and haptic feedback:

### generateConfetti

Creates a confetti animation within a container element.

```tsx
import { generateConfetti } from '@/lib/utils/confetti';

// In a component with a ref
const confettiRef = useRef<HTMLDivElement>(null);

// When achievement is earned
if (confettiRef.current) {
  generateConfetti(confettiRef.current, {
    count: 100,
    reducedMotion: false
  });
}
```

### playSound

Plays a sound effect with error handling and respects user preferences.

```tsx
import { playSound } from '@/lib/utils/confetti';

// When achievement is earned
playSound('/sounds/achievement.mp3', 0.5);
```

### triggerHapticFeedback

Triggers haptic feedback on devices that support it.

```tsx
import { triggerHapticFeedback } from '@/lib/utils/confetti';

// When achievement is earned
triggerHapticFeedback([100, 50, 200]);
```

## Testing

You can test both components using the test page at `/student/popup-test`.

## UX Psychology Principles Applied

1. **Peak-End Rule**: Creating memorable moments with celebrations and positive feedback
2. **Sensory Appeal**: Engaging multiple senses with visuals, sound, and touch
3. **Progressive Disclosure**: Organizing information by importance
4. **Variable Reward**: Providing different rewards based on streak length
5. **Growth Mindset**: Using language that emphasizes effort and improvement
6. **Storytelling Effect**: Creating narrative context for achievements
7. **Social Validation**: Allowing users to share achievements with others
