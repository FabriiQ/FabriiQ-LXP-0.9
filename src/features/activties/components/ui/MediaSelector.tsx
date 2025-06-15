'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaUploader, MediaItem } from './MediaUploader';
import { JinaImageSearch } from './JinaImageSearch';
import { PhotoIcon, VideoCameraIcon, MusicalNoteIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface MediaSelectorProps {
  media?: MediaItem;
  onChange: (media?: MediaItem) => void;
  className?: string;
  label?: string;
  allowedTypes?: ('image' | 'video' | 'audio')[];
  maxSizeMB?: number;
  enableJinaAI?: boolean;
}

/**
 * Media Selector Component
 * 
 * This component provides a comprehensive interface for selecting media,
 * including file upload, URL input, and Jina AI image search.
 */
export const MediaSelector: React.FC<MediaSelectorProps> = ({
  media,
  onChange,
  className,
  label = 'Media',
  allowedTypes = ['image', 'video', 'audio'],
  maxSizeMB = 5,
  enableJinaAI = true
}) => {
  const [mode, setMode] = useState<'upload' | 'jina'>(media ? 'upload' : 'upload');
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Mode tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 focus:outline-none",
            mode === 'upload'
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          )}
          onClick={() => setMode('upload')}
        >
          <div className="flex items-center space-x-1">
            <PhotoIcon className="w-4 h-4" />
            <span>Upload or URL</span>
          </div>
        </button>
        
        {enableJinaAI && allowedTypes.includes('image') && (
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 focus:outline-none",
              mode === 'jina'
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            )}
            onClick={() => setMode('jina')}
          >
            <div className="flex items-center space-x-1">
              <SparklesIcon className="w-4 h-4" />
              <span>Jina AI Images</span>
            </div>
          </button>
        )}
      </div>
      
      {/* Content based on mode */}
      {mode === 'upload' ? (
        <MediaUploader
          media={media}
          onChange={onChange}
          label={label}
          allowedTypes={allowedTypes}
          maxSizeMB={maxSizeMB}
        />
      ) : (
        <JinaImageSearch
          onSelectImage={onChange}
        />
      )}
    </div>
  );
};

export default MediaSelector;
