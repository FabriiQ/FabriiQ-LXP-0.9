'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { cn } from '@/lib/utils';

interface AivyLottieAnimationProps {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}

/**
 * AivyLottieAnimation - A component specifically for the Aivy animation
 * 
 * This component loads the Aivy animation JSON file directly
 */
export function AivyLottieAnimation({
  className,
  style,
  width,
  height
}: AivyLottieAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Combine style with width and height if provided
  const combinedStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {})
  };

  // Load animation data
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch('/aivyanimation.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setAnimationData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading Aivy animation:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error: {error}</div>;
  }

  return (
    <div className={cn('aivy-lottie-animation-container', className)}>
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={combinedStyle}
        />
      ) : (
        <div className="text-muted-foreground text-sm">Animation not available</div>
      )}
    </div>
  );
}

export default AivyLottieAnimation;
