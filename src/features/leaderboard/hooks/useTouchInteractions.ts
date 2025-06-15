/**
 * Touch Interactions Hook
 * 
 * This hook provides touch-optimized interactions for mobile devices,
 * including swipe gestures, tap handling, and touch feedback.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Gesture types
export enum GestureType {
  SWIPE_LEFT = 'swipe_left',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_UP = 'swipe_up',
  SWIPE_DOWN = 'swipe_down',
  TAP = 'tap',
  LONG_PRESS = 'long_press',
}

// Gesture direction
export enum GestureDirection {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  BOTH = 'both',
}

// Gesture options
export interface GestureOptions {
  // Minimum distance (in pixels) to trigger a swipe
  swipeThreshold: number;
  // Minimum velocity (in pixels per millisecond) to trigger a swipe
  velocityThreshold: number;
  // Time (in milliseconds) to trigger a long press
  longPressDelay: number;
  // Direction(s) to detect swipes
  direction: GestureDirection;
  // Whether to prevent default browser behavior
  preventDefault: boolean;
  // Whether to stop propagation of events
  stopPropagation: boolean;
}

// Default gesture options
export const DEFAULT_GESTURE_OPTIONS: GestureOptions = {
  swipeThreshold: 50,
  velocityThreshold: 0.2,
  longPressDelay: 500,
  direction: GestureDirection.BOTH,
  preventDefault: true,
  stopPropagation: false,
};

// Touch state
interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  currentX: number;
  currentY: number;
  currentTime: number;
  isLongPress: boolean;
  longPressTimer: number | null;
}

/**
 * Hook for implementing touch-optimized interactions
 * 
 * @param options Gesture options
 * @param onGesture Callback for gesture events
 * @returns Object with ref to attach to the element and current gesture state
 */
