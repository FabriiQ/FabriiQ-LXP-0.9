import React, { useState, useRef, useEffect } from 'react';

interface VideoRendererProps {
  src: string;
  title?: string;
  poster?: string;
  isPrintMode?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
}

export const VideoRenderer: React.FC<VideoRendererProps> = ({
  src,
  title = '',
  poster,
  isPrintMode = false,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
  className = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoaded(true);
    }
  };
  
  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  // Handle video error
  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };
  
  // Handle play/pause toggle
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = parseFloat(e.target.value);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Extract video ID from YouTube URL
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // Determine if this is a YouTube video
  const youtubeId = getYouTubeId(src);
  
  // For print mode, we'll show a thumbnail with a QR code or link
  if (isPrintMode) {
    return (
      <div className={`video-renderer print-mode ${className}`}>
        <div className="video-print-container">
          {poster ? (
            <img src={poster} alt={title || 'Video thumbnail'} className="video-thumbnail" />
          ) : (
            youtubeId ? (
              <img 
                src={`https://img.youtube.com/vi/${youtubeId}/0.jpg`} 
                alt={title || 'Video thumbnail'} 
                className="video-thumbnail" 
              />
            ) : (
              <div className="video-placeholder">Video: {title || src}</div>
            )
          )}
          
          <div className="video-link">
            <div className="link-label">Video URL:</div>
            <div className="link-url">{src}</div>
          </div>
        </div>
        
        {title && <div className="video-title">{title}</div>}
        
        <style jsx>{`
          .video-renderer.print-mode {
            break-inside: avoid;
            margin-bottom: 1rem;
            text-align: center;
          }
          
          .video-print-container {
            border: 1px solid #e2e8f0;
            border-radius: 0.25rem;
            overflow: hidden;
            background-color: #f8fafc;
          }
          
          .video-thumbnail {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
          }
          
          .video-placeholder {
            height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #e2e8f0;
            color: #475569;
            font-style: italic;
          }
          
          .video-link {
            padding: 0.5rem;
            font-size: 0.75rem;
            border-top: 1px solid #e2e8f0;
            text-align: left;
          }
          
          .link-label {
            font-weight: 600;
            margin-bottom: 0.25rem;
          }
          
          .link-url {
            word-break: break-all;
            color: #3b82f6;
          }
          
          .video-title {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            font-style: italic;
          }
        `}</style>
      </div>
    );
  }
  
  // For YouTube videos, use the embed iframe
  if (youtubeId) {
    return (
      <div className={`video-renderer youtube ${className}`}>
        <div className="video-container">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&controls=${controls ? 1 : 0}&loop=${loop ? 1 : 0}&mute=${muted ? 1 : 0}`}
            title={title || 'YouTube video player'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        
        {title && <div className="video-title">{title}</div>}
        
        <style jsx>{`
          .video-renderer {
            margin-bottom: 1rem;
          }
          
          .video-container {
            position: relative;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            height: 0;
            overflow: hidden;
            border-radius: 0.375rem;
          }
          
          .video-container iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 0.375rem;
          }
          
          .video-title {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: #475569;
          }
        `}</style>
      </div>
    );
  }
  
  // For direct video files, use the HTML5 video element with custom controls
  return (
    <div className={`video-renderer ${className}`}>
      <div className="video-container">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={false} // We'll use custom controls
          onLoadedMetadata={handleMetadataLoaded}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        
        {!isLoaded && !hasError && (
          <div className="video-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading video...</div>
          </div>
        )}
        
        {hasError && (
          <div className="video-error">
            <div className="error-icon">!</div>
            <div className="error-message">Failed to load video</div>
            <div className="error-details">{src}</div>
          </div>
        )}
        
        {controls && isLoaded && (
          <div className="video-controls">
            <button 
              className="play-pause-button" 
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            
            <div className="time-display current-time">{formatTime(currentTime)}</div>
            
            <input
              type="range"
              className="seek-bar"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
            />
            
            <div className="time-display duration">{formatTime(duration)}</div>
          </div>
        )}
      </div>
      
      {title && <div className="video-title">{title}</div>}
      
      <style jsx>{`
        .video-renderer {
          margin-bottom: 1rem;
        }
        
        .video-container {
          position: relative;
          border-radius: 0.375rem;
          overflow: hidden;
          background-color: #000;
        }
        
        video {
          width: 100%;
          display: block;
          border-radius: 0.375rem;
        }
        
        .video-loading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
          margin-bottom: 0.5rem;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .loading-text {
          font-size: 0.875rem;
        }
        
        .video-error {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 1rem;
        }
        
        .error-icon {
          font-size: 2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .error-message {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .error-details {
          font-size: 0.75rem;
          opacity: 0.8;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
        }
        
        .video-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          padding: 0.5rem;
          opacity: 0.8;
          transition: opacity 0.2s ease-in-out;
        }
        
        .video-container:hover .video-controls {
          opacity: 1;
        }
        
        .play-pause-button {
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.5rem;
        }
        
        .time-display {
          color: white;
          font-size: 0.75rem;
          font-family: monospace;
          margin: 0 0.5rem;
        }
        
        .seek-bar {
          flex: 1;
          height: 5px;
          -webkit-appearance: none;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 2.5px;
        }
        
        .seek-bar::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: white;
          cursor: pointer;
        }
        
        .seek-bar::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: white;
          cursor: pointer;
          border: none;
        }
        
        .video-title {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          color: #475569;
        }
      `}</style>
    </div>
  );
};
