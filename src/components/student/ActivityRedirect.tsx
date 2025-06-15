'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/components/ui/feedback/toast';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ActivityRedirectProps {
  classId: string;
  className?: string;
  delay?: number;
  autoRedirect?: boolean;
}

/**
 * ActivityRedirect - A component that redirects from old activity paths to class-specific ones
 * 
 * Features:
 * - Detects old activity paths and redirects to class-specific ones
 * - Shows a loading indicator during redirect
 * - Provides a manual redirect option if auto-redirect is disabled
 * - Shows toast notifications for context changes
 */
export function ActivityRedirect({
  classId,
  className,
  delay = 3000,
  autoRedirect = true
}: ActivityRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [redirecting, setRedirecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(delay / 1000);

  // Check if we're on an old activity path
  const isOldActivityPath = pathname.startsWith('/student/activities') || 
                           pathname.startsWith('/activities');

  // Extract activity ID if present in the path
  const activityIdMatch = pathname.match(/\/activities\/([^\/]+)/);
  const activityId = activityIdMatch ? activityIdMatch[1] : null;

  // Construct the new path
  const newPath = activityId 
    ? `/student/class/${classId}/activities/${activityId}`
    : `/student/class/${classId}/activities`;

  // Handle redirect
  useEffect(() => {
    if (!isOldActivityPath || !classId) return;

    if (autoRedirect) {
      // Show toast notification
      toast({
        title: 'Redirecting',
        description: `Taking you to your ${className || 'class'} activities`,
        variant: 'info',
        duration: delay
      });

      // Start countdown
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setRedirecting(true);
            
            // Redirect after a short delay to allow the UI to update
            setTimeout(() => {
              router.push(newPath);
            }, 100);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOldActivityPath, classId, className, autoRedirect, delay, router, newPath, toast]);

  // If not on an old activity path, don't render anything
  if (!isOldActivityPath) {
    return null;
  }

  // If redirecting, show loading indicator
  if (redirecting) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <LoadingIndicator 
          show={true} 
          type="spinner" 
          position="center" 
          message={`Redirecting to ${className || 'class'} activities...`} 
        />
      </div>
    );
  }

  // If auto-redirect is disabled, show a card with a manual redirect button
  if (!autoRedirect) {
    return (
      <div className="container mx-auto py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Activities Have Moved</CardTitle>
            <CardDescription>
              Activities are now organized by class for better navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We've updated the student portal to organize activities by class, making it easier to find what you need.
            </p>
            <p className="text-sm font-medium">
              Would you like to view activities for {className || 'your class'}?
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => {
                setRedirecting(true);
                router.push(newPath);
              }}
              className="w-full"
            >
              Go to Class Activities
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If auto-redirecting, show a countdown
  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Redirecting...</CardTitle>
          <CardDescription>
            Taking you to your {className || 'class'} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We've updated the student portal to organize activities by class, making it easier to find what you need.
          </p>
          <div className="w-full bg-muted rounded-full h-2.5 mb-2">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-1000" 
              style={{ width: `${100 - (timeLeft / (delay / 1000)) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-right text-muted-foreground">
            Redirecting in {timeLeft} seconds...
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/student/classes')}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setRedirecting(true);
              router.push(newPath);
            }}
          >
            Go Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
