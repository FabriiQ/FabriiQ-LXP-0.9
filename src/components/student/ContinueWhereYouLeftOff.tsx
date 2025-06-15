'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Award, Calendar } from 'lucide-react';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { useRouter } from 'next/navigation';

interface RecentActivity {
  id: string;
  title: string;
  type: string;
  path: string;
  timestamp: number;
  classId: string;
  className: string;
  icon: 'activity' | 'leaderboard' | 'calendar' | 'dashboard';
}

/**
 * ContinueWhereYouLeftOff - A component that shows recent activities for quick access
 * 
 * Features:
 * - Tracks and displays recent user activities
 * - Provides quick access to continue where the user left off
 * - Leverages the Sunk Cost Effect for better engagement
 * - Uses localStorage for persistence between sessions
 */
export function ContinueWhereYouLeftOff() {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load recent activities from localStorage
  useEffect(() => {
    const loadRecentActivities = () => {
      try {
        const storedActivities = localStorage.getItem('recent_activities');
        if (storedActivities) {
          const parsedActivities = JSON.parse(storedActivities);
          // Sort by timestamp (most recent first) and limit to 3
          const sortedActivities = parsedActivities
            .sort((a: RecentActivity, b: RecentActivity) => b.timestamp - a.timestamp)
            .slice(0, 3);
          setRecentActivities(sortedActivities);
        }
      } catch (error) {
        console.error('Failed to load recent activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentActivities();
  }, []);

  // If no recent activities or still loading, don't render anything
  if (isLoading || recentActivities.length === 0) {
    return null;
  }

  // Get the most recent activity
  const mostRecent = recentActivities[0];

  // Get icon component based on activity type
  const getIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return <BookOpen className="h-5 w-5" />;
      case 'leaderboard':
        return <Award className="h-5 w-5" />;
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  // Format relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Convert to minutes, hours, days
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card className="w-full shadow-sm border-primary/10 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Continue where you left off</CardTitle>
        <CardDescription>
          Pick up right where you stopped
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {getIcon(mostRecent.icon)}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-medium text-sm truncate">{mostRecent.title}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {mostRecent.className} • {getRelativeTime(mostRecent.timestamp)}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="default" 
          className="w-full" 
          size="sm"
          asChild
        >
          <ViewTransitionLink
            href={mostRecent.path}
            ariaLabel={`Continue with ${mostRecent.title}`}
            hapticFeedback={true}
          >
            Continue
          </ViewTransitionLink>
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Track user activity for the "continue where you left off" feature
 * @param activity Activity details to track
 */
export function trackUserActivity(activity: Omit<RecentActivity, 'timestamp'>) {
  try {
    // Get existing activities
    const storedActivities = localStorage.getItem('recent_activities');
    const activities = storedActivities ? JSON.parse(storedActivities) : [];
    
    // Check if this activity already exists
    const existingIndex = activities.findIndex((a: RecentActivity) => 
      a.path === activity.path && a.id === activity.id
    );
    
    // If it exists, update the timestamp
    if (existingIndex >= 0) {
      activities[existingIndex].timestamp = Date.now();
    } else {
      // Otherwise add it
      activities.push({
        ...activity,
        timestamp: Date.now()
      });
    }
    
    // Keep only the most recent 10 activities
    const limitedActivities = activities
      .sort((a: RecentActivity, b: RecentActivity) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('recent_activities', JSON.stringify(limitedActivities));
  } catch (error) {
    console.error('Failed to track user activity:', error);
  }
}
