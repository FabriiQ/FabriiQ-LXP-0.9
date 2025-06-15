# UX Guidelines

## Introduction 

This brand kit defines the visual language and UI components for our digital products. It ensures consistency across all platforms and provides developers and designers with the necessary tools to create cohesive user experiences.

## Brand Colors

### Primary Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| Primary Green | #1F504B | rgb(31, 80, 75) | Primary actions, headers, key UI elements |
| Medium Teal | #5A8A84 | rgb(90, 138, 132) | Secondary elements, hover states |
| Light Mint | #D8E3E0 | rgb(216, 227, 224) | Backgrounds, cards, subtle highlights |

### Neutral Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| White | #FFFFFF | rgb(255, 255, 255) | Backgrounds, cards, text on dark colors |
| Light Gray | #F5F5F5 | rgb(245, 245, 245) | Backgrounds, disabled states |
| Medium Gray | #E0E0E0 | rgb(224, 224, 224) | Borders, dividers |
| Dark Gray | #757575 | rgb(117, 117, 117) | Secondary text |
| Black | #212121 | rgb(33, 33, 33) | Primary text |

### State Colors

| Color | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| Red | #D92632 | rgb(217, 38, 50) | Error states, critical actions |
| Orange | #FF9852 | rgb(255, 152, 82) | Notifications, attention |
| Purple | #6126AE | rgb(97, 38, 174) | Premium features |
| Dark Blue | #004EB2 | rgb(0, 78, 178) | Links, interactive elements |
| Light Blue | #2F96F4 | rgb(47, 150, 244) | Secondary actions |

## Typography

### Font Family

**Inter** is our primary typeface with various weights used throughout the interface.

| Weight | Usage | Example |
|--------|-------|---------|
| Inter SemiBold (600) | Headings, buttons, emphasis | **Inter SemiBold** |
| Inter Medium (500) | Subheadings, important text | **Inter Medium** |
| Inter Regular (400) | Body text, general content | Inter Regular |
| Inter Light (300) | Subtle text, captions | Inter Light |

### Font Sizes

| Element | Size | Line Height | Weight | Usage |
|---------|------|-------------|--------|-------|
| H1 | 48px | 56px | SemiBold | Main page headings |
| H2 | 36px | 44px | SemiBold | Section headings |
| H3 | 24px | 32px | SemiBold | Subsection headings |
| H4 | 20px | 28px | SemiBold | Card headings |
| Body Large | 18px | 28px | Regular | Featured content |
| Body | 16px | 24px | Regular | Main content |
| Body Small | 14px | 20px | Regular | Secondary content |
| Caption | 12px | 16px | Regular | Labels, metadata |

## Spacing & Layout

### Spacing Scale

| Size | Value | Usage |
|------|-------|-------|
| xs | 4px | Minimal spacing, icons |
| sm | 8px | Tight spacing, compact elements |
| md | 16px | Standard spacing, most elements |
| lg | 24px | Generous spacing, section separation |
| xl | 32px | Major section separation |
| xxl | 48px | Page section separation |

### Container Widths

| Size | Width | Usage |
|------|-------|-------|
| Small | 640px | Focused content, forms |
| Medium | 960px | Standard content |
| Large | 1280px | Full-width content |

### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| Small | 4px | Buttons, input fields |
| Medium | 8px | Cards, modals |
| Large | 12px | Featured elements |
| Round | 50% | Avatars, circular elements |

## Micro-Interactions

Micro-interactions are subtle animations and visual feedback that enhance the user experience by making interfaces feel more responsive and engaging. They should be purposeful, subtle, and enhance rather than distract from the core functionality.

### 1. Button Interactions

Buttons should provide clear visual feedback when users interact with them:

```css
/* Base button styles */
.button {
  background-color: #1F504B;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  border: none;
  transition: all 0.2s ease;
}

/* Hover state */
.button:hover {
  background-color: #5A8A84;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(31, 80, 75, 0.2);
}

/* Active state */
.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(31, 80, 75, 0.2);
}

/* Focus state */
.button:focus {
  outline: 2px solid #5A8A84;
  outline-offset: 2px;
}
```

### 2. Form Field Validation

Provide immediate feedback during form interactions:

```css
/* Invalid input shake animation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.input-error {
  border-color: #D92632;
  animation: shake 0.5s ease-in-out;
}

/* Success state */
.input-success {
  border-color: #4CAF50;
  transition: border-color 0.3s ease;
}

/* Focus state */
.input:focus {
  border-color: #5A8A84;
  box-shadow: 0 0 0 3px rgba(90, 138, 132, 0.2);
  outline: none;
  transition: all 0.2s ease;
}
```

### 3. Loading Indicators

When users initiate actions that take time, provide visual feedback:

```css
/* Spinner animation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(90, 138, 132, 0.2);
  border-top-color: #1F504B;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Progress bar */
@keyframes progress {
  0% { width: 0%; }
  100% { width: 100%; }
}

.progress-bar {
  height: 4px;
  background-color: #D8E3E0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: #1F504B;
  animation: progress 2s ease-in-out;
}
```

### 4. Toggle Switches

Animate the transition between states:

```css
/* Toggle switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #E0E0E0;
  border-radius: 24px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

.toggle-input:checked + .toggle-slider {
  background-color: #1F504B;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(24px);
}
```

