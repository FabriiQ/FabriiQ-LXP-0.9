'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BloomsTaxonomyLevel } from '../../types';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';
import { cn } from '@/lib/utils';

interface CognitiveLevelBadgeProps {
  level: BloomsTaxonomyLevel;
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showValue?: boolean;
  unlocked?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Component for displaying a cognitive level achievement badge
 */
export function CognitiveLevelBadge({
  level,
  value,
  size = 'md',
  showLabel = true,
  showValue = true,
  unlocked = true,
  className = '',
  onClick,
}: CognitiveLevelBadgeProps) {
  const metadata = BLOOMS_LEVEL_METADATA[level];

  // Size classes
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  // Font size classes
  const fontSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  // Value size classes
  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <Card
      className={cn(
        'flex flex-col items-center justify-center p-0 overflow-hidden transition-all duration-200',
        unlocked ? 'opacity-100' : 'opacity-50 grayscale',
        onClick && 'cursor-pointer hover:shadow-md',
        sizeClasses[size],
        className
      )}
      style={{
        borderColor: unlocked ? metadata.color : '#ccc',
        background: unlocked ? `linear-gradient(135deg, ${metadata.color}20, ${metadata.color}10)` : '#f5f5f5'
      }}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center p-2 h-full w-full">
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center rounded-full mb-1',
            iconSizeClasses[size]
          )}
          style={{
            backgroundColor: unlocked ? `${metadata.color}30` : '#eee',
            color: unlocked ? metadata.color : '#999'
          }}
        >
          {metadata.icon ? (
            <span className={cn('font-bold', valueSizeClasses[size])}>
              {metadata.icon.charAt(0)}
            </span>
          ) : (
            <span className={cn('font-bold', valueSizeClasses[size])}>
              {metadata.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Value */}
        {showValue && (
          <div
            className={cn(
              'font-bold',
              valueSizeClasses[size]
            )}
            style={{ color: unlocked ? metadata.color : '#999' }}
          >
            {Math.round(value)}%
          </div>
        )}

        {/* Label */}
        {showLabel && (
          <div
            className={cn(
              'text-center truncate w-full',
              fontSizeClasses[size]
            )}
            style={{ color: unlocked ? metadata.color : '#999' }}
          >
            {metadata.name}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
