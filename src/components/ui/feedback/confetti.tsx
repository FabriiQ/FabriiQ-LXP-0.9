'use client';

import { useEffect, useState } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';

interface ConfettiProps {
  duration?: number;
  pieces?: number;
  colors?: string[];
  gravity?: number;
  wind?: number;
  recycle?: boolean;
}

/**
 * Confetti component for celebratory feedback
 * 
 * Features:
 * - Responsive to window size
 * - Customizable duration, pieces, colors, etc.
 * - Auto-cleanup after duration
 * 
 * @example
 * ```tsx
 * <Confetti duration={5000} pieces={200} />
 * ```
 */
export function Confetti({
  duration = 5000,
  pieces = 200,
  colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
  gravity = 0.3,
  wind = 0.05,
  recycle = false
}: ConfettiProps) {
  const [isActive, setIsActive] = useState(true);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!isActive) return null;

  return (
    <ReactConfetti
      width={width}
      height={height}
      numberOfPieces={pieces}
      colors={colors}
      gravity={gravity}
      wind={wind}
      recycle={recycle}
      style={{ position: 'fixed', top: 0, left: 0, zIndex: 1000, pointerEvents: 'none' }}
    />
  );
}
