# Student Portal Revamp Plan

## Overview

This document outlines the plan to revamp the student portal with the following key improvements:
1. Implement Next.js View Transitions API for smooth page transitions
2. Restructure the portal to provide class-wise views instead of mixed content
3. Create a bottom navigation bar instead of a sidebar menu
4. Implement a streamlined class dashboard with icons and figures
5. Enhance the UI with micro-interactions and animations

## Current Architecture Analysis

### Current Structure

The current student portal follows this structure:
- `/student/dashboard` - Main dashboard with mixed content from all classes
- `/student/classes` - List of all enrolled classes
- `/student/classes/[id]` - Individual class view
- `/student/activities` - All activities across classes
- `/student/leaderboard` - Global leaderboard with tabs for class/grade/campus

### Current Components

Key components in the current implementation:
1. `StudentShell` - Main layout component with sidebar navigation
2. `StudentDashboard` - Dashboard with performance metrics and activity feed
3. `StudentClassList` - Grid-based class list with filtering
4. `StudentClassDetail` - Class detail page with tabs
5. `StudentActivityGrid` - Grid view of activities
6. `StudentLeaderboard` - Leaderboard with tabs for different scopes

### Current Navigation

The current portal uses:
- `StudentShell` with sidebar navigation on desktop
- Limited mobile optimization with no dedicated bottom navigation

### Current Issues

1. Mixed content from different classes creates confusion
2. Navigation is not optimized for mobile experience
3. No smooth transitions between pages
4. Sidebar takes up valuable screen space on mobile
5. No class-specific dashboard with focused metrics

## New Architecture Plan

### New Routing Structure

```
/student
  /classes (landing page)
  /class/[id]
    /dashboard (default)
    /activities
    /leaderboard
    /calendar
    /profile
```

### New Components to Create

1. `StudentBottomNav` - Bottom navigation bar with hide/show functionality
2. `ClassDashboard` - Class-specific dashboard with icons and metrics
3. `ViewTransitionLink` - Custom Link component with view transitions
4. `ClassContext` - Context provider for current class data
5. `AchievementPopup` - Popup for achievements and rewards
6. `PointsDetailPopup` - Popup for points details

### Components to Modify

1. `StudentShell` - Remove sidebar, add bottom navigation
2. `StudentClassList` - Update to be the landing page
3. `StudentLeaderboard` - Modify to be class-specific
4. `StudentActivityGrid` - Update to be class-specific

## Implementation Plan

### Phase 1: Setup View Transitions API

1. Update `next.config.js` to enable View Transitions API:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
  },
}

module.exports = nextConfig
```

2. Create a `ViewTransitionLink` component:
```tsx
'use client';

import { Link } from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, ReactNode } from 'react';

interface ViewTransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function ViewTransitionLink({ href, children, className }: ViewTransitionLinkProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    document.documentElement.classList.add('page-transitioning');
    
    // Delay navigation to allow exit animation to play
    setTimeout(() => {
      router.push(href);
    }, 300); // Match this with your CSS transition duration
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </Link>
  );
}
```

3. Add global CSS for transitions in `globals.css`:
```css
/* Page transition animations */
.page-content {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-transitioning .page-content {
  opacity: 0;
  transform: translateY(20px);
}

/* View transitions API */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-from-right {
  from { transform: translateX(30px); }
  to { transform: translateX(0); }
}

@keyframes slide-to-left {
  from { transform: translateX(0); }
  to { transform: translateX(-30px); }
}

::view-transition-old(root) {
  animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-out,
             300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
}

::view-transition-new(root) {
  animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-in,
             300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
}
```

4. Update the root layout to use View Transitions:
```tsx
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/register-sw';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Register service worker for offline support
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Check if user is authenticated and is a student
  useEffect(() => {
    // Authentication logic
  }, [status, session]);

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading student portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {children}
    </div>
  );
}
```

### Phase 2: Create Bottom Navigation

1. Create `StudentBottomNav` component:
```tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { cn } from '@/lib/utils';
import { 
  Home, 
  BookOpen, 
  Trophy, 
  Calendar, 
  HelpCircle, 
  User,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface StudentBottomNavProps {
  classId: string;
}

export function StudentBottomNav({ classId }: StudentBottomNavProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Dashboard',
      href: `/student/class/${classId}/dashboard`
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Activities',
      href: `/student/class/${classId}/activities`
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: 'Leaderboard',
      href: `/student/class/${classId}/leaderboard`
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Calendar',
      href: `/student/class/${classId}/calendar`
    },
    {
      icon: <User className="h-5 w-5" />,
      label: 'Profile',
      href: `/student/class/${classId}/profile`
    }
  ];

  return (
    <>
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background border-t transition-transform duration-300",
          !isExpanded && "translate-y-[calc(100%-2.5rem)]"
        )}
      >
        <div 
          className="flex justify-center border-b cursor-pointer py-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
        <nav className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <ViewTransitionLink
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center space-y-1 px-2 py-1 transition-colors',
                  'min-h-[44px] min-w-[44px]', // Ensure minimum touch target size
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'h-6 w-6',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {item.icon}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </ViewTransitionLink>
            );
          })}
        </nav>
      </div>
      <div className="pb-20" /> {/* Spacer to prevent content from being hidden behind the nav */}
    </>
  );
}
```

### Phase 3: Create Class Context

1. Create a context to manage the current class:
```tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';

