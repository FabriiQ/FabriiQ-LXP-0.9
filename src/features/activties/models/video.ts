'use client';

/**
 * Video Activity Models
 *
 * This file contains the data models for video activities.
 * These models are designed to be:
 * 1. AI-native - Easy for AI to generate
 * 2. Simple - Minimal complexity
 * 3. Consistent - Follow the same patterns as other activity types
 * 4. Extensible - Easy to add new features
 * 5. Accessible - Designed with accessibility in mind
 */

import { BaseActivity, ActivitySettings, generateId } from './base';

/**
 * Video Source Type
 * Represents the different types of video sources
 */
export type VideoSourceType = 'youtube' | 'vimeo' | 'direct' | 'upload';

/**
 * Video Source Interface
 * Represents a video source in a video activity
 */
export interface VideoSource {
  id: string;
  type: VideoSourceType;
  url: string;
  title?: string;
  description?: string;
  duration?: number; // in seconds
  thumbnail?: string;
  captions?: {
    language: string;
    label: string;
    url: string;
  }[];
}

/**
 * Video Segment Interface
 * Represents a segment in a video
 */
export interface VideoSegment {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  description?: string;
  required?: boolean;
}

/**
 * Interactive Marker Interface
 * Represents an interactive marker in a video
 */
export interface InteractiveMarker {
  id: string;
  type: 'note' | 'question' | 'link' | 'bookmark';
  time: number; // in seconds
  title: string;
  content: string;
  required?: boolean;
  options?: {
    id: string;
    text: string;
    isCorrect?: boolean;
  }[];
}

/**
 * Video Activity Interface
 * Represents a complete video activity
 */
export interface VideoActivity extends BaseActivity {
  activityType: 'video';
  videoSources: VideoSource[];
  segments?: VideoSegment[];
  markers?: InteractiveMarker[];
  settings?: ActivitySettings & {
    allowSkip?: boolean;
    requireCompletion?: boolean;
    showProgressBar?: boolean;
    trackWatchTime?: boolean;
    trackSegments?: boolean;
    autoMarkComplete?: boolean;
    completionThreshold?: number; // percentage of video watched
    defaultPlaybackSpeed?: number;
    allowPlaybackSpeedControl?: boolean;
    allowFullscreen?: boolean;
    autoplay?: boolean;
    loop?: boolean;
    startTime?: number;
    showCaptions?: boolean;
    showTranscript?: boolean;
    showNotes?: boolean;
    allowUploads?: boolean;
    maxUploadSize?: number; // in bytes
    allowedFileTypes?: string[];
    allowYouTube?: boolean;
    youTubePrivacy?: boolean;
  };
}

/**
 * Create a default video source
 * Used for adding new video sources to an activity
 */
export function createDefaultVideoSource(): VideoSource {
  return {
    id: generateId(),
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Default to a sample YouTube video
    title: 'Sample Video'
  };
}

/**
 * Create a default video segment
 * Used for adding new segments to a video
 */
export function createDefaultVideoSegment(): VideoSegment {
  return {
    id: generateId(),
    title: 'Introduction',
    startTime: 0,
    endTime: 60,
    description: 'Introduction to the topic',
    required: true
  };
}

/**
 * Create a default interactive marker
 * Used for adding new markers to a video
 */
export function createDefaultInteractiveMarker(): InteractiveMarker {
  return {
    id: generateId(),
    type: 'note',
    time: 30,
    title: 'Important Note',
    content: 'This is an important point in the video.',
    required: false
  };
}

/**
 * Create a default video activity
 * Used for initializing new activities
 */
export function createDefaultVideoActivity(): VideoActivity {
  return {
    id: generateId(),
    title: 'New Video Activity',
    description: 'A video activity with interactive elements',
    instructions: 'Watch the video and complete all required segments.',
    activityType: 'video',
    videoSources: [createDefaultVideoSource()],
    segments: [createDefaultVideoSegment()],
    markers: [createDefaultInteractiveMarker()],
    settings: {
      allowSkip: false,
      requireCompletion: true,
      showProgressBar: true,
      trackWatchTime: true,
      trackSegments: true,
      autoMarkComplete: true,
      completionThreshold: 90,
      defaultPlaybackSpeed: 1,
      allowPlaybackSpeedControl: true,
      allowFullscreen: true,
      autoplay: false,
      loop: false,
      startTime: 0,
      showCaptions: true,
      showTranscript: true,
      showNotes: true,
      allowUploads: true,
      maxUploadSize: 100 * 1024 * 1024, // 100MB
      allowedFileTypes: ['mp4', 'webm', 'ogg'],
      allowYouTube: true,
      youTubePrivacy: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Extract YouTube video ID from URL
 * 
 * @param url YouTube URL
 * @returns YouTube video ID or null if not found
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Match YouTube URL patterns
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Generate YouTube embed URL
 * 
 * @param videoId YouTube video ID
 * @param options Options for the embed URL
 * @returns YouTube embed URL
 */
export function generateYouTubeEmbedUrl(
  videoId: string,
  options: {
    startTime?: number;
    endTime?: number;
    autoplay?: boolean;
    loop?: boolean;
    controls?: boolean;
    privacy?: boolean;
  } = {}
): string {
  const {
    startTime = 0,
    endTime,
    autoplay = false,
    loop = false,
    controls = true,
    privacy = true
  } = options;
  
  const baseUrl = privacy
    ? 'https://www.youtube-nocookie.com/embed/'
    : 'https://www.youtube.com/embed/';
  
  let url = `${baseUrl}${videoId}?`;
  
  // Add parameters
  const params: Record<string, string> = {
    start: startTime.toString(),
    autoplay: autoplay ? '1' : '0',
    loop: loop ? '1' : '0',
    controls: controls ? '1' : '0',
    rel: '0', // Don't show related videos
    modestbranding: '1' // Hide YouTube logo
  };
  
  if (endTime) {
    params.end = endTime.toString();
  }
  
  if (loop) {
    params.playlist = videoId;
  }
  
  // Convert params to URL query string
  url += Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return url;
}

/**
 * Format video duration in MM:SS format
 * 
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatVideoDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate video progress percentage
 * 
 * @param currentTime Current playback time in seconds
 * @param duration Total video duration in seconds
 * @returns Progress percentage (0-100)
 */
export function calculateVideoProgress(currentTime: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.min(Math.round((currentTime / duration) * 100), 100);
}
