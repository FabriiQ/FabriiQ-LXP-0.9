'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';
import LottieAnimation from '@/components/ui/loading/LottieAnimation';
import AivyLottieAnimation from '@/components/ui/loading/AivyLottieAnimation';

interface LoadingIndicatorProps {
  /**
   * Show the loading indicator
   */
  show?: boolean;
  /**
   * Message to display
   */
  message?: string;
  /**
   * Position of the loading indicator
   */
  position?: 'top' | 'center' | 'bottom';
  /**
   * Type of loading indicator
   */
  type?: 'bar' | 'spinner' | 'dots';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Auto-hide after specified milliseconds
   */
  autoHideAfter?: number;
}

/**
 * LoadingIndicator - A subtle loading indicator for page transitions
 *
 * Features:
 * - Multiple indicator types (bar, spinner, dots)
 * - Customizable positioning
 * - Auto-hide functionality
 * - Smooth animations for reduced cognitive load
 * - Respects reduced motion preferences
 */
export function LoadingIndicator({
  show = true,
  message,
  position = 'top',
  type = 'bar',
  className,
  autoHideAfter
}: LoadingIndicatorProps) {
  const [visible, setVisible] = useState(show);

  // Handle auto-hide
  useEffect(() => {
    setVisible(show);

    if (show && autoHideAfter) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideAfter);

      return () => clearTimeout(timer);
    }
  }, [show, autoHideAfter]);

  // Position classes
  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    center: 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50'
  };

  // Render different indicator types
  const renderIndicator = () => {
    switch (type) {
      case 'bar':
        return (
          <div
            className={cn(
              'h-1 bg-primary/80 animate-progress',
              positionClasses[position],
              className
            )}
          />
        );
      case 'spinner':
        return (
          <div
            className={cn(
              'flex items-center justify-center bg-background/80 backdrop-blur-sm p-3 rounded-lg shadow-md',
              positionClasses[position],
              position === 'center' ? 'w-auto' : 'w-full',
              className
            )}
          >
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            {message && <span className="text-sm font-medium">{message}</span>}
          </div>
        );
      case 'dots':
        return (
          <div
            className={cn(
              'flex items-center justify-center space-x-1',
              positionClasses[position],
              position === 'center' ? 'w-auto' : 'w-full',
              className
            )}
          >
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            {message && <span className="ml-2 text-sm font-medium">{message}</span>}
          </div>
        );
      default:
        return null;
    }
  };

  if (!visible) return null;

  return renderIndicator();
}

// Add a global loading indicator that can be controlled from anywhere
let showGlobalLoadingCallback: ((show: boolean, message?: string) => void) | null = null;

export function GlobalLoadingIndicator() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [isViewTransition, setIsViewTransition] = useState(false);
  const [useLottie, setUseLottie] = useState(true);

  // Check for view transitions
  useEffect(() => {
    const checkForViewTransition = () => {
      const isTransitioning = document.documentElement.classList.contains('page-transitioning');
      const isClassNavigation = document.documentElement.classList.contains('class-navigation');

      // Show loading indicator during class navigation transitions
      if (isTransitioning && isClassNavigation && !show) {
        setShow(true);
        setMessage('Loading class data...');
        setIsViewTransition(true);
      } else if (!isTransitioning && isViewTransition) {
        // Hide loading indicator when transition ends
        setShow(false);
        setMessage(undefined);
        setIsViewTransition(false);
      }
    };

    // Check initially
    checkForViewTransition();

    // Set up mutation observer to detect class changes on documentElement
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkForViewTransition();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  }, [show, isViewTransition]);

  // Register the callback
  useEffect(() => {
    showGlobalLoadingCallback = (show: boolean, message?: string) => {
      // Don't override view transition loading
      if (!isViewTransition) {
        setShow(show);
        setMessage(message);
      }
    };

    return () => {
      showGlobalLoadingCallback = null;
    };
  }, [isViewTransition]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center p-6 rounded-lg">
        {useLottie ? (
          <div className="w-40 h-40">
            <AivyLottieAnimation />
            <div className="text-center text-sm mt-2 text-muted-foreground">
              Loading...
            </div>
          </div>
        ) : (
          <LoadingIndicator show={show} message={message} type="spinner" position="center" />
        )}
        {message && (
          <p className="mt-4 text-center text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
}

// Function to show/hide the global loading indicator
export function showGlobalLoading(show: boolean, message?: string) {
  if (showGlobalLoadingCallback) {
    showGlobalLoadingCallback(show, message);
  }
}
