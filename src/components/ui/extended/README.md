# Extended UI Components

This directory contains extended versions of the core UI components with additional features and role-based theming.

## Overview

Extended components build on core components to provide additional functionality. They follow these principles:

- Wrap core components
- Add commonly needed features (loading states, icons, etc.)
- Maintain the same styling and behavior as core components
- Are backward compatible with existing usage patterns
- Support role-based theming

## Components

### ExtendedButton

The `ExtendedButton` component extends the core `Button` component with additional features:

- Loading state with spinner
- Left and right icons
- Tooltip support
- Role-specific styling

```tsx
import { ExtendedButton } from '@/components/ui';

// Basic usage
<ExtendedButton>Click me</ExtendedButton>

// With loading state
<ExtendedButton isLoading>Loading</ExtendedButton>

// With icons
<ExtendedButton leftIcon={<Icon />}>With Icon</ExtendedButton>
<ExtendedButton rightIcon={<Icon />}>With Icon</ExtendedButton>

// With role-specific styling
<ExtendedButton role="teacher">Teacher Button</ExtendedButton>
```

### ExtendedInput

The `ExtendedInput` component extends the core `Input` component with additional features:

- Left and right icons
- Error and success states
- Helper text
- Role-specific styling

```tsx
import { ExtendedInput } from '@/components/ui';

// Basic usage
<ExtendedInput placeholder="Enter your name" />

// With icons
<ExtendedInput leftIcon={<UserIcon />} placeholder="Username" />
<ExtendedInput rightIcon={<SearchIcon />} placeholder="Search" />

// With error state
<ExtendedInput error="This field is required" helperText="Enter your email address" />

// With success state
<ExtendedInput success helperText="Email is valid" />

// With role-specific styling
<ExtendedInput role="teacher" placeholder="Teacher input" />
```

### ExtendedCard

The `ExtendedCard` component extends the core `Card` component with additional features:

- Additional variants (outline, filled, elevated, interactive)
- Role-specific styling
- Size variants
- Actions in header

```tsx
import { ExtendedCard, ExtendedCardHeader, ExtendedCardTitle, ExtendedCardDescription, ExtendedCardContent, ExtendedCardFooter } from '@/components/ui';

// Basic usage
<ExtendedCard>
  <ExtendedCardHeader>
    <ExtendedCardTitle>Card Title</ExtendedCardTitle>
    <ExtendedCardDescription>Card Description</ExtendedCardDescription>
  </ExtendedCardHeader>
  <ExtendedCardContent>
    Card Content
  </ExtendedCardContent>
  <ExtendedCardFooter>
    Card Footer
  </ExtendedCardFooter>
</ExtendedCard>

// With variants
<ExtendedCard variant="elevated">Elevated Card</ExtendedCard>
<ExtendedCard variant="interactive">Interactive Card</ExtendedCard>

// With role-specific styling
<ExtendedCard role="teacher">Teacher Card</ExtendedCard>

// With actions in header
<ExtendedCardHeader actions={<Button>Action</Button>}>
  <ExtendedCardTitle>Card with Actions</ExtendedCardTitle>
</ExtendedCardHeader>
```

### SimpleCard

The `SimpleCard` component provides a simplified API for creating cards:

```tsx
import { SimpleCard } from '@/components/ui';

// Basic usage
<SimpleCard 
  title="Card Title" 
  description="Card description" 
  icon={<Icon />}
  actions={<Button>Action</Button>}
  footer={<div>Footer content</div>}
>
  Card content
</SimpleCard>

// With role-specific styling
<SimpleCard 
  title="Teacher Card" 
  role="teacher"
>
  Card content
</SimpleCard>
```

### ExtendedSelect

The `ExtendedSelect` component extends the core `Select` component with additional features:

- Simplified API with options and groups
- Error and success states
- Helper text and label
- Role-specific styling

```tsx
import { ExtendedSelect } from '@/components/ui';

// Basic usage with options
<ExtendedSelect 
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" }
  ]} 
  placeholder="Select an option" 
/>

// With groups
<ExtendedSelect 
  groups={[
    { 
      label: "Group 1", 
      options: [
        { value: "option1", label: "Option 1" },
        { value: "option2", label: "Option 2" }
      ]
    }
  ]} 
  placeholder="Select an option"
/>

// With error state
<ExtendedSelect 
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" }
  ]} 
  error="Please select an option"
  placeholder="Select an option"
/>

// With label and helper text
<ExtendedSelect 
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" }
  ]} 
  label="Select an option"
  helperText="Choose from the list"
  placeholder="Select an option"
/>

// With role-specific styling
<ExtendedSelect 
  options={[
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" }
  ]} 
  role="teacher"
  placeholder="Select an option"
/>
```

## Role-Based Theming

All extended components support role-based theming through the `role` prop:

- `systemAdmin` - Green theme
- `campusAdmin` - Blue theme
- `teacher` - Teal theme
- `student` - Light blue theme
- `parent` - Purple theme

```tsx
import { ExtendedButton, ExtendedInput, ExtendedCard, ExtendedSelect } from '@/components/ui';

// System Admin theme
<ExtendedButton role="systemAdmin">System Admin Button</ExtendedButton>
<ExtendedInput role="systemAdmin" placeholder="System Admin Input" />
<ExtendedCard role="systemAdmin">System Admin Card</ExtendedCard>
<ExtendedSelect role="systemAdmin" placeholder="System Admin Select" />

// Campus Admin theme
<ExtendedButton role="campusAdmin">Campus Admin Button</ExtendedButton>
<ExtendedInput role="campusAdmin" placeholder="Campus Admin Input" />
<ExtendedCard role="campusAdmin">Campus Admin Card</ExtendedCard>
<ExtendedSelect role="campusAdmin" placeholder="Campus Admin Select" />

// Teacher theme
<ExtendedButton role="teacher">Teacher Button</ExtendedButton>
<ExtendedInput role="teacher" placeholder="Teacher Input" />
<ExtendedCard role="teacher">Teacher Card</ExtendedCard>
<ExtendedSelect role="teacher" placeholder="Teacher Select" />

// Student theme
<ExtendedButton role="student">Student Button</ExtendedButton>
<ExtendedInput role="student" placeholder="Student Input" />
<ExtendedCard role="student">Student Card</ExtendedCard>
<ExtendedSelect role="student" placeholder="Student Select" />

// Parent theme
<ExtendedButton role="parent">Parent Button</ExtendedButton>
<ExtendedInput role="parent" placeholder="Parent Input" />
<ExtendedCard role="parent">Parent Card</ExtendedCard>
<ExtendedSelect role="parent" placeholder="Parent Select" />
```

## Mobile-First Design

All extended components follow a mobile-first design approach:

- Minimum touch target size of 44x44px for better usability on touch devices
- Appropriate font sizes (16px for inputs to prevent zoom on iOS)
- Responsive padding and spacing
- Touch-friendly interactions

## Backward Compatibility

All extended components maintain backward compatibility with existing components:

- Same prop names and default values
- Same styling and behavior
- Same event handling

You can use the extended components as drop-in replacements for existing components in most cases.
