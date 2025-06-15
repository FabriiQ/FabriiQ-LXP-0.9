'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MediaItem } from './MediaUploader';

interface MediaDisplayProps {
  media: MediaItem;
  className?: string;
  maxHeight?: string;
  showCaption?: boolean;
}

/**
 * Media Display Component
 * 
 * A component for displaying media (images, videos, audio) with
 * accessibility features and captions.
 */
export const MediaDisplay: React.FC<MediaDisplayProps> = ({
  media,
  className,
  maxHeight = '300px',
  showCaption = true
}) => {
  return (
    <figure className={cn("", className)}>
      <div className="mb-2">
        {media.type === 'image' && (
          <img 
            src={media.url} 
            alt={media.alt || ''} 
            className="object-contain mx-auto rounded"
            style={{ maxHeight }}
          />
        )}
        
        {media.type === 'video' && (
          <video 
            src={media.url} 
            controls 
            className="w-full rounded"
            style={{ maxHeight }}
          />
        )}
        
        {media.type === 'audio' && (
          <audio 
            src={media.url} 
            controls 
            className="w-full rounded"
          />
        )}
      </div>
      
      {showCaption && media.caption && (
        <figcaption className="text-sm text-center text-gray-600 dark:text-gray-400 mt-1">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
};

export default MediaDisplay;
