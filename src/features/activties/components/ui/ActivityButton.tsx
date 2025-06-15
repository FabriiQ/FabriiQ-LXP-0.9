'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Import icons from Lucide
import {
  Check,
  X,
  Plus,
  Save,
  Trash,
  Pencil,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Loader2
} from 'lucide-react';

// Custom refresh icon
const RefreshIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

// Map icon names to Lucide components
const iconMap: Record<string, React.ElementType> = {
  'check': Check,
  'x': X,
  'plus': Plus,
  'save': Save,
  'trash': Trash,
  'refresh': RefreshIcon,
  'pencil': Pencil,
  'check-circle': CheckCircle,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'loader': Loader2
};

interface RippleEffect {
  x: number;
  y: number;
  size: number;
  id: number;
}

/**
 * Enhanced Button with micro-interactions
 *
 * This button component includes:
 * - Hover and press animations
 * - Ripple effect on click with touch support
 * - Icon support with optional animation
 * - Multiple variants using brand colors
 * - Accessibility features
 * - Mobile-friendly interactions
 * - Enhanced loading state animation
 * - Improved touch feedback
 * - Proper sizing for mobile (44x44px minimum touch target)
 */
export const ActivityButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  icon?: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  onClick,
  disabled = false,
  variant = 'primary',
  icon,
  children,
  className,
  ariaLabel,
  loading = false,
  size = 'md'
}) => {
  // State for hover and press effects
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // State for ripple effect
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Reset touch state after delay
  useEffect(() => {
    if (isTouched) {
      const timer = setTimeout(() => {
        setIsTouched(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTouched]);

  // Handle ripple effect for mouse and touch
  const createRipple = (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>, isTouchEvent = false) => {
    if (disabled || loading) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();

    // Get coordinates based on event type
    let x: number, y: number;
    if (isTouchEvent && 'touches' in event) {
      const touch = event.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else if (!isTouchEvent && 'clientX' in event) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else {
      // Fallback to center of button
      x = rect.width / 2;
      y = rect.height / 2;
    }

    // Calculate size (diagonal of the button to ensure it covers the whole button)
    const size = Math.max(rect.width, rect.height) * 2.5; // Increased size for better coverage

    // Add new ripple
    const id = Date.now();
    setRipples(prev => [...prev, { x, y, size, id }]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 700); // Match this to the CSS animation duration

    // Set touch state for mobile feedback
    if (isTouchEvent) {
      setIsTouched(true);
    }
  };

  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'min-h-[36px] min-w-[36px] px-3 py-1 text-sm',
    md: 'min-h-[44px] min-w-[44px] px-4 py-2', // Minimum 44x44px for touch targets
    lg: 'min-h-[52px] min-w-[52px] px-5 py-3 text-lg',
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative overflow-hidden rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2",
        sizeClasses[size],
        {
          // Use brand colors instead of blue
          'bg-primary-green hover:bg-primary-green/90 text-white': variant === 'primary',
          'bg-medium-teal hover:bg-medium-teal/90 text-white': variant === 'secondary',
          'bg-green-600 hover:bg-green-700 text-white': variant === 'success',
          'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
          'opacity-50 cursor-not-allowed': disabled || loading,
          'transform scale-[1.03]': isHovered && !disabled && !loading,
          'transform scale-95': (isPressed || isTouched) && !disabled && !loading,
          'shadow-md': isHovered && !disabled && !loading,
          'ring-2 ring-primary-green/50 ring-offset-1': isFocused && !disabled && !loading,
        },
        className
      )}
      onClick={(e) => {
        if (disabled || loading) return;
        createRipple(e);
        onClick();
      }}
      onTouchStart={(e) => createRipple(e, true)}
      disabled={disabled || loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={ariaLabel}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin-grow text-white" />
      ) : (
        icon && iconMap[icon] && React.createElement(iconMap[icon], {
          className: cn("w-5 h-5 mr-2", {
            "animate-pulse": isHovered && !disabled,
          })
        })
      )}
      <span className={cn({
        "animate-pulse": loading
      })}>
        {children}
      </span>

      {/* Ripple effects with enhanced animation */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white bg-opacity-30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </button>
  );
};

export default ActivityButton;
