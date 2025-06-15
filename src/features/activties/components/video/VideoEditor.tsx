'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  VideoActivity,
  VideoSource,
  VideoSegment,
  InteractiveMarker,
  createDefaultVideoActivity,
  createDefaultVideoSource,
  createDefaultVideoSegment,
  createDefaultInteractiveMarker,
  extractYouTubeVideoId
} from '../../models/video';
import { ActivityButton } from '../ui/ActivityButton';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface VideoEditorProps {
  activity?: VideoActivity;
  onChange?: (activity: VideoActivity) => void;
  onSave?: (activity: VideoActivity) => void;
  className?: string;
}

// Add CSS keyframes for animations
const addAnimationStyles = () => {
  if (typeof document !== 'undefined') {
    // Check if styles already exist
    if (!document.getElementById('video-editor-animations')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'video-editor-animations';
      styleEl.textContent = `
        @keyframes marker-fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .marker-fade-in {
          animation: marker-fade-in 0.5s ease-out forwards;
        }

        @keyframes source-added {
          0% { opacity: 0; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }

        .source-added {
          animation: source-added 0.4s ease-out forwards;
        }

        @keyframes preview-transition {
          0% { opacity: 0.5; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }

        .preview-transition {
          animation: preview-transition 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }
};

export const VideoEditor: React.FC<VideoEditorProps> = ({
  activity,
  onChange,
  onSave,
  className
}) => {
  // Add animation styles on component mount
  useEffect(() => {
    addAnimationStyles();
  }, []);

  const [localActivity, setLocalActivity] = useState<VideoActivity>(
    activity || createDefaultVideoActivity()
  );
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentMarkerIndex, setCurrentMarkerIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newMarkerAdded, setNewMarkerAdded] = useState(false);
  const [newSourceAdded, setNewSourceAdded] = useState(false);
  const [previewTransition, setPreviewTransition] = useState(false);

  useEffect(() => {
    if (activity) {
      setLocalActivity(activity);
    }
  }, [activity]);

  const currentSource = localActivity.videoSources[currentSourceIndex] || localActivity.videoSources[0];
  const currentSegment = localActivity.segments && localActivity.segments[currentSegmentIndex];
  const currentMarker = localActivity.markers && localActivity.markers[currentMarkerIndex];

  const updateActivity = (updates: Partial<VideoActivity>) => {
    const updatedActivity = {
      ...localActivity,
      ...updates,
      updatedAt: new Date()
    };
    setLocalActivity(updatedActivity);

    if (onChange) {
      onChange(updatedActivity);
    }
  };

  const updateSource = (updates: Partial<VideoSource>) => {
    const updatedSources = [...localActivity.videoSources];
    updatedSources[currentSourceIndex] = {
      ...updatedSources[currentSourceIndex],
      ...updates
    };

    updateActivity({ videoSources: updatedSources });
  };

  const updateSegment = (updates: Partial<VideoSegment>) => {
    if (!localActivity.segments) return;

    const updatedSegments = [...localActivity.segments];
    updatedSegments[currentSegmentIndex] = {
      ...updatedSegments[currentSegmentIndex],
      ...updates
    };

    updateActivity({ segments: updatedSegments });
  };

  const updateMarker = (updates: Partial<InteractiveMarker>) => {
    if (!localActivity.markers) return;

    const updatedMarkers = [...localActivity.markers];
    updatedMarkers[currentMarkerIndex] = {
      ...updatedMarkers[currentMarkerIndex],
      ...updates
    };

    updateActivity({ markers: updatedMarkers });
  };

  const handleAddSource = () => {
    const newSource = createDefaultVideoSource();
    updateActivity({
      videoSources: [...localActivity.videoSources, newSource]
    });
    setCurrentSourceIndex(localActivity.videoSources.length);
    setNewSourceAdded(true);

    // Reset animation state after animation completes
    setTimeout(() => {
      setNewSourceAdded(false);
    }, 500);
  };

  const handleRemoveSource = () => {
    if (localActivity.videoSources.length <= 1) return;

    const updatedSources = [...localActivity.videoSources];
    updatedSources.splice(currentSourceIndex, 1);

    updateActivity({ videoSources: updatedSources });
    setCurrentSourceIndex(Math.max(0, currentSourceIndex - 1));
  };

  const handleAddSegment = () => {
    const newSegment = createDefaultVideoSegment();
    const segments = localActivity.segments || [];

    updateActivity({
      segments: [...segments, newSegment]
    });

    setCurrentSegmentIndex(segments.length);
  };

  const handleRemoveSegment = () => {
    if (!localActivity.segments || localActivity.segments.length === 0) return;

    const updatedSegments = [...localActivity.segments];
    updatedSegments.splice(currentSegmentIndex, 1);

    updateActivity({ segments: updatedSegments });
    setCurrentSegmentIndex(Math.max(0, currentSegmentIndex - 1));
  };

  const handleAddMarker = () => {
    const newMarker = createDefaultInteractiveMarker();
    const markers = localActivity.markers || [];

    updateActivity({
      markers: [...markers, newMarker]
    });

    setCurrentMarkerIndex(markers.length);
    setNewMarkerAdded(true);

    // Reset animation state after animation completes
    setTimeout(() => {
      setNewMarkerAdded(false);
    }, 600);
  };

  const handleRemoveMarker = () => {
    if (!localActivity.markers || localActivity.markers.length === 0) return;

    const updatedMarkers = [...localActivity.markers];
    updatedMarkers.splice(currentMarkerIndex, 1);

    updateActivity({ markers: updatedMarkers });
    setCurrentMarkerIndex(Math.max(0, currentMarkerIndex - 1));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(localActivity);
    }
  };

  const togglePreview = () => {
    setIsLoading(true);
    setPreviewTransition(true);

    // Short delay to show loading state
    setTimeout(() => {
      setPreviewMode(!previewMode);
      setIsLoading(false);

      // Reset animation state after animation completes
      setTimeout(() => {
        setPreviewTransition(false);
      }, 300);
    }, 300);
  };

  const renderVideoPreview = () => {
    const youtubeVideoId = currentSource.type === 'youtube' ? extractYouTubeVideoId(currentSource.url) : null;

    // Wrapper with animation class
    const previewWrapperClass = cn(
      "w-full overflow-hidden rounded-lg shadow-md",
      { "preview-transition": previewTransition }
    );

    if (isLoading) {
      return (
        <div className={cn(previewWrapperClass, "aspect-video bg-light-mint/20 dark:bg-primary-green/10 flex flex-col items-center justify-center")}>
          <Loader2 className="w-12 h-12 text-primary-green dark:text-medium-teal animate-spin-grow mb-2" />
          <p className="text-primary-green dark:text-medium-teal font-medium">Loading preview...</p>
        </div>
      );
    }

    if (currentSource.type === 'youtube' && youtubeVideoId) {
      return (
        <div className={previewWrapperClass}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
            style={{ border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={currentSource.title || 'Video preview'}
            className="w-full aspect-video"
          />
          {currentSource.title && (
            <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">{currentSource.title}</h4>
            </div>
          )}
        </div>
      );
    } else if (currentSource.url) {
      return (
        <div className={previewWrapperClass}>
          <video
            src={currentSource.url}
            controls
            className="w-full aspect-video"
          >
            Your browser does not support the video tag.
          </video>
          {currentSource.title && (
            <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-white">{currentSource.title}</h4>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cn(previewWrapperClass, "aspect-video bg-light-mint/20 dark:bg-primary-green/10 flex items-center justify-center")}>
        <div className="text-center p-4">
          <p className="text-primary-green dark:text-medium-teal mb-2">No video preview available</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add a valid video URL to see a preview</p>
        </div>
      </div>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Activity Details</h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={localActivity.title}
            onChange={(e) => updateActivity({ title: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={localActivity.description || ''}
            onChange={(e) => updateActivity({ description: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Instructions</label>
          <textarea
            value={localActivity.instructions || ''}
            onChange={(e) => updateActivity({ instructions: e.target.value })}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-gray-200">Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowSkip"
                checked={localActivity.settings?.allowSkip || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    allowSkip: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="allowSkip" className="text-gray-700 dark:text-gray-300">
                Allow Skipping
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireCompletion"
                checked={localActivity.settings?.requireCompletion !== false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    requireCompletion: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="requireCompletion" className="text-gray-700 dark:text-gray-300">
                Require Completion
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoplay"
                checked={localActivity.settings?.autoplay || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    autoplay: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="autoplay" className="text-gray-700 dark:text-gray-300">
                Autoplay
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="loop"
                checked={localActivity.settings?.loop || false}
                onChange={(e) => updateActivity({
                  settings: {
                    ...localActivity.settings,
                    loop: e.target.checked
                  }
                })}
                className="mr-2 accent-primary-green dark:accent-medium-teal"
              />
              <label htmlFor="loop" className="text-gray-700 dark:text-gray-300">
                Loop Video
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <select
            value={currentSourceIndex}
            onChange={(e) => setCurrentSourceIndex(parseInt(e.target.value))}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {localActivity.videoSources.map((source, index) => (
              <option key={source.id} value={index}>
                Source {index + 1}: {source.title || source.url.substring(0, 20)}
              </option>
            ))}
          </select>

          <ActivityButton
            onClick={handleRemoveSource}
            disabled={localActivity.videoSources.length <= 1}
            variant="danger"
            icon="trash"
            className="ml-2"
          >
            Remove
          </ActivityButton>
        </div>

        <div className="flex items-center">
          <ActivityButton
            onClick={togglePreview}
            variant="secondary"
            icon={previewMode ? "edit" : "eye"}
            className="mr-2"
          >
            {previewMode ? "Edit" : "Preview"}
          </ActivityButton>

          <ActivityButton
            onClick={handleAddSource}
            variant="secondary"
            icon="plus"
          >
            Add Source
          </ActivityButton>
        </div>
      </div>

      <div className={cn("mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800",
        { "source-added": newSourceAdded })}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-green text-white text-sm mr-2">
              {currentSourceIndex + 1}
            </span>
            Video Source
          </h3>

          {!previewMode && (
            <div className="flex items-center">
              <button
                onClick={() => setPreviewMode(true)}
                className="text-primary-green dark:text-medium-teal hover:text-primary-green/80 dark:hover:text-medium-teal/80 p-1 rounded-md transition-colors"
                title="Preview video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="10 8 16 12 10 16 10 8"></polygon>
                </svg>
              </button>
            </div>
          )}
        </div>

        {previewMode ? (
          renderVideoPreview()
        ) : (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Source Type</label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => updateSource({ type: 'youtube' })}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                    currentSource.type === 'youtube'
                      ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                    "w-6 h-6 mb-1",
                    currentSource.type === 'youtube'
                      ? "text-primary-green dark:text-medium-teal"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                  <span className="text-sm font-medium">YouTube</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSource({ type: 'vimeo' })}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                    currentSource.type === 'vimeo'
                      ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                    "w-6 h-6 mb-1",
                    currentSource.type === 'vimeo'
                      ? "text-primary-green dark:text-medium-teal"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    <path d="M22 7c-3 0-4 3-5 5-1.5 3-3 5-6 5S7 15 5.5 12C4 9 3 7 0 7l1 5c3 0 4-3 5-5 1.5-3 3-5 6-5s4 2 5.5 5c1.5 3 2.5 5 5.5 5l-1-5Z"></path>
                  </svg>
                  <span className="text-sm font-medium">Vimeo</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSource({ type: 'direct' })}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                    currentSource.type === 'direct'
                      ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                    "w-6 h-6 mb-1",
                    currentSource.type === 'direct'
                      ? "text-primary-green dark:text-medium-teal"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  <span className="text-sm font-medium">Direct URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSource({ type: 'upload' })}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                    currentSource.type === 'upload'
                      ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                  )}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                    "w-6 h-6 mb-1",
                    currentSource.type === 'upload'
                      ? "text-primary-green dark:text-medium-teal"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <span className="text-sm font-medium">Upload</span>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
                {currentSource.type === 'youtube' ? 'YouTube URL' :
                 currentSource.type === 'vimeo' ? 'Vimeo URL' : 'Video URL'}
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={currentSource.url}
                  onChange={(e) => updateSource({ url: e.target.value })}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={
                    currentSource.type === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                    currentSource.type === 'vimeo' ? 'https://vimeo.com/...' :
                    'https://example.com/video.mp4'
                  }
                />
                <button
                  onClick={() => setPreviewMode(true)}
                  className="px-3 py-2 bg-primary-green hover:bg-primary-green/90 text-white rounded-r transition-colors"
                  title="Preview video"
                >
                  Preview
                </button>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {currentSource.type === 'youtube' && "Enter a YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"}
                {currentSource.type === 'vimeo' && "Enter a Vimeo video URL (e.g., https://vimeo.com/...)"}
                {currentSource.type === 'direct' && "Enter a direct video file URL (e.g., https://example.com/video.mp4)"}
                {currentSource.type === 'upload' && "Upload functionality will be available soon"}
              </div>
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
              <input
                type="text"
                value={currentSource.title || ''}
                onChange={(e) => updateSource({ title: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter a descriptive title for this video"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={currentSource.description || ''}
                onChange={(e) => updateSource({ description: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
                placeholder="Enter a description for this video source"
              />
            </div>
          </>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Video Segments
        </h3>

        <ActivityButton
          onClick={handleAddSegment}
          variant="secondary"
          icon="plus"
        >
          Add Segment
        </ActivityButton>
      </div>

      {localActivity.segments && localActivity.segments.length > 0 ? (
        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <select
              value={currentSegmentIndex}
              onChange={(e) => setCurrentSegmentIndex(parseInt(e.target.value))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {localActivity.segments.map((segment, index) => (
                <option key={segment.id} value={index}>
                  Segment {index + 1}: {segment.title}
                </option>
              ))}
            </select>

            <ActivityButton
              onClick={handleRemoveSegment}
              variant="danger"
              icon="trash"
            >
              Remove
            </ActivityButton>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              type="text"
              value={currentSegment?.title || ''}
              onChange={(e) => updateSegment({ title: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Start Time (seconds)</label>
              <input
                type="number"
                min="0"
                value={currentSegment?.startTime || 0}
                onChange={(e) => updateSegment({ startTime: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">End Time (seconds)</label>
              <input
                type="number"
                min="0"
                value={currentSegment?.endTime || 0}
                onChange={(e) => updateSegment({ endTime: parseInt(e.target.value) })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              value={currentSegment?.description || ''}
              onChange={(e) => updateSegment({ description: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="segmentRequired"
              checked={currentSegment?.required || false}
              onChange={(e) => updateSegment({ required: e.target.checked })}
              className="mr-2 accent-primary-green dark:accent-medium-teal"
            />
            <label htmlFor="segmentRequired" className="text-gray-700 dark:text-gray-300">
              Required
            </label>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 rounded-full bg-light-mint dark:bg-primary-green/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-green dark:text-medium-teal">
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                <line x1="2" y1="8" x2="22" y2="8"></line>
                <line x1="2" y1="16" x2="22" y2="16"></line>
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No segments defined</h4>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
              Add segments to break the video into logical parts for better organization and navigation.
            </p>
            <ActivityButton
              onClick={handleAddSegment}
              variant="primary"
              icon="plus"
              className="mt-2"
            >
              Add Your First Segment
            </ActivityButton>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          Interactive Markers
        </h3>

        <ActivityButton
          onClick={handleAddMarker}
          variant="secondary"
          icon="plus"
        >
          Add Marker
        </ActivityButton>
      </div>

      {localActivity.markers && localActivity.markers.length > 0 ? (
        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <select
              value={currentMarkerIndex}
              onChange={(e) => setCurrentMarkerIndex(parseInt(e.target.value))}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {localActivity.markers.map((marker, index) => (
                <option key={marker.id} value={index}>
                  Marker {index + 1}: {marker.title} ({marker.type})
                </option>
              ))}
            </select>

            <ActivityButton
              onClick={handleRemoveMarker}
              variant="danger"
              icon="trash"
            >
              Remove
            </ActivityButton>
          </div>

          <div className={cn("mb-4", { "marker-fade-in": newMarkerAdded })}>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Type</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <button
                type="button"
                onClick={() => updateMarker({ type: 'note' })}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                  currentMarker?.type === 'note'
                    ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                    : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                  "w-6 h-6 mb-1",
                  currentMarker?.type === 'note'
                    ? "text-primary-green dark:text-medium-teal"
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="text-sm font-medium">Note</span>
              </button>

              <button
                type="button"
                onClick={() => updateMarker({ type: 'question' })}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                  currentMarker?.type === 'question'
                    ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                    : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                  "w-6 h-6 mb-1",
                  currentMarker?.type === 'question'
                    ? "text-primary-green dark:text-medium-teal"
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <span className="text-sm font-medium">Question</span>
              </button>

              <button
                type="button"
                onClick={() => updateMarker({ type: 'link' })}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                  currentMarker?.type === 'link'
                    ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                    : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                  "w-6 h-6 mb-1",
                  currentMarker?.type === 'link'
                    ? "text-primary-green dark:text-medium-teal"
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <span className="text-sm font-medium">Link</span>
              </button>

              <button
                type="button"
                onClick={() => updateMarker({ type: 'bookmark' })}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md border transition-all",
                  currentMarker?.type === 'bookmark'
                    ? "border-primary-green bg-light-mint dark:bg-primary-green/20 dark:border-medium-teal"
                    : "border-gray-300 dark:border-gray-600 hover:border-primary-green hover:bg-light-mint/50 dark:hover:bg-primary-green/10"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(
                  "w-6 h-6 mb-1",
                  currentMarker?.type === 'bookmark'
                    ? "text-primary-green dark:text-medium-teal"
                    : "text-gray-600 dark:text-gray-400"
                )}>
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="text-sm font-medium">Bookmark</span>
              </button>
            </div>
          </div>

          <div className={cn("mb-4", { "marker-fade-in": newMarkerAdded })}>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
            <input
              type="text"
              value={currentMarker?.title || ''}
              onChange={(e) => updateMarker({ title: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter a descriptive title..."
            />
          </div>

          <div className={cn("mb-4", { "marker-fade-in": newMarkerAdded })}>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Time (seconds)</label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max={currentSource.type === 'youtube' ? 600 : 3600} // Default max 10 min for YouTube, 1 hour for others
                value={currentMarker?.time || 0}
                onChange={(e) => updateMarker({ time: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-green dark:bg-gray-700"
              />
              <input
                type="number"
                min="0"
                value={currentMarker?.time || 0}
                onChange={(e) => updateMarker({ time: parseInt(e.target.value) })}
                className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {Math.floor((currentMarker?.time || 0) / 60)}:{String((currentMarker?.time || 0) % 60).padStart(2, '0')}
            </div>
          </div>

          <div className={cn("mb-4", { "marker-fade-in": newMarkerAdded })}>
            <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Content</label>
            <textarea
              value={currentMarker?.content || ''}
              onChange={(e) => updateMarker({ content: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Enter content for this marker..."
            />
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {currentMarker?.type === 'note' && "Add notes that will appear at this timestamp"}
              {currentMarker?.type === 'question' && "Add a question for students to answer"}
              {currentMarker?.type === 'link' && "Add a URL or description for external resource"}
              {currentMarker?.type === 'bookmark' && "Add a description for this bookmark point"}
            </div>
          </div>

          <div className={cn("flex items-center p-2 border border-gray-200 dark:border-gray-700 rounded-md mt-2",
            { "marker-fade-in": newMarkerAdded })}>
            <input
              type="checkbox"
              id="markerRequired"
              checked={currentMarker?.required || false}
              onChange={(e) => updateMarker({ required: e.target.checked })}
              className="mr-2 h-4 w-4 accent-primary-green dark:accent-medium-teal"
            />
            <label htmlFor="markerRequired" className="text-gray-700 dark:text-gray-300 flex-1">
              Required for completion
            </label>
            <div className={cn("ml-2 px-2 py-1 text-xs font-medium rounded-full",
              currentMarker?.required
                ? "bg-primary-green text-white dark:bg-medium-teal"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300")}>
              {currentMarker?.required ? "Required" : "Optional"}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 rounded-full bg-light-mint dark:bg-primary-green/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary-green dark:text-medium-teal">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No markers defined</h4>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-4">
              Add interactive markers to create engagement points at specific timestamps in the video.
            </p>
            <ActivityButton
              onClick={handleAddMarker}
              variant="primary"
              icon="plus"
              className="mt-2"
            >
              Add Your First Marker
            </ActivityButton>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <ActivityButton
          onClick={handleSave}
          variant="primary"
          icon="save"
        >
          Save Activity
        </ActivityButton>
      </div>
    </ThemeWrapper>
  );
};

export default VideoEditor;
