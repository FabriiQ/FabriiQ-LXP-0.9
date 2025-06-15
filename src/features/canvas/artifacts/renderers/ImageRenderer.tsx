import React, { useState } from 'react';

interface ImageRendererProps {
  src: string;
  alt?: string;
  isPrintMode?: boolean;
  className?: string;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({
  src,
  alt = '',
  isPrintMode = false,
  className = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setHasError(true);
  };
  
  return (
    <div className={`image-renderer ${isPrintMode ? 'print-mode' : ''} ${className}`}>
      {!isLoaded && !hasError && (
        <div className="image-placeholder">
          <div className="loading-indicator">Loading image...</div>
        </div>
      )}
      
      {hasError && (
        <div className="image-error">
          <div className="error-message">Failed to load image</div>
          <div className="error-details">{src}</div>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`image ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'hidden' : ''}`}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {alt && !isPrintMode && (
        <div className="image-caption">{alt}</div>
      )}
      
      <style jsx>{`
        .image-renderer {
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .image-placeholder {
          background-color: #f1f5f9;
          border: 1px dashed #cbd5e1;
          border-radius: 0.25rem;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        
        .loading-indicator {
          color: #64748b;
          font-size: 0.875rem;
        }
        
        .image-error {
          background-color: #fee2e2;
          border: 1px dashed #fecaca;
          border-radius: 0.25rem;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }
        
        .error-message {
          color: #b91c1c;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        
        .error-details {
          color: #ef4444;
          font-size: 0.75rem;
          word-break: break-all;
          max-width: 100%;
        }
        
        .image {
          max-width: 100%;
          height: auto;
          border-radius: 0.25rem;
        }
        
        .loading {
          opacity: 0;
        }
        
        .loaded {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
        
        .hidden {
          display: none;
        }
        
        .image-caption {
          margin-top: 0.5rem;
          color: #64748b;
          font-size: 0.875rem;
          font-style: italic;
        }
        
        .print-mode .image {
          max-height: 300px;
        }
        
        @media print {
          .image-renderer {
            break-inside: avoid;
          }
          
          .image {
            max-height: 300px;
          }
          
          .image-caption {
            font-size: 9pt;
          }
        }
      `}</style>
    </div>
  );
};
