'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  priority?: number; // 1-10, higher means higher priority
  delay?: number; // Delay in ms before loading
  className?: string;
  onLoad?: () => void;
}

/**
 * Component for progressive loading with priority for visible content
 */
export function ProgressiveLoader({
  children,
  placeholder,
  priority = 5,
  delay = 0,
  className = '',
  onLoad,
}: ProgressiveLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use intersection observer to detect when component is in view
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px', // Load when within 200px of viewport
  });

  // Determine when to load based on priority and visibility
  useEffect(() => {
    if (!inView) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Calculate delay based on priority (higher priority = lower delay)
    const priorityDelay = delay + (10 - priority) * 100;

    // Set timeout to load content
    timeoutRef.current = setTimeout(() => {
      setShouldRender(true);
      
      // Add a small delay before marking as loaded for animation purposes
      setTimeout(() => {
        setIsLoaded(true);
        if (onLoad) onLoad();
      }, 100);
    }, priorityDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inView, priority, delay, onLoad]);

  return (
    <div ref={ref} className={className}>
      {shouldRender ? (
        <div
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {children}
        </div>
      ) : (
        placeholder || (
          <div className="animate-pulse bg-muted rounded-md h-full w-full min-h-[100px]" />
        )
      )}
    </div>
  );
}
