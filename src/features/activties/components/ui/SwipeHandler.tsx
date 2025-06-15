'use client';

import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Swipe direction enum
export enum SwipeDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right'
}

// SwipeHandler props
interface SwipeHandlerProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance to trigger swipe
  className?: string;
  disabled?: boolean;
  preventDefaultTouchMove?: boolean; // Prevent default touch move behavior
}

/**
 * SwipeHandler Component
 * 
 * A lightweight, performance-optimized component for handling swipe gestures
 * on touch devices. Designed to be used as a wrapper around content that needs
 * swipe interactions.
 */
export const SwipeHandler: React.FC<SwipeHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
  disabled = false,
  preventDefaultTouchMove = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setTouchEndX(null);
    setTouchEndY(null);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || touchStartX === null || touchStartY === null) return;
    
    // Prevent default behavior if specified (e.g., to prevent scrolling)
    if (preventDefaultTouchMove) {
      e.preventDefault();
    }
    
    setTouchEndX(e.touches[0].clientX);
    setTouchEndY(e.touches[0].clientY);
    
    // Check if we're swiping horizontally or vertically
    const deltaX = Math.abs(touchStartX - e.touches[0].clientX);
    const deltaY = Math.abs(touchStartY - e.touches[0].clientY);
    
    // Only set swiping state if we've moved a significant distance
    if (deltaX > 10 || deltaY > 10) {
      setIsSwiping(true);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    if (disabled || !isSwiping || touchStartX === null || touchStartY === null || touchEndX === null || touchEndY === null) {
      // Reset state
      setIsSwiping(false);
      setTouchStartX(null);
      setTouchStartY(null);
      setTouchEndX(null);
      setTouchEndY(null);
      return;
    }
    
    // Calculate distance and direction
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Check if swipe distance exceeds threshold
    if (Math.max(absDeltaX, absDeltaY) >= threshold) {
      // Determine swipe direction
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
    
    // Reset state
    setIsSwiping(false);
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchEndX(null);
    setTouchEndY(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn("touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export default SwipeHandler;
