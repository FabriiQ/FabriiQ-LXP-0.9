# Sound Effects

This directory contains sound effects used in the student portal.

## Usage

Sound effects are played using the `playSound` utility function:

```tsx
import { playSound } from '@/lib/utils/confetti';

// Play a sound effect
playSound('/sounds/achievement-milestone.mp3', 0.5);
```

## Sound Files

The following sound files should be placed in this directory:

- `achievement-class.mp3`: Played when a class achievement is earned
- `achievement-subject.mp3`: Played when a subject achievement is earned
- `achievement-login.mp3`: Played when a login achievement is earned
- `achievement-streak.mp3`: Played when a streak achievement is earned
- `achievement-milestone.mp3`: Played when a milestone achievement is earned
- `achievement-special.mp3`: Played when a special achievement is earned
- `achievement-grade.mp3`: Played when a grade achievement is earned
- `achievement-activity.mp3`: Played when an activity achievement is earned
- `points-detail.mp3`: Played when the points detail popup is opened
- `drop.mp3`: Played when an item is dropped in drag-and-drop activities

## Guidelines

- All sound effects should be short (less than 2 seconds)
- Sound effects should be subtle and not jarring
- Volume levels should be normalized
- File sizes should be kept small (< 50KB)
- Formats should be widely supported (MP3 is recommended)

## Accessibility

Sound effects are optional and respect user preferences. Users can disable sounds in their settings, and the system will respect this preference.

## Adding New Sounds

When adding new sound effects:

1. Keep the file size small
2. Normalize the volume
3. Test on multiple devices
4. Add the file to this directory
5. Update this README with the new file
6. Use the `playSound` utility function to play the sound