interface ClassContextType {
  classId: string;
  className: string;
  loading: boolean;
  error: boolean;
  averageGrade: number;
  leaderboardPosition: number;
  points: number;
  level: number;
  achievements: any[];
  attendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

const ClassContext = createContext<ClassContextType | null>(null);

export function ClassProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const classId = params.id as string;
  
  const [classData, setClassData] = useState<ClassContextType>({
    classId,
    className: '',
    loading: true,
    error: false,
    averageGrade: 0,
    leaderboardPosition: 0,
    points: 0,
    level: 0,
    achievements: [],
    attendance: {
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    }
  });

  const { data, isLoading, error } = api.student.getClassDetails.useQuery(
    { classId },
    { enabled: !!classId }
  );

  useEffect(() => {
    if (data) {
      setClassData({
        classId,
        className: data.name,
        loading: false,
        error: false,
        averageGrade: data.averageGrade,
        leaderboardPosition: data.leaderboardPosition,
        points: data.points,
        level: data.level,
        achievements: data.achievements,
        attendance: data.attendance
      });
    } else if (error) {
      setClassData(prev => ({ ...prev, loading: false, error: true }));
    }
  }, [data, error, classId]);

  return (
    <ClassContext.Provider value={classData}>
      {children}
    </ClassContext.Provider>
  );
}

export function useClass() {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
}
```

### Phase 4: Create Class Dashboard

1. Create the `ClassDashboard` component:
```tsx
'use client';

import { useClass } from '@/contexts/class-context';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  BarChart, 
  Calendar, 
  Clock, 
  Star, 
  Trophy 
} from 'lucide-react';
import { motion } from 'framer-motion';

export function ClassDashboard() {
  const { 
    className, 
    loading, 
    error, 
    averageGrade, 
    leaderboardPosition, 
    points, 
    level, 
    achievements, 
    attendance 
  } = useClass();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading class data</div>;
  }

  const attendancePercentage = Math.round((attendance.present / attendance.total) * 100);

  const metrics = [
    {
      icon: <BarChart className="h-6 w-6" />,
      label: 'Average Grade',
      value: `${averageGrade}%`,
      color: 'bg-blue-500'
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      label: 'Leaderboard',
      value: `#${leaderboardPosition}`,
      color: 'bg-yellow-500'
    },
    {
      icon: <Star className="h-6 w-6" />,
      label: 'Points',
      value: points.toLocaleString(),
      color: 'bg-purple-500'
    },
    {
      icon: <Award className="h-6 w-6" />,
      label: 'Level',
      value: level,
      color: 'bg-green-500'
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      label: 'Attendance',
      value: `${attendancePercentage}%`,
      color: 'bg-red-500'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      label: 'Activities',
      value: '12',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{className}</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-4 flex flex-col items-center text-center">
              <div className={`p-2 rounded-full ${metric.color} text-white mb-2`}>
                {metric.icon}
              </div>
              <span className="text-xl font-bold">{metric.value}</span>
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* More dashboard content can be added here */}
    </div>
  );
}
```

### Phase 5: Update Student Classes Page

1. Update the student classes page to be the landing page:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentClassesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  const { data: classes, isLoading } = api.student.getEnrolledClasses.useQuery();
  
  const filteredClasses = classes?.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const handleClassSelect = (classId: string) => {
    router.push(`/student/class/${classId}/dashboard`);
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">My Classes</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search classes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-muted" />
          ))}
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClasses.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleClassSelect(cls.id)}
              >
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold">{cls.name}</h2>
                  <p className="text-muted-foreground">{cls.subject}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span>{cls.teacher}</span>
                    <Button variant="outline" size="sm">
                      Enter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No classes found</p>
        </div>
      )}
    </div>
  );
}
```

