'use client';

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface LottieAnimationProps {
  animationData?: any;
  animationPath?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

/**
 * LottieAnimation - A component for displaying Lottie animations
 *
 * Features:
 * - Supports both inline animation data and path to animation file
 * - Customizable styling and dimensions
 * - Control for looping and autoplay
 */
export function LottieAnimation({
  animationData,
  animationPath,
  className,
  loop = true,
  autoplay = true,
  style,
  width,
  height
}: LottieAnimationProps) {
  const [loadedAnimationData, setLoadedAnimationData] = useState<any>(animationData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Combine style with width and height if provided
  const combinedStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {})
  };

  // Load animation data from path if provided
  useEffect(() => {
    if (!animationData && animationPath) {
      setLoading(true);
      setError(null);

      fetch(animationPath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load animation: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          setLoadedAnimationData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading Lottie animation:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [animationData, animationPath]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading animation...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }

  return (
    <div className={cn('lottie-animation-container', className)}>
      {loadedAnimationData ? (
        <Lottie
          animationData={loadedAnimationData}
          loop={loop}
          autoplay={autoplay}
          style={combinedStyle}
        />
      ) : (
        <div className="text-muted-foreground text-sm">No animation provided</div>
      )}
    </div>
  );
}

export default LottieAnimation;