export function useTouchInteractions(
  options: Partial<GestureOptions> = {},
  onGesture?: (gesture: GestureType, event: TouchEvent | MouseEvent) => void
) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureType | null>(null);
  
  // Merge with default options
  const mergedOptions: GestureOptions = {
    ...DEFAULT_GESTURE_OPTIONS,
    ...options,
  };
  
  // Touch state reference
  const touchStateRef = useRef<TouchState | null>(null);
  
  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent | MouseEvent) => {
    // Get touch coordinates
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const y = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const time = Date.now();
    
    // Initialize touch state
    touchStateRef.current = {
      startX: x,
      startY: y,
      startTime: time,
      currentX: x,
      currentY: y,
      currentTime: time,
      isLongPress: false,
      longPressTimer: null,
    };
    
    // Start long press timer
    if (touchStateRef.current) {
      touchStateRef.current.longPressTimer = window.setTimeout(() => {
        if (touchStateRef.current) {
          touchStateRef.current.isLongPress = true;
          setCurrentGesture(GestureType.LONG_PRESS);
          onGesture?.(GestureType.LONG_PRESS, event);
        }
      }, mergedOptions.longPressDelay);
    }
    
    // Prevent default if needed
    if (mergedOptions.preventDefault) {
      event.preventDefault();
    }
    
    // Stop propagation if needed
    if (mergedOptions.stopPropagation) {
      event.stopPropagation();
    }
  }, [mergedOptions, onGesture]);
  
  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent | MouseEvent) => {
    if (!touchStateRef.current) return;
    
    // Get touch coordinates
    const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const y = 'touches' in event ? event.touches[0].clientY : event.clientY;
    const time = Date.now();
    
    // Update touch state
    touchStateRef.current.currentX = x;
    touchStateRef.current.currentY = y;
    touchStateRef.current.currentTime = time;
    
    // Clear long press timer if moved too far
    const deltaX = Math.abs(x - touchStateRef.current.startX);
    const deltaY = Math.abs(y - touchStateRef.current.startY);
    
    if (deltaX > 10 || deltaY > 10) {
      if (touchStateRef.current.longPressTimer) {
        clearTimeout(touchStateRef.current.longPressTimer);
        touchStateRef.current.longPressTimer = null;
      }
    }
    
    // Prevent default if needed
    if (mergedOptions.preventDefault) {
      event.preventDefault();
    }
    
    // Stop propagation if needed
    if (mergedOptions.stopPropagation) {
      event.stopPropagation();
    }
  }, [mergedOptions]);
  
  // Handle touch end
  const handleTouchEnd = useCallback((event: TouchEvent | MouseEvent) => {
    if (!touchStateRef.current) return;
    
    // Clear long press timer
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }
    
    // If already triggered as long press, don't process further
    if (touchStateRef.current.isLongPress) {
      touchStateRef.current = null;
      setCurrentGesture(null);
      return;
    }
    
    // Calculate deltas
    const deltaX = touchStateRef.current.currentX - touchStateRef.current.startX;
    const deltaY = touchStateRef.current.currentY - touchStateRef.current.startY;
    const deltaTime = touchStateRef.current.currentTime - touchStateRef.current.startTime;
    
    // Calculate velocity
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;
    
    // Determine gesture type
    let gesture: GestureType | null = null;
    
    // Check for swipes
    if (
      (mergedOptions.direction === GestureDirection.HORIZONTAL || mergedOptions.direction === GestureDirection.BOTH) &&
      Math.abs(deltaX) > mergedOptions.swipeThreshold &&
      velocityX > mergedOptions.velocityThreshold
    ) {
      gesture = deltaX > 0 ? GestureType.SWIPE_RIGHT : GestureType.SWIPE_LEFT;
    } else if (
      (mergedOptions.direction === GestureDirection.VERTICAL || mergedOptions.direction === GestureDirection.BOTH) &&
      Math.abs(deltaY) > mergedOptions.swipeThreshold &&
      velocityY > mergedOptions.velocityThreshold
    ) {
      gesture = deltaY > 0 ? GestureType.SWIPE_DOWN : GestureType.SWIPE_UP;
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // Check for tap
      gesture = GestureType.TAP;
    }
    
    // Trigger gesture callback
    if (gesture) {
      setCurrentGesture(gesture);
      onGesture?.(gesture, event);
    } else {
      setCurrentGesture(null);
    }
    
    // Reset touch state
    touchStateRef.current = null;
    
    // Prevent default if needed
    if (mergedOptions.preventDefault) {
      event.preventDefault();
    }
    
    // Stop propagation if needed
    if (mergedOptions.stopPropagation) {
      event.stopPropagation();
    }
  }, [mergedOptions, onGesture]);
  
  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    // Clear long press timer
    if (touchStateRef.current?.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
    }
    
    // Reset touch state
    touchStateRef.current = null;
    setCurrentGesture(null);
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart as any);
    element.addEventListener('touchmove', handleTouchMove as any);
    element.addEventListener('touchend', handleTouchEnd as any);
    element.addEventListener('touchcancel', handleTouchCancel);
    
    // Add mouse event listeners for desktop testing
    element.addEventListener('mousedown', handleTouchStart as any);
    element.addEventListener('mousemove', handleTouchMove as any);
    element.addEventListener('mouseup', handleTouchEnd as any);
    
    // Clean up
    return () => {
      element.removeEventListener('touchstart', handleTouchStart as any);
      element.removeEventListener('touchmove', handleTouchMove as any);
      element.removeEventListener('touchend', handleTouchEnd as any);
      element.removeEventListener('touchcancel', handleTouchCancel);
      
      element.removeEventListener('mousedown', handleTouchStart as any);
      element.removeEventListener('mousemove', handleTouchMove as any);
      element.removeEventListener('mouseup', handleTouchEnd as any);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);
  
  return {
    ref: elementRef,
    currentGesture,
  };
}

/**
 * Hook for implementing haptic feedback
 * 
 * @returns Object with functions to trigger different types of haptic feedback
 */
export function useHapticFeedback() {
  // Check if the Vibration API is available
  const hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  
  // Trigger light haptic feedback (e.g., for taps)
  const triggerLightFeedback = useCallback(() => {
    if (hasVibration) {
      navigator.vibrate(10);
    }
  }, [hasVibration]);
  
  // Trigger medium haptic feedback (e.g., for successful actions)
  const triggerMediumFeedback = useCallback(() => {
    if (hasVibration) {
      navigator.vibrate(20);
    }
  }, [hasVibration]);
  
  // Trigger strong haptic feedback (e.g., for errors or important events)
  const triggerStrongFeedback = useCallback(() => {
    if (hasVibration) {
      navigator.vibrate([30, 30, 30]);
    }
  }, [hasVibration]);
  
  return {
    triggerLightFeedback,
    triggerMediumFeedback,
    triggerStrongFeedback,
    hasVibration,
  };
}