### Phase 6: Create Class Layout

1. Create a layout for class-specific pages:
```tsx
'use client';

import { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { ClassProvider } from '@/contexts/class-context';
import { StudentBottomNav } from '@/components/student/StudentBottomNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';

export default function ClassLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const classId = params.id as string;
  
  return (
    <ClassProvider>
      <div className="container mx-auto py-4 px-4">
        <div className="mb-4">
          <ViewTransitionLink href="/student/classes">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Classes
            </Button>
          </ViewTransitionLink>
        </div>
        
        <main>
          {children}
        </main>
        
        <StudentBottomNav classId={classId} />
      </div>
    </ClassProvider>
  );
}
```

### Phase 7: Create Achievement and Points Popups

1. Create the `AchievementPopup` component:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';

interface AchievementPopupProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    points: number;
  } | null;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500); // Wait for exit animation
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);
  
  if (!achievement) return null;
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1 }}
              className="mx-auto mb-4 bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center"
            >
              <Award className="h-10 w-10 text-primary" />
            </motion.div>
            
            <motion.h2
              className="text-2xl font-bold mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Achievement Unlocked!
            </motion.h2>
            
            <motion.h3
              className="text-xl font-semibold mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {achievement.title}
            </motion.h3>
            
            <motion.p
              className="text-muted-foreground mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {achievement.description}
            </motion.p>
            
            <motion.div
              className="text-lg font-bold text-primary"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              +{achievement.points} points
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

2. Create the `PointsDetailPopup` component:
```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PointsDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  points: {
    total: number;
    history: Array<{
      id: string;
      amount: number;
      source: string;
      description: string;
      date: string;
    }>;
  };
}

export function PointsDetailPopup({ isOpen, onClose, points }: PointsDetailPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full max-h-[80vh] flex flex-col"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Points History</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-3xl font-bold text-primary">{points.total}</p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {points.history.map((item) => (
                  <div key={item.id} className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.source}</span>
                      <span className={item.amount >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {item.amount >= 0 ? `+${item.amount}` : item.amount}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Migration Strategy

To ensure a smooth transition to the new architecture without conflicts:

1. **Parallel Development**:
   - Create new routes under `/student/class/[id]` while keeping existing routes
   - Develop new components alongside existing ones
   - Test thoroughly before switching

2. **Phased Rollout**:
   - Phase 1: Implement View Transitions API
   - Phase 2: Create bottom navigation and class context
   - Phase 3: Implement class dashboard
   - Phase 4: Migrate activities and leaderboard to class-specific views
   - Phase 5: Add achievement and points popups
   - Phase 6: Redirect old routes to new routes

3. **Data Migration**:
   - No database schema changes required
   - Update API endpoints to filter by classId
   - Create new tRPC procedures for class-specific data

4. **Testing Strategy**:
   - Test each phase independently
   - Conduct user testing with a small group
   - Gather feedback and iterate
   - Perform performance testing with large data sets

## Technical Considerations

1. **Performance Optimization**:
   - Use virtualization for long lists
   - Implement lazy loading for activities
   - Optimize API calls with proper caching
   - Use React.memo for frequently re-rendered components

2. **Accessibility**:
   - Ensure bottom navigation meets WCAG standards
   - Add proper aria labels to all interactive elements
   - Test with screen readers
   - Ensure animations can be disabled for users with vestibular disorders

3. **Mobile Responsiveness**:
   - Design mobile-first
   - Test on various screen sizes
   - Ensure touch targets are at least 44x44px
   - Optimize for portrait and landscape orientations

4. **Browser Compatibility**:
   - View Transitions API is experimental
   - Implement fallbacks for unsupported browsers
   - Test across Chrome, Firefox, Safari, and Edge

## Conclusion

This revamp will significantly improve the student portal experience by:
1. Providing a more focused, class-specific view
2. Enhancing navigation with a mobile-friendly bottom bar
3. Adding smooth transitions between pages
4. Improving the visual presentation of achievements and rewards
5. Creating a more engaging and interactive experience

The implementation will be done in phases to ensure stability and allow for user feedback throughout the process.
