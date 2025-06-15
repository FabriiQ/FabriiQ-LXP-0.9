'use client';

import React, { useState, useEffect, useRef } from 'react';
import { VideoActivity, extractYouTubeVideoId, generateYouTubeEmbedUrl, formatVideoDuration, calculateVideoProgress } from '../../models/video';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';

export interface VideoViewerProps {
  activity: VideoActivity;
  mode?: 'student' | 'teacher';
  onComplete?: (result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Video Activity Viewer
 *
 * This component displays a video activity with:
 * - Multiple video sources
 * - Interactive markers
 * - Progress tracking
 * - Playback controls
 * - Accessibility features
 */
export const VideoViewer: React.FC<VideoViewerProps> = ({
  activity,
  // mode is defined in the interface but not used in this component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mode = 'student',
  onComplete,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking video playback
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(activity.settings?.startTime || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(activity.settings?.defaultPlaybackSpeed || 1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(activity.settings?.showCaptions !== false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [activeMarkers, setActiveMarkers] = useState<string[]>([]);
  const [completedSegments, setCompletedSegments] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const watchTimeRef = useRef(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Ensure videoSources exists with a default if not provided
  const videoSources = activity.videoSources || [];

  // Default video source
  const defaultSource = {
    id: 'default',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Video',
    captions: []
  };

  // Handle content from activity if it's passed in a different format
  if ((activity as any).content) {
    const content = (activity as any).content;
    if (content.videoUrl) defaultSource.url = content.videoUrl;
    if (content.videoTitle) defaultSource.title = content.videoTitle;
  }

  // Current video source with fallback
  const currentSource = videoSources[currentSourceIndex] || videoSources[0] || defaultSource;

  // YouTube video ID
  const youtubeVideoId = currentSource.type === 'youtube' ? extractYouTubeVideoId(currentSource.url) : null;

  // Track video progress
  useEffect(() => {
    if (!isPlaying) return;

    // Start tracking interval
    trackingIntervalRef.current = setInterval(() => {
      // Increment watch time
      watchTimeRef.current += 1;

      // Check for active markers
      if (activity.markers) {
        const newActiveMarkers = activity.markers
          .filter(marker => {
            const markerTime = marker.time;
            return Math.abs(currentTime - markerTime) < 1; // Within 1 second
          })
          .map(marker => marker.id);

        if (newActiveMarkers.length > 0) {
          setActiveMarkers(newActiveMarkers);

          // Track marker interaction in analytics
          newActiveMarkers.forEach(markerId => {
            const marker = activity.markers?.find(m => m.id === markerId);
            if (marker) {
              analytics?.trackInteraction('marker_triggered', {
                activityId: activity.id,
                markerId: marker.id,
                markerType: marker.type,
                markerTitle: marker.title,
                videoTime: currentTime
              });
            }
          });
        }
      }

      // Check for completed segments
      if (activity.segments) {
        const newCompletedSegments = { ...completedSegments };
        let segmentsUpdated = false;

        activity.segments.forEach(segment => {
          if (!completedSegments[segment.id] &&
              currentTime >= segment.endTime) {
            newCompletedSegments[segment.id] = true;
            segmentsUpdated = true;

            // Track segment completion in analytics
            analytics?.trackInteraction('segment_completed', {
              activityId: activity.id,
              segmentId: segment.id,
              segmentTitle: segment.title
            });
          }
        });

        if (segmentsUpdated) {
          setCompletedSegments(newCompletedSegments);
        }
      }

      // Calculate overall progress
      const newProgress = calculateVideoProgress(currentTime, duration);
      setProgress(newProgress);

      if (onProgress) {
        onProgress(newProgress);
      }

      // Check if video is completed
      const completionThreshold = activity.settings?.completionThreshold || 90;
      const isVideoCompleted = newProgress >= completionThreshold;

      if (isVideoCompleted && !isCompleted && activity.settings?.autoMarkComplete !== false) {
        handleVideoComplete();
      }
    }, 1000);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, activity, completedSegments, isCompleted, onProgress, analytics]);

  // Handle video complete
  const handleVideoComplete = () => {
    if (isCompleted) return;

    setIsCompleted(true);

    // Track completion in analytics
    analytics?.trackEvent('activity_complete', {
      activityId: activity.id,
      activityType: activity.activityType,
      watchTime: watchTimeRef.current,
      progress
    });

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete({
        completed: true,
        watchTime: watchTimeRef.current,
        progress,
        completedSegments
      });
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);

      // Track the interaction in analytics
      analytics?.trackInteraction(isPlaying ? 'video_pause' : 'video_play', {
        activityId: activity.id,
        videoTime: currentTime
      });
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle duration change
  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);

    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('video_seek', {
      activityId: activity.id,
      fromTime: currentTime,
      toTime: newTime
    });
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);

      // Track the interaction in analytics
      analytics?.trackInteraction('video_mute_toggle', {
        activityId: activity.id,
        muted: newMuted
      });
    }
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);

      // Track the interaction in analytics
      analytics?.trackInteraction('playback_rate_change', {
        activityId: activity.id,
        rate
      });
    }
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('fullscreen_toggle', {
      activityId: activity.id,
      fullscreen: !isFullscreen
    });
  };

  // Handle source change
  const handleSourceChange = (index: number) => {
    if (index < 0 || index >= videoSources.length) return;

    setCurrentSourceIndex(index);
    setCurrentTime(activity.settings?.startTime || 0);
    setIsPlaying(false);

    // Track the interaction in analytics
    analytics?.trackInteraction('source_change', {
      activityId: activity.id,
      fromSource: currentSource.id,
      toSource: videoSources[index].id
    });
  };

  // Handle captions toggle
  const handleCaptionsToggle = () => {
    setShowCaptions(!showCaptions);

    // Track the interaction in analytics
    analytics?.trackInteraction('captions_toggle', {
      activityId: activity.id,
      captions: !showCaptions
    });
  };

  // Handle transcript toggle
  const handleTranscriptToggle = () => {
    setShowTranscript(!showTranscript);

    // Track the interaction in analytics
    analytics?.trackInteraction('transcript_toggle', {
      activityId: activity.id,
      transcript: !showTranscript
    });
  };

  // Handle notes toggle
  const handleNotesToggle = () => {
    setShowNotes(!showNotes);

    // Track the interaction in analytics
    analytics?.trackInteraction('notes_toggle', {
      activityId: activity.id,
      notes: !showNotes
    });
  };

  // Render YouTube video
  const renderYouTubeVideo = () => {
    if (!youtubeVideoId) return null;

    const embedUrl = generateYouTubeEmbedUrl(youtubeVideoId, {
      startTime: activity.settings?.startTime || 0,
      autoplay: activity.settings?.autoplay || false,
      loop: activity.settings?.loop || false,
      controls: activity.settings?.allowSkip !== false,
      privacy: activity.settings?.youTubePrivacy !== false
    });

    return (
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        style={{ border: 0 }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={currentSource.title || 'Video'}
        className="w-full h-full"
      />
    );
  };

  // Render direct video
  const renderDirectVideo = () => {
    return (
      <video
        ref={videoRef}
        src={currentSource.url}
        className="w-full h-full"
        controls={activity.settings?.allowSkip !== false}
        autoPlay={activity.settings?.autoplay || false}
        loop={activity.settings?.loop || false}
        muted={isMuted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (activity.settings?.autoMarkComplete !== false) {
            handleVideoComplete();
          }
        }}
      >
        {currentSource.captions?.map(caption => (
          <track
            key={caption.language}
            kind="subtitles"
            src={caption.url}
            srcLang={caption.language}
            label={caption.label}
            default={showCaptions}
          />
        ))}
      </video>
    );
  };

  // Render video player
  const renderVideoPlayer = () => {
    if (currentSource.type === 'youtube') {
      return renderYouTubeVideo();
    } else {
      return renderDirectVideo();
    }
  };

  // Render custom controls
  const renderCustomControls = () => {
    if (currentSource.type === 'youtube') return null; // YouTube has its own controls

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 flex flex-wrap items-center gap-2 text-white">
        {/* Play/Pause button */}
        <button
          onClick={handlePlayPause}
          className="p-2 rounded hover:bg-primary-green/70 min-h-[44px] min-w-[44px]"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸️" : "▶️"}
        </button>

        {/* Time display */}
        <div className="text-sm">
          {formatVideoDuration(currentTime)} / {formatVideoDuration(duration)}
        </div>

        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-grow h-3 accent-primary-green"
          aria-label="Video progress"
        />

        {/* Volume control */}
        <button
          onClick={handleMuteToggle}
          className="p-2 rounded hover:bg-primary-green/70 min-h-[44px] min-w-[44px]"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={volume}
          onChange={handleVolumeChange}
          className="w-20 h-3 accent-primary-green"
          aria-label="Volume"
        />

        {/* Playback rate */}
        {activity.settings?.allowPlaybackSpeedControl !== false && (
          <div className="relative group">
            <button
              className="p-2 rounded hover:bg-primary-green/70 min-h-[44px] min-w-[44px]"
              aria-label="Playback speed"
            >
              {playbackRate}x
            </button>

            <div className="absolute bottom-full right-0 hidden group-hover:block bg-black/90 p-1 rounded">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={cn(
                    "block w-full text-left px-2 py-1 rounded",
                    playbackRate === rate ? "bg-primary-green" : "hover:bg-gray-700"
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Captions toggle */}
        {currentSource.captions && currentSource.captions.length > 0 && (
          <button
            onClick={handleCaptionsToggle}
            className={cn(
              "p-2 rounded hover:bg-primary-green/70 min-h-[44px] min-w-[44px]",
              showCaptions ? "bg-primary-green" : ""
            )}
            aria-label={showCaptions ? "Hide captions" : "Show captions"}
          >
            CC
          </button>
        )}

        {/* Fullscreen toggle */}
        {activity.settings?.allowFullscreen !== false && (
          <button
            onClick={handleFullscreenToggle}
            className="p-2 rounded hover:bg-primary-green/70 min-h-[44px] min-w-[44px]"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? "⤓" : "⤢"}
          </button>
        )}
      </div>
    );
  };

  // Render segments
  const renderSegments = () => {
    if (!activity.segments || activity.segments.length === 0) return null;

    return (
      <div className="mt-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h2 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
          Video Segments
        </h2>

        <div className="space-y-2">
          {activity.segments.map(segment => (
            <div
              key={segment.id}
              className={cn(
                "p-3 border rounded-lg transition-all",
                completedSegments[segment.id]
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-300 dark:border-gray-700"
              )}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {segment.title}
                  {segment.required && (
                    <span className="ml-2 text-red-500 dark:text-red-400">*</span>
                  )}
                </h3>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatVideoDuration(segment.startTime)} - {formatVideoDuration(segment.endTime)}
                </div>
              </div>

              {segment.description && (
                <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                  {segment.description}
                </p>
              )}

              {completedSegments[segment.id] && (
                <div className="mt-2 text-green-600 dark:text-green-400 text-sm flex items-center">
                  <span className="mr-1">✓</span> Completed
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render markers
  const renderMarkers = () => {
    if (!activity.markers || activity.markers.length === 0) return null;

    return (
      <div className="mt-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        <h2 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
          Interactive Markers
        </h2>

        <div className="space-y-2">
          {activity.markers.map(marker => (
            <div
              key={marker.id}
              className={cn(
                "p-3 border rounded-lg transition-all",
                activeMarkers.includes(marker.id)
                  ? "border-primary-green bg-light-mint dark:bg-primary-green/20 animate-pulse"
                  : "border-gray-300 dark:border-gray-700"
              )}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {marker.title}
                  {marker.required && (
                    <span className="ml-2 text-red-500 dark:text-red-400">*</span>
                  )}
                </h3>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatVideoDuration(marker.time)}
                </div>
              </div>

              <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                {marker.content}
              </p>

              {marker.type === 'question' && marker.options && (
                <div className="mt-2 space-y-1">
                  {marker.options.map(option => (
                    <div
                      key={option.id}
                      className="p-2 border border-gray-200 dark:border-gray-700 rounded"
                    >
                      {option.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Activity header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{activity.title}</h1>
        {activity.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-2">{activity.description}</p>
        )}
        {activity.instructions && (
          <div className="bg-light-mint dark:bg-primary-green/20 p-3 rounded border border-medium-teal/50 dark:border-medium-teal/30">
            <strong className="text-primary-green dark:text-medium-teal">Instructions:</strong>
            <span className="text-gray-700 dark:text-gray-200"> {activity.instructions}</span>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      {activity.settings?.showProgressBar !== false && (
        <div className="mb-4">
          <ProgressIndicator
            current={progress}
            total={100}
            showPercentage
          />
        </div>
      )}

      {/* Video player */}
      <div
        ref={containerRef}
        className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4"
      >
        {renderVideoPlayer()}
        {renderCustomControls()}
      </div>

      {/* Video sources */}
      {videoSources.length > 1 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
            Video Sources
          </h2>

          <div className="flex flex-wrap gap-2">
            {videoSources.map((source, index) => (
              <button
                key={source.id}
                onClick={() => handleSourceChange(index)}
                className={cn(
                  "px-3 py-2 rounded border",
                  index === currentSourceIndex
                    ? "bg-light-mint border-primary-green dark:bg-primary-green/20 dark:border-medium-teal"
                    : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                )}
              >
                {source.title || `Source ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Video controls */}
      <div className="mb-6 flex flex-wrap gap-2">
        {activity.settings?.showTranscript !== false && (
          <button
            onClick={handleTranscriptToggle}
            className={cn(
              "px-3 py-2 rounded border",
              showTranscript
                ? "bg-light-mint border-primary-green dark:bg-primary-green/20 dark:border-medium-teal"
                : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
            )}
          >
            {showTranscript ? "Hide Transcript" : "Show Transcript"}
          </button>
        )}

        {activity.settings?.showNotes !== false && (
          <button
            onClick={handleNotesToggle}
            className={cn(
              "px-3 py-2 rounded border",
              showNotes
                ? "bg-light-mint border-primary-green dark:bg-primary-green/20 dark:border-medium-teal"
                : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
            )}
          >
            {showNotes ? "Hide Notes" : "Show Notes"}
          </button>
        )}
      </div>

      {/* Transcript */}
      {showTranscript && currentSource.captions && (
        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <h2 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
            Transcript
          </h2>

          <div className="max-h-60 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <p className="text-gray-700 dark:text-gray-300">
              Transcript content would appear here if available.
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {showNotes && (
        <div className="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <h2 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
            Notes
          </h2>

          <textarea
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={4}
            placeholder="Take notes here..."
          />
        </div>
      )}

      {/* Segments */}
      {renderSegments()}

      {/* Markers */}
      {renderMarkers()}

      {/* Completion status or button */}
      {isCompleted ? (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h2 className="text-lg font-medium text-green-800 dark:text-green-300">
            Video Completed
          </h2>
          <p className="text-green-700 dark:text-green-400">
            You have successfully completed this video activity.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex justify-center">
          {submitButton ? (
            // Use the universal submit button if provided
            React.cloneElement(submitButton as React.ReactElement, {
              onClick: handleVideoComplete,
              disabled: false,
              loading: false,
              submitted: false,
              className: "min-w-[180px]",
              children: 'Mark as Completed'
            })
          ) : (
            // Fallback to ActivityButton if no universal button provided
            <button
              onClick={handleVideoComplete}
              className="px-4 py-2 bg-primary-green hover:bg-primary-green/90 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px] min-w-[180px]"
            >
              Mark as Completed
            </button>
          )}
        </div>
      )}
    </ThemeWrapper>
  );
};

export default VideoViewer;
