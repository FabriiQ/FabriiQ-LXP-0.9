'use client';

/**
 * Video Activity AI Converter
 *
 * This file contains functions for converting AI-generated content to video activities.
 */

import { VideoActivity, VideoSource, VideoSegment, InteractiveMarker, extractYouTubeVideoId } from '../models/video';
import { generateId } from '../models/base';

/**
 * Convert AI-generated content to a video activity
 *
 * @param aiContent AI-generated content
 * @returns Video activity
 */
export function convertAIContentToVideoActivity(aiContent: any): VideoActivity {
  // Start with a default activity
  const activity: VideoActivity = {
    id: aiContent.id || generateId(),
    title: aiContent.title || 'AI Generated Video Activity',
    description: aiContent.description || '',
    instructions: aiContent.instructions || 'Watch the video and complete all required segments.',
    activityType: 'video',
    videoSources: [],
    isGradable: false, // Video activities are not gradable by default
    createdAt: new Date(),
    updatedAt: new Date(),
    settings: {
      allowSkip: aiContent.allowSkip ?? false,
      requireCompletion: aiContent.requireCompletion ?? true,
      showProgressBar: aiContent.showProgressBar ?? true,
      trackWatchTime: aiContent.trackWatchTime ?? true,
      trackSegments: aiContent.trackSegments ?? true,
      autoMarkComplete: aiContent.autoMarkComplete ?? true,
      completionThreshold: aiContent.completionThreshold ?? 90,
      defaultPlaybackSpeed: aiContent.defaultPlaybackSpeed ?? 1,
      allowPlaybackSpeedControl: aiContent.allowPlaybackSpeedControl ?? true,
      allowFullscreen: aiContent.allowFullscreen ?? true,
      autoplay: aiContent.autoplay ?? false,
      loop: aiContent.loop ?? false,
      startTime: aiContent.startTime ?? 0,
      showCaptions: aiContent.showCaptions ?? true,
      showTranscript: aiContent.showTranscript ?? true,
      showNotes: aiContent.showNotes ?? true
    }
  };

  // Find video sources in the AI content
  const aiVideoSources = aiContent.videoSources || 
                        aiContent.videos || 
                        aiContent.sources || 
                        aiContent.content?.videoSources || 
                        [];

  // If a single video URL is provided
  if (aiContent.videoUrl || aiContent.url) {
    const url = aiContent.videoUrl || aiContent.url;
    const type = determineVideoType(url);
    
    activity.videoSources.push({
      id: generateId(),
      type,
      url,
      title: aiContent.videoTitle || 'Main Video'
    });
  } 
  // If YouTube video ID is provided
  else if (aiContent.youtubeId || aiContent.videoId) {
    const videoId = aiContent.youtubeId || aiContent.videoId;
    
    activity.videoSources.push({
      id: generateId(),
      type: 'youtube',
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: aiContent.videoTitle || 'YouTube Video'
    });
  }
  // Process array of video sources
  else if (aiVideoSources.length > 0) {
    activity.videoSources = aiVideoSources.map((source: any) => {
      // Handle different formats of source data
      let url = '';
      let type: 'youtube' | 'vimeo' | 'direct' | 'upload' = 'direct';
      
      if (typeof source === 'string') {
        // Simple string URL
        url = source;
        type = determineVideoType(url);
      } else {
        // Object with properties
        url = source.url || source.videoUrl || '';
        type = source.type || determineVideoType(url);
      }
      
      return {
        id: source.id || generateId(),
        type,
        url,
        title: source.title || '',
        description: source.description || '',
        duration: source.duration || undefined,
        thumbnail: source.thumbnail || undefined,
        captions: source.captions || undefined
      };
    });
  }

  // If no sources were found, add a default one
  if (activity.videoSources.length === 0) {
    activity.videoSources.push({
      id: generateId(),
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Default to a sample YouTube video
      title: 'Sample Video'
    });
  }

  // Find segments in the AI content
  const aiSegments = aiContent.segments || 
                    aiContent.videoSegments || 
                    aiContent.content?.segments || 
                    [];

  if (aiSegments.length > 0) {
    activity.segments = aiSegments.map((segment: any) => {
      return {
        id: segment.id || generateId(),
        title: segment.title || 'Untitled Segment',
        startTime: segment.startTime || segment.start || 0,
        endTime: segment.endTime || segment.end || 60,
        description: segment.description || '',
        required: segment.required !== undefined ? segment.required : true
      };
    });
  }

  // Find markers in the AI content
  const aiMarkers = aiContent.markers || 
                   aiContent.interactiveMarkers || 
                   aiContent.content?.markers || 
                   [];

  if (aiMarkers.length > 0) {
    activity.markers = aiMarkers.map((marker: any) => {
      return {
        id: marker.id || generateId(),
        type: marker.type || 'note',
        time: marker.time || marker.timestamp || 0,
        title: marker.title || 'Untitled Marker',
        content: marker.content || marker.text || '',
        required: marker.required !== undefined ? marker.required : false,
        options: marker.options || undefined
      };
    });
  }

  return activity;
}

/**
 * Determine video type from URL
 * 
 * @param url Video URL
 * @returns Video type
 */
function determineVideoType(url: string): 'youtube' | 'vimeo' | 'direct' | 'upload' {
  if (!url) return 'direct';
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  } else if (url.includes('vimeo.com')) {
    return 'vimeo';
  } else {
    return 'direct';
  }
}
