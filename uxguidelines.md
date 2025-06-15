# UI/UX Design Guidelines

## Brand Guidelines

### Color Scheme

#### Primary Colors
- **Primary Green:** #1F504B
- **Medium Teal:** #5A8A84
- **Light Mint:** #D8E3E0

#### Secondary Colors
- **Accent Orange:** #F59E0B
- **Accent Blue:** #3B82F6
- **Accent Red:** #EF4444

#### Neutral Colors
- **Dark Gray:** #1F2937
- **Medium Gray:** #6B7280
- **Light Gray:** #E5E7EB
- **Off White:** #F9FAFB

### Typography

#### Font Family
- **Primary Font:** Inter
- **Headings:** Inter (Semi-Bold, Bold)
- **Body Text:** Inter (Regular, Medium)
- **UI Elements:** Inter (Medium)

#### Font Sizes
- **Heading 1:** 2rem (32px)
- **Heading 2:** 1.5rem (24px)
- **Heading 3:** 1.25rem (20px)
- **Body Large:** 1rem (16px)
- **Body Default:** 0.875rem (14px)
- **Body Small:** 0.75rem (12px)
- **Caption:** 0.625rem (10px)

### Spacing

#### Spacing Scale
- **4xs:** 0.125rem (2px)
- **3xs:** 0.25rem (4px)
- **2xs:** 0.5rem (8px)
- **xs:** 0.75rem (12px)
- **sm:** 1rem (16px)
- **md:** 1.5rem (24px)
- **lg:** 2rem (32px)
- **xl:** 3rem (48px)
- **2xl:** 4rem (64px)

#### Container Widths
- **Mobile:** 100% (with 16px padding)
- **Tablet:** 768px
- **Desktop:** 1024px
- **Large Desktop:** 1280px

## Design Principles

### Mobile-First Approach
- Design for mobile screens first, then progressively enhance for larger screens
- Ensure touch targets are at least 44px × 44px
- Use bottom navigation for primary actions on mobile
- Implement responsive layouts that adapt to different screen sizes

### Visual Hierarchy
- Use size, color, and spacing to establish hierarchy
- Emphasize important elements through contrast
- Group related elements together
- Maintain consistent alignment throughout the interface

### Accessibility
- Maintain a minimum contrast ratio of 4.5:1 for text
- Provide alternative text for images
- Ensure keyboard navigability
- Support screen readers with proper ARIA attributes
- Design for different types of color blindness

### Consistency
- Use consistent patterns for similar actions
- Maintain consistent spacing and alignment
- Apply the same visual treatment to similar elements
- Use established UI patterns when possible

## Component Guidelines

### Buttons
- **Primary Button:** Filled background (#1F504B), white text
- **Secondary Button:** Outlined (#5A8A84), teal text
- **Tertiary Button:** No background, teal text
- **Destructive Button:** Red background (#EF4444), white text
- **Button Sizes:** Small (32px), Medium (40px), Large (48px)
- **Button Radius:** 6px

### Forms
- **Input Height:** 40px (desktop), 48px (mobile)
- **Input Padding:** 12px horizontal, 8px vertical
- **Input Border:** 1px solid #E5E7EB
- **Input Radius:** 6px
- **Focus State:** 2px border #5A8A84, subtle shadow
- **Error State:** 1px border #EF4444, error message below
- **Success State:** 1px border #10B981, success message below

### Cards
- **Card Padding:** 16px (mobile), 24px (desktop)
- **Card Border:** 1px solid #E5E7EB
- **Card Radius:** 8px
- **Card Shadow:** 0 2px 4px rgba(0, 0, 0, 0.05)
- **Card Header:** Bottom border 1px solid #E5E7EB
- **Card Footer:** Top border 1px solid #E5E7EB

### Navigation
- **Top Navigation:** Fixed position, white background, shadow
- **Bottom Navigation:** Fixed position, white background, shadow on top
- **Sidebar:** Fixed position, white background, subtle shadow
- **Active State:** Primary color indicator
- **Hover State:** Light background change

### Feedback & Notifications
- **Success:** Green (#10B981)
- **Warning:** Yellow (#F59E0B)
- **Error:** Red (#EF4444)
- **Info:** Blue (#3B82F6)
- **Toast Duration:** 3 seconds by default
- **Toast Position:** Bottom center (mobile), top right (desktop)

## Micro-Interactions

### Transitions
- **Duration:** 150ms - 300ms
- **Easing:** Ease-in-out for most transitions
- **Hover Effects:** Subtle scale or color change
- **Page Transitions:** Fade or slide transitions between pages depending on  page and user context

### Feedback
- **Button Press:** Slight scale down (0.98)
- **Form Submission:** Loading indicator, success/error feedback
- **Loading States:** Skeleton screens for content loading
- **Empty States:** Helpful illustrations and guidance

## Responsive Breakpoints

- **Mobile:** < 640px
- **Tablet:** 640px - 1023px
- **Desktop:** 1024px - 1279px
- **Large Desktop:** ≥ 1280px

## Dark Mode

- **Background:** #121212 (primary), #1E1E1E (secondary)
- **Text:** #FFFFFF (primary), #A0A0A0 (secondary)
- **Primary Green:** Lightened to #2A6B64
- **Medium Teal:** Lightened to #6BA5A0
- **Light Mint:** Darkened to #1A2A28
- **Card Background:** #1E1E1E
- **Borders:** #333333

## Implementation Notes

- Use Tailwind CSS for consistent implementation
- Leverage CSS variables for theming
- Implement responsive utilities for different screen sizes
- Use component library for consistent UI elements
- Ensure proper dark mode support
