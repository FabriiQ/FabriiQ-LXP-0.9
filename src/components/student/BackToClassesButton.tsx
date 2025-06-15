'use client';

import { Button } from '@/components/ui/core/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/cn';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { useToast } from '@/components/ui/feedback/toast';

interface BackToClassesButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  label?: string;
  preserveHistory?: boolean;
  hapticFeedback?: boolean;
}

/**
 * BackToClassesButton - A consistent navigation element for returning to classes
 *
 * Features:
 * - Consistent positioning and styling across the application
 * - Haptic feedback on mobile devices
 * - View transitions for smooth navigation
 * - Toast notification for context changes
 * - Preserves history state for back button behavior
 */
export function BackToClassesButton({
  className,
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  showLabel = true,
  label = 'Back to Classes',
  preserveHistory = true,
  hapticFeedback = true
}: BackToClassesButtonProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = () => {
    // Show toast notification
    toast({
      description: 'Returning to classes view',
      variant: 'info',
      duration: 2000
    });

    // If preserving history, use router.back() if possible
    if (preserveHistory && window.history.length > 1) {
      router.back();
    } else {
      router.push('/student/classes');
    }
  };

  return (
    <div className={cn('flex items-center', className)}>
      {preserveHistory ? (
        <Button
          variant={variant}
          size={size}
          onClick={handleClick}
          className="flex items-center gap-1 touch-target"
          aria-label="Return to classes view"
        >
          {showIcon && <ChevronLeft className="h-4 w-4" />}
          {showLabel && <span>{label}</span>}
        </Button>
      ) : (
        <Button variant={variant} size={size} asChild className="touch-target">
          <ViewTransitionLink
            href="/student/classes"
            className="flex items-center gap-1"
            ariaLabel="Return to classes view"
            hapticFeedback={hapticFeedback}
          >
            {showIcon && <ChevronLeft className="h-4 w-4" />}
            {showLabel && <span>{label}</span>}
          </ViewTransitionLink>
        </Button>
      )}
    </div>
  );
}
