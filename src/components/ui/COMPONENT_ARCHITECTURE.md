# UI Component Architecture

This document outlines the unified UI component architecture for the application. The components are organized into a layered architecture to promote reusability, maintainability, and consistency.

## Directory Structure

```
src/components/ui/
├── core/              # Base components from shadcn/ui
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── extended/          # Extended components with additional features
│   ├── button.tsx     # Extended button with loading state, etc.
│   ├── input.tsx      # Extended input with icons, error states, etc.
│   ├── card.tsx       # Extended card with variants, etc.
│   └── ...
├── composite/         # Composite components built from core components
│   ├── form-field.tsx
│   ├── data-card.tsx
│   └── ...
├── specialized/       # Domain-specific components
│   ├── analytics/
│   ├── dashboard/
│   └── ...
└── index.ts           # Main export file
```

## Component Layers

### Core Components

Core components are direct implementations of shadcn/ui components with minimal modifications. They provide the foundation for the component library and follow these principles:

- Have minimal, focused APIs
- Follow shadcn/ui patterns and styling
- Are fully accessible
- Support theming through CSS variables
- Are optimized for mobile-first design

### Extended Components

Extended components build on core components to provide additional functionality. They follow these principles:

- Wrap core components
- Add commonly needed features (loading states, icons, etc.)
- Maintain the same styling and behavior as core components
- Are backward compatible with existing usage patterns
- Support role-based theming

### Composite Components

Composite components combine multiple core or extended components to create more complex UI elements. They follow these principles:

- Follow consistent patterns
- Are composable and flexible
- Handle common use cases efficiently
- Reduce boilerplate code
- Are responsive and mobile-friendly

### Specialized Components

Specialized components are domain-specific and built on top of core, extended, and composite components. They are organized by domain (analytics, dashboard, etc.) and follow these principles:

- Address specific domain needs
- Maintain consistency with the overall design system
- Are responsive and mobile-friendly
- Support role-based theming

## Mobile-First Design

All components follow a mobile-first design approach:

- Start with mobile layouts and progressively enhance for larger screens
- Ensure touch targets are at least 44x44px for better usability on touch devices
- Use appropriate font sizes (minimum 16px for form inputs to prevent zoom on iOS)
- Optimize performance for mobile devices
- Test on actual mobile devices, not just browser emulation

## Role-Based Theming

Components support role-based theming through CSS variables:

- System Admin
- Campus Admin
- Teacher
- Student
- Parent

Each role has its own color palette and styling, which is applied through the `useRoleTheme` hook.

## Usage

Import components from the main export file:

```tsx
import { Button, Input, Card } from '@/components/ui';
```

For extended components with additional features:

```tsx
import { ExtendedButton, ExtendedInput } from '@/components/ui';
```

For role-based theming:

```tsx
import { useRoleTheme } from '@/components/ui';

function MyComponent() {
  const { role, setRole } = useRoleTheme('teacher');
  
  return (
    <div>
      <Button>Click me</Button>
      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value="systemAdmin">System Admin</option>
        <option value="campusAdmin">Campus Admin</option>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
        <option value="parent">Parent</option>
      </select>
    </div>
  );
}
```

## Accessibility

All components follow WCAG 2.1 AA standards:

- Proper color contrast ratios
- Keyboard navigation support
- Screen reader compatibility
- Appropriate ARIA attributes
- Focus management

## Performance

Components are optimized for performance:

- Minimize bundle size through code splitting and lazy loading
- Reduce unnecessary re-renders using React.memo and useMemo where appropriate
- Optimize animations for smooth performance on mobile devices
- Implement virtualization for long lists
- Use image optimization techniques

## Migration Strategy

To migrate from the old component structure to the new one:

1. Update imports to use the new component paths:
   - Replace `import { Button } from '@/components/ui/button'` with `import { Button } from '@/components/ui/core/button'`
   - Replace `import { Button } from '@/components/ui/atoms/button'` with `import { ExtendedButton as Button } from '@/components/ui/extended/button'`

2. Use the new components in new code:
   - Use core components for simple cases
   - Use extended components when additional features are needed
   - Use composite components to reduce boilerplate

3. Gradually migrate existing code:
   - The old components are still available for backward compatibility
   - New components are designed to be drop-in replacements in most cases
   - Follow deprecation warnings as they appear
