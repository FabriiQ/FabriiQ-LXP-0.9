# Plan for Updating Activity Components with ThemeWrapper

## Components to Update

### Editors:
1. ✅ MultipleChoiceEditor
2. ✅ TrueFalseEditor
3. ✅ MultipleResponseEditor
4. ✅ FillInTheBlanksEditor
5. ✅ MatchingEditor
6. ✅ SequenceEditor
7. ✅ DragAndDropEditor
8. ✅ DragTheWordsEditor
9. ✅ FlashCardsEditor
10. ✅ NumericEditor
11. ✅ QuizEditor
12. ✅ ReadingEditor
13. ✅ VideoEditor

### Viewers:
1. ✅ MultipleChoiceViewer
2. ✅ TrueFalseViewer
3. ✅ MultipleResponseViewer
4. ✅ FillInTheBlanksViewer
5. ✅ MatchingViewer
6. ✅ SequenceViewer
7. ✅ DragAndDropViewer
8. ✅ DragTheWordsViewer
9. ✅ FlashCardsViewer
10. ✅ NumericViewer
11. ✅ QuizViewer
12. ✅ ReadingViewer
13. ✅ VideoViewer

## Steps for Each Component

1. Add the ThemeWrapper import:
```tsx
import { ThemeWrapper } from '../ui/ThemeWrapper';
```

2. Wrap the main component with ThemeWrapper:
```tsx
return (
  <ThemeWrapper className={cn("w-full", className)}>
    {/* Component content */}
  </ThemeWrapper>
);
```

3. Remove any data-theme attributes and useTheme hooks if they're being replaced by ThemeWrapper

4. Ensure all nested components that need theme awareness are also properly wrapped

## Example Implementation

### Before:
```tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';

export const ExampleComponent = ({ className }) => {
  const { theme } = useTheme();

  return (
    <div className={cn("w-full", className)} data-theme={theme}>
      <div className="content" data-theme={theme}>
        Content goes here
      </div>
    </div>
  );
};
```

### After:
```tsx
import React from 'react';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';

export const ExampleComponent = ({ className }) => {
  return (
    <ThemeWrapper className={cn("w-full", className)}>
      <div className="content">
        Content goes here
      </div>
    </ThemeWrapper>
  );
};
```

## Testing

After updating each component, test it in both light and dark modes to ensure it properly respects theme changes.
