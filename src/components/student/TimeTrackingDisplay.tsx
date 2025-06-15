'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useTimeTracking } from '@/components/providers/TimeTrackingProvider';
import { Badge } from '@/components/ui/badge';

interface TimeTrackingDisplayProps {
  activityId: string;
  className?: string;
}

/**
 * Component to display the current time tracking status
 */
export function TimeTrackingDisplay({ activityId, className }: TimeTrackingDisplayProps) {
  const { isTracking, getElapsedTime } = useTimeTracking();
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Update elapsed time every second if tracking
  useEffect(() => {
    if (!isTracking(activityId)) return;
    
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime(activityId));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activityId, isTracking, getElapsedTime]);
  
  // Format elapsed time as mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // If not tracking, don't show anything
  if (!isTracking(activityId)) {
    return null;
  }
  
  return (
    <Badge variant="outline" className={className}>
      <Clock className="h-3 w-3 mr-1" />
      <span>{formatTime(elapsedTime)}</span>
    </Badge>
  );
}
