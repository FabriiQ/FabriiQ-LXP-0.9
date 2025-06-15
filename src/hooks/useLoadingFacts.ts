'use client';

import { useState, useEffect } from 'react';
import { getRandomFact, EDUCATIONAL_FACTS } from '@/utils/query-config';

/**
 * Hook for displaying educational facts during loading states
 * 
 * @param options Configuration options
 * @returns Object with current fact and functions to control facts
 */
export function useLoadingFacts(options: {
  isLoading?: boolean;
  interval?: number;
  category?: 'general' | 'math' | 'science' | 'language';
  autoRotate?: boolean;
} = {}) {
  const {
    isLoading = false,
    interval = 5000,
    autoRotate = true,
  } = options;

  const [currentFact, setCurrentFact] = useState<string>(getRandomFact());
  const [factIndex, setFactIndex] = useState<number>(0);

  // Update fact when loading state changes
  useEffect(() => {
    if (isLoading) {
      setCurrentFact(getRandomFact());
    }
  }, [isLoading]);

  // Auto-rotate facts during extended loading
  useEffect(() => {
    if (!isLoading || !autoRotate) return;

    const timer = setInterval(() => {
      const newIndex = (factIndex + 1) % EDUCATIONAL_FACTS.length;
      setFactIndex(newIndex);
      setCurrentFact(EDUCATIONAL_FACTS[newIndex]);
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, interval, factIndex, autoRotate]);

  // Function to manually get the next fact
  const nextFact = () => {
    const newIndex = (factIndex + 1) % EDUCATIONAL_FACTS.length;
    setFactIndex(newIndex);
    setCurrentFact(EDUCATIONAL_FACTS[newIndex]);
    return EDUCATIONAL_FACTS[newIndex];
  };

  // Function to manually get the previous fact
  const previousFact = () => {
    const newIndex = factIndex === 0 ? EDUCATIONAL_FACTS.length - 1 : factIndex - 1;
    setFactIndex(newIndex);
    setCurrentFact(EDUCATIONAL_FACTS[newIndex]);
    return EDUCATIONAL_FACTS[newIndex];
  };

  return {
    currentFact,
    nextFact,
    previousFact,
    factIndex,
  };
}
