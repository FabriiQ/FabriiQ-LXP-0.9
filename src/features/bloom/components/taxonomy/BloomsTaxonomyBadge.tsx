'use client';

import React from 'react';
import { Badge } from '@/components/ui/data-display/badge';
import { BloomsTaxonomyLevel } from '../../types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '../../constants/bloom-levels';

interface BloomsTaxonomyBadgeProps {
  level: BloomsTaxonomyLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * BloomsTaxonomyBadge Component
 * 
 * Displays a badge with the color and name of a Bloom's Taxonomy level.
 */
export function BloomsTaxonomyBadge({
  level,
  size = 'md',
  showLabel = true,
  className = '',
}: BloomsTaxonomyBadgeProps) {
  const metadata = BLOOMS_LEVEL_METADATA[level];
  
  if (!metadata) {
    return null;
  }

  // Determine size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge
      className={`text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: metadata.color }}
    >
      {showLabel ? metadata.name : ''}
    </Badge>
  );
}