### 5. Hover Effects

Provide visual cues for interactive elements:

```css
/* Link hover effect */
.link {
  color: #004EB2;
  position: relative;
  text-decoration: none;
}

.link:after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 0;
  background-color: #004EB2;
  transition: width 0.3s ease;
}

.link:hover:after {
  width: 100%;
}

/* Card hover effect */
.card {
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

## Page Transitions

Page transitions create a seamless experience when navigating between pages. They should be smooth, consistent, and enhance the perception of speed and responsiveness.

### Implementation with Next.js

Create a custom `TransitionLink` component that extends Next.js's built-in `Link` component:

```tsx
// components/TransitionLink.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, ReactNode } from 'react';

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function TransitionLink({ 
  href, 
  children, 
  className = '' 
}: TransitionLinkProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Add event listener for route change complete
    const handleRouteChangeComplete = () => {
      document.documentElement.classList.remove('page-transitioning');
      setIsTransitioning(false);
    };

    // Clean up the event listener
    return () => {
      document.documentElement.classList.remove('page-transitioning');
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    document.documentElement.classList.add('page-transitioning');
    
    // Delay navigation to allow exit animation to play
    setTimeout(() => {
      router.push(href);
    }, 300); // Match this with your CSS transition duration
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </Link>
  );
}
```

Add the necessary CSS for page transitions:

```css
/* globals.css */
/* Page transition animations */
.page-content {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-transitioning .page-content {
  opacity: 0;
  transform: translateY(20px);
}

/* Initial page load animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-content {
  animation: fadeIn 0.5s ease forwards;
}
```

Wrap your page content in a div with the `page-content` class:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="page-content">
          {children}
        </div>
      </body>
    </html>
  )
}
```

### Advanced Page Transitions

For more complex page transitions, consider using Framer Motion:

```tsx
// app/layout.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  return (
    <html lang="en">
      <body>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </body>
    </html>
  )
}
```

## Performance Considerations

### Optimizing Animations

1. **Use CSS Transitions for Simple Animations**
   - CSS transitions are hardware-accelerated and more performant than JavaScript animations for simple cases
   - Limit transitions to transform and opacity properties when possible

2. **Debounce and Throttle**
   - Debounce hover effects to prevent excessive re-renders
   - Throttle scroll-based animations

3. **Reduce Paint Operations**
   - Use `will-change` property sparingly for elements that will animate
   - Avoid animating properties that trigger layout recalculations (like width, height, top, left)

### Code Example: Optimized Button Animation

```css
.button {
  background-color: #1F504B;
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  border: none;
  /* Only animate transform and opacity for best performance */
  transform: translateY(0);
  transition: transform 0.2s ease, opacity 0.2s ease, background-color 0.2s ease;
  /* Hint to browser that this element will change */
  will-change: transform;
}

.button:hover {
  background-color: #5A8A84;
  transform: translateY(-2px);
}
```

### Lazy Loading and Code Splitting

1. **Lazy Load Components**
   - Use dynamic imports for components that aren't immediately visible
   - Implement intersection observer for elements below the fold

2. **Code Example: Lazy Loading**

```tsx
// Lazy load a heavy component
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Disable server-side rendering if not needed
});
```

### Mobile Optimization

1. **Reduce Animation Complexity on Mobile**
   - Detect device capabilities and adjust animation complexity
   - Consider disabling certain animations on low-end devices

2. **Touch-Friendly Interactions**
   - Ensure all interactive elements have adequate touch targets (minimum 44x44px)
   - Implement touch-specific feedback for mobile users

3. **Code Example: Device Detection**

```tsx
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
}

// Usage
function MyComponent() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={{ 
        x: 100,
        transition: { 
          duration: prefersReducedMotion ? 0 : 0.5 
        }
      }}
    >
      Content
    </motion.div>
  );
}
```

## Implementation Guidelines

### 1. Start with Mobile-First

Always design and implement for mobile first, then progressively enhance for larger screens:

```css
/* Mobile-first approach */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet (640px and up) */
@media (min-width: 640px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (1024px and up) */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 2. Implement Progressive Enhancement

Add micro-interactions and animations as enhancements, ensuring the core functionality works without them:

```tsx
function Button({ children, onClick }) {
  // Base functionality works without animations
  return (
    <button 
      onClick={onClick}
      className="button"
      // Add aria attributes for accessibility
      aria-label={typeof children === 'string' ? children : 'Button'}
    >
      {children}
    </button>
  );
}
```

### 3. Test Across Devices

Regularly test on various devices and browsers to ensure consistent experience:

- Mobile devices (iOS and Android)
- Tablets
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Different screen sizes and resolutions

### 4. Measure Performance

Use tools to measure and optimize performance:

- Lighthouse for overall performance metrics
- Chrome DevTools Performance tab for animation performance
- WebPageTest for real-world performance testing

## Conclusion

By implementing these guidelines, we can create a cohesive, engaging, and performant user experience across all our digital products. The combination of consistent visual language, thoughtful micro-interactions, and smooth page transitions will elevate our interfaces while maintaining excellent performance and accessibility.

Remember that animations and transitions should enhance the user experience, not distract from it. Always prioritize usability and performance over visual flourish, and ensure that all interactions are purposeful and meaningful.
