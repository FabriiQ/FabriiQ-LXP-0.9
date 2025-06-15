# AIVY LXP Design System

This document outlines the design system implementation for the AIVY Learning Experience Platform, based on the UI/UX plan.

## Color Palette

### Brand Colors

| Color | Hex Code | CSS Variable | Tailwind Class |
|-------|----------|--------------|---------------|
| Primary Green | #1F504B | `--primary-green` | `text-primary-green`, `bg-primary-green` |
| Medium Teal | #5A8A84 | `--medium-teal` | `text-medium-teal`, `bg-medium-teal` |
| Light Mint | #D8E3E0 | `--light-mint` | `text-light-mint`, `bg-light-mint` |

### Neutral Colors

| Color | Hex Code | CSS Variable | Tailwind Class |
|-------|----------|--------------|---------------|
| White | #FFFFFF | `--white` | `text-white`, `bg-white` |
| Light Gray | #F5F5F5 | `--light-gray` | `text-light-gray`, `bg-light-gray` |
| Medium Gray | #E0E0E0 | `--medium-gray` | `text-medium-gray`, `bg-medium-gray` |
| Dark Gray | #757575 | `--dark-gray` | `text-dark-gray`, `bg-dark-gray` |
| Black | #212121 | `--black` | `text-black`, `bg-black` |

### State Colors

| Color | Hex Code | CSS Variable | Tailwind Class |
|-------|----------|--------------|---------------|
| Red | #D92632 | `--red` | `text-red`, `bg-red` |
| Orange | #FF9852 | `--orange` | `text-orange`, `bg-orange` |
| Purple | #6126AE | `--purple` | `text-purple`, `bg-purple` |
| Dark Blue | #004EB2 | `--dark-blue` | `text-dark-blue`, `bg-dark-blue` |
| Light Blue | #2F96F4 | `--light-blue` | `text-light-blue`, `bg-light-blue` |

## Typography

The design system uses Inter as the primary font with various weights:

| Weight | CSS Class | Usage |
|--------|-----------|-------|
| Light (300) | `font-light` | Subtle text, captions |
| Regular (400) | `font-normal` | Body text, general content |
| Medium (500) | `font-medium` | Subheadings, important text |
| SemiBold (600) | `font-semibold` | Headings, buttons, emphasis |
| Bold (700) | `font-bold` | Extra emphasis |

### Font Sizes

| Element | Tailwind Class | Size | Line Height | Usage |
|---------|---------------|------|-------------|-------|
| H1 | `text-5xl` | 48px | 56px | Main page headings |
| H2 | `text-4xl` | 36px | 44px | Section headings |
| H3 | `text-2xl` | 24px | 32px | Subsection headings |
| H4 | `text-xl` | 20px | 28px | Card headings |
| Body Large | `text-lg` | 18px | 28px | Featured content |
| Body | `text-base` | 16px | 24px | Main content |
| Body Small | `text-sm` | 14px | 20px | Secondary content |
| Caption | `text-xs` | 12px | 16px | Labels, metadata |

## Spacing

| Size | CSS Variable | Tailwind Class | Value | Usage |
|------|--------------|---------------|-------|-------|
| xs | `--space-xs` | `p-xs`, `m-xs` | 4px | Minimal spacing, icons |
| sm | `--space-sm` | `p-sm`, `m-sm` | 8px | Tight spacing, compact elements |
| md | `--space-md` | `p-md`, `m-md` | 16px | Standard spacing, most elements |
| lg | `--space-lg` | `p-lg`, `m-lg` | 24px | Generous spacing, section separation |
| xl | `--space-xl` | `p-xl`, `m-xl` | 32px | Major section separation |
| xxl | `--space-xxl` | `p-xxl`, `m-xxl` | 48px | Page section separation |

## Border Radius

| Size | CSS Variable | Tailwind Class | Value | Usage |
|------|--------------|---------------|-------|-------|
| Small | `--radius-sm` | `rounded-sm` | 4px | Buttons, input fields |
| Medium | `--radius-md` | `rounded-md` | 8px | Cards, modals |
| Large | `--radius-lg` | `rounded-lg` | 12px | Featured elements |
| Round | `--radius-round` | `rounded-round` | 50% | Avatars, circular elements |

## Container Widths

| Size | CSS Class | Width | Usage |
|------|-----------|-------|-------|
| Small | `container-sm` | 640px | Focused content, forms |
| Medium | `container-md` | 960px | Standard content |
| Large | `container-lg` | 1280px | Full-width content |

## Role-Based Themes

The design system includes role-specific themes that can be applied by adding the appropriate class to a container element:

| Role | CSS Class | Primary Color | Secondary Color | Accent Color |
|------|-----------|--------------|-----------------|--------------|
| System Admin | `theme-system-admin` | Primary Green | Medium Teal | Dark Blue |
| Campus Admin | `theme-campus-admin` | Dark Blue | Light Blue | Primary Green |
| Teacher | `theme-teacher` | Medium Teal | Primary Green | Light Blue |
| Student | `theme-student` | Light Blue | Dark Blue | Orange |
| Parent | `theme-parent` | Purple | Medium Teal | Orange |

## Usage Examples

### Typography

```jsx
<h1>Main Heading</h1>
<h2>Section Heading</h2>
<h3>Subsection Heading</h3>
<h4>Card Heading</h4>
<p className="body-large">Featured content text</p>
<p className="body">Standard body text</p>
<p className="body-small">Secondary information</p>
<span className="caption">Label or metadata</span>
```

### Colors

```jsx
<div className="bg-primary-green text-white">Primary green background with white text</div>
<div className="bg-light-mint text-primary-green">Light mint background with primary green text</div>
<button className="bg-dark-blue text-white">Blue button</button>
<div className="text-red">Error message</div>
```

### Role-Based Theming

```jsx
<div className="theme-system-admin">
  {/* System admin themed content */}
  <button className="bg-primary text-primary-foreground">Primary Button</button>
  <div className="bg-secondary text-secondary-foreground">Secondary Element</div>
</div>

<div className="theme-student">
  {/* Student themed content */}
  <button className="bg-primary text-primary-foreground">Primary Button</button>
  <div className="bg-secondary text-secondary-foreground">Secondary Element</div>
</div>
```

### Spacing

```jsx
<div className="space-md">Medium spacing</div>
<div className="p-md">Medium padding</div>
<div className="m-lg">Large margin</div>
<div className="gap-sm">Small gap between flex/grid items</div>
```

### Containers

```jsx
<div className="container-sm">Small container for focused content</div>
<div className="container-md">Medium container for standard content</div>
<div className="container-lg">Large container for full-width content</div>
```

## Animations and Transitions

```jsx
<div className="animate-fade-in">Fade in animation</div>
<div className="transition-default hover:scale-105">Hover scale effect</div>
<div className="transition-page">Page transition element</div>
```

## Mobile Optimization

For touch-friendly elements on mobile:

```jsx
<button className="touch-target">Mobile-friendly button</button>
```

## Accessibility

The design system follows accessibility best practices:
- Color contrast ratios meet WCAG 2.1 AA standards
- Font sizes are readable and scalable
- Interactive elements have appropriate focus states
- Semantic HTML is used throughout the application 