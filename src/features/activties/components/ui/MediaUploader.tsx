'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  XMarkIcon,
  LinkIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export interface MediaItem {
  type: 'image' | 'video' | 'audio';
  url: string;
  alt?: string;
  caption?: string;
}

interface MediaUploaderProps {
  media?: MediaItem;
  onChange: (media?: MediaItem) => void;
  className?: string;
  label?: string;
  allowedTypes?: ('image' | 'video' | 'audio')[];
  maxSizeMB?: number;
}

/**
 * Media Uploader Component
 *
 * A component for uploading and managing media files (images, videos, audio)
 * with preview capabilities and accessibility features.
 */
export const MediaUploader: React.FC<MediaUploaderProps> = ({
  media,
  onChange,
  className,
  label = 'Media',
  allowedTypes = ['image', 'video', 'audio'],
  maxSizeMB = 5
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'url'>(media?.url ? 'url' : 'file');
  const [urlInput, setUrlInput] = useState<string>(media?.url || '');
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize URL input if media exists
  useEffect(() => {
    if (media?.url) {
      setUrlInput(media.url);
    }
  }, [media?.url]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Determine file type
    let type: 'image' | 'video' | 'audio';
    if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type.startsWith('video/')) {
      type = 'video';
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
    } else {
      setError('Unsupported file type');
      return;
    }

    // Check if type is allowed
    if (!allowedTypes.includes(type)) {
      setError(`${type} files are not allowed`);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // In a real application, you would upload the file to a server here
      // For now, we'll just create a local URL
      const url = URL.createObjectURL(file);

      // Create media item
      const newMedia: MediaItem = {
        type,
        url,
        alt: file.name
      };

      onChange(newMedia);
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle URL input change
  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setUrlInput(url);

    // Clear error when input changes
    if (error) {
      setError(null);
    }

    // Reset validation state
    setIsUrlValid(null);

    // Clear media if URL is empty
    if (!url) {
      onChange(undefined);
    }
  };

  // Validate and apply URL
  const validateAndApplyUrl = () => {
    const url = urlInput.trim();

    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setIsValidatingUrl(true);
    setError(null);

    // Try to determine type from URL
    let type: 'image' | 'video' | 'audio' = 'image';
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) {
      type = 'video';
    } else if (url.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      type = 'audio';
    }

    // Check if type is allowed
    if (!allowedTypes.includes(type)) {
      setError(`${type} files are not allowed`);
      setIsValidatingUrl(false);
      return;
    }

    // For images, validate that the URL actually points to an image
    if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        setIsUrlValid(true);
        setIsValidatingUrl(false);

        // Create media item
        const newMedia: MediaItem = {
          type,
          url,
          alt: ''
        };

        onChange(newMedia);
      };
      img.onerror = () => {
        setIsUrlValid(false);
        setIsValidatingUrl(false);
        setError('Invalid image URL or image could not be loaded');
      };
      img.src = url;
    } else {
      // For non-image media, we can't easily validate, so just accept it
      setIsUrlValid(true);
      setIsValidatingUrl(false);

      // Create media item
      const newMedia: MediaItem = {
        type,
        url,
        alt: ''
      };

      onChange(newMedia);
    }
  };

  // Handle alt text change
  const handleAltTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!media) return;

    onChange({
      ...media,
      alt: e.target.value
    });
  };

  // Handle caption change
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!media) return;

    onChange({
      ...media,
      caption: e.target.value
    });
  };

  // Handle remove media
  const handleRemoveMedia = () => {
    onChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="block font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="flex flex-col space-y-3">
        {/* Input mode tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 focus:outline-none",
              inputMode === 'file'
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            )}
            onClick={() => setInputMode('file')}
          >
            Upload File
          </button>
          <button
            type="button"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 focus:outline-none",
              inputMode === 'url'
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            )}
            onClick={() => setInputMode('url')}
          >
            Image URL
          </button>
        </div>

        {/* File upload */}
        {inputMode === 'file' && (
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={allowedTypes.map(type =>
                type === 'image' ? 'image/*' :
                type === 'video' ? 'video/*' :
                'audio/*'
              ).join(',')}
              className="hidden"
              id="media-upload"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Select File'}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              {allowedTypes.includes('image') && 'Images'}
              {allowedTypes.includes('image') && allowedTypes.includes('video') && ', '}
              {allowedTypes.includes('video') && 'Videos'}
              {(allowedTypes.includes('image') || allowedTypes.includes('video')) && allowedTypes.includes('audio') && ', '}
              {allowedTypes.includes('audio') && 'Audio'}
            </span>
          </div>
        )}

        {/* URL input */}
        {inputMode === 'url' && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="url"
                placeholder="Enter media URL"
                onChange={handleUrlInputChange}
                value={urlInput}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={validateAndApplyUrl}
                disabled={isValidatingUrl || !urlInput.trim()}
                className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
              >
                {isValidatingUrl ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : isUrlValid ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <LinkIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter a URL for an image, video, or audio file. For images from Jina AI or other sources, copy the image URL.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Media preview */}
        {media && (
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                {media.type === 'image' && <PhotoIcon className="w-5 h-5 text-blue-500" />}
                {media.type === 'video' && <VideoCameraIcon className="w-5 h-5 text-blue-500" />}
                {media.type === 'audio' && <MusicalNoteIcon className="w-5 h-5 text-blue-500" />}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                </span>
                {inputMode === 'url' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {media.url}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {inputMode === 'url' && (
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput(media.url);
                      validateAndApplyUrl();
                    }}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label="Refresh media"
                    title="Refresh media"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  aria-label="Remove media"
                  title="Remove media"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mb-3">
              {media.type === 'image' && (
                <div className="relative">
                  <img
                    src={media.url}
                    alt={media.alt || ''}
                    className="max-h-48 object-contain mx-auto rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      setError('Image failed to load. The URL may be invalid or the image may no longer be available.');
                    }}
                  />
                  {inputMode === 'url' && (
                    <div className="absolute bottom-2 right-2">
                      <a
                        href={media.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-black/50 text-white px-2 py-1 rounded text-xs hover:bg-black/70"
                        title="Open image in new tab"
                      >
                        Open
                      </a>
                    </div>
                  )}
                </div>
              )}

              {media.type === 'video' && (
                <video
                  src={media.url}
                  controls
                  className="max-h-48 w-full rounded"
                  onError={() => setError('Video failed to load. The URL may be invalid or the video may no longer be available.')}
                />
              )}

              {media.type === 'audio' && (
                <audio
                  src={media.url}
                  controls
                  className="w-full rounded"
                  onError={() => setError('Audio failed to load. The URL may be invalid or the audio may no longer be available.')}
                />
              )}
            </div>

            <div className="space-y-2">
              <div>
                <label htmlFor="media-alt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alt Text (for accessibility)
                </label>
                <input
                  type="text"
                  id="media-alt"
                  value={media.alt || ''}
                  onChange={handleAltTextChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe the media for screen readers"
                />
              </div>

              <div>
                <label htmlFor="media-caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Caption (optional)
                </label>
                <input
                  type="text"
                  id="media-caption"
                  value={media.caption || ''}
                  onChange={handleCaptionChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Add a caption"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaUploader;
