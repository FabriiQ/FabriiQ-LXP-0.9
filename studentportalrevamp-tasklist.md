# Student Portal Revamp: Hybrid Implementation Task List with UX Psychology Focus

## UX Psychology Principles Applied

### Attention & Cognitive Processing
- **Cognitive Load**: Reducing mental effort required to use the interface
- **Hick's Law**: Limiting choices to reduce decision paralysis
- **Progressive Disclosure**: Revealing information gradually as needed
- **Priming**: Setting expectations through visual cues
- **Anchoring Bias**: Using initial information to influence decisions
- **Attention Bias**: Directing focus to specific elements
- **Decision Fatigue**: Limiting important choices to when users are fresh

### Memory & Learning
- **Chunking**: Grouping information for better memory retention
- **Picture Superiority Effect**: Using visuals to enhance memory
- **Recognition Over Recall**: Making options visible rather than remembered
- **Spacing Effect**: Distributing learning over time for better retention
- **Zeigarnik Effect**: Using incomplete tasks to maintain engagement
- **Method of Loci**: Associating information with spatial locations

### Motivation & Engagement
- **Goal Gradient Effect**: Increasing motivation as users approach goals
- **Endowment Effect**: Making users feel ownership of their learning
- **IKEA Effect**: Increasing value through user participation in creation
- **Labor Illusion**: Showing the work being done to increase perceived value
- **Loss Aversion**: Framing to avoid losing progress rather than gaining rewards
- **Sunk Cost Effect**: Leveraging previous investment to encourage continuation
- **Investment Loops**: Creating cycles of investment that increase engagement
- **Variable Reward**: Providing unexpected positive reinforcement
- **Temptation Bundling**: Pairing challenging tasks with enjoyable experiences

### Social & Emotional Factors
- **Nudge Theory**: Subtly guiding users toward beneficial behaviors
- **Framing**: Presenting choices in ways that influence decisions
- **Empathy Gap**: Designing for users in different emotional states
- **Peak-End Rule**: Creating memorable high points and positive endings
- **Default Bias**: Setting beneficial default options that users tend to keep
- **Commitment & Consistency**: Aligning new actions with previous commitments
- **Reactance**: Avoiding forced behaviors that create resistance

### Perception & Value
- **Scarcity**: Creating value through limited availability
- **Curiosity Gap**: Prompting users to seek missing information
- **Fresh Start Effect**: Leveraging new beginnings to motivate action
- **Discoverability**: Making features easy to find without overwhelming
- **Weber's Law**: Implementing gradual, incremental changes

## Phase 1: Foundation (Clean Implementation)

### 1. Setup View Transitions API (Cognitive Load Reduction)
- [ ] Update `next.config.js` to enable View Transitions API
- [ ] Create `components/ui/view-transition-link.tsx` component with haptic feedback on mobile
- [ ] Add transition animations to `globals.css` with 300-400ms duration (optimal for perception)
- [ ] Implement subtle page transitions that maintain context (reducing cognitive load)
- [ ] Add loading indicators that show progress (reducing uncertainty anxiety)
- [ ] Test basic transitions between existing pages with attention to perceived performance
- [ ] Ensure transitions feel natural and don't disorient users (maintaining spatial memory)

### 2. Create Class Context (Mental Models)
- [ ] Create `contexts/class-context.tsx` with ClassProvider and useClass hook
- [ ] Implement API integration with tRPC for class data
- [ ] Add types for class data structure including subject information
- [ ] Include subject data in the class context for subject-wise activity organization
- [ ] Create loading states with educational micro-content (e.g., "Did you know? Regular practice improves retention by 80%")
- [ ] Implement error states with empathetic messaging (e.g., "We're having trouble connecting. This doesn't affect your progress.")
- [ ] Create test component to verify context functionality
- [ ] Update ClassContextHeader to use real subject data instead of mock objects

### 3. Create Bottom Navigation (Hick's Law & Cognitive Load)
- [x] Create `components/student/StudentBottomNav.tsx` component with max 5 options (Hick's Law)
- [x] Implement collapsible functionality with clear visual affordance
- [x] Add subtle animation for expand/collapse (50ms duration)
- [x] Use consistent iconography with text labels (dual-coding principle)
- [x] Implement haptic feedback on touch devices
- [x] Add visual indicators for current section (reducing cognitive load)
- [x] Style according to design guidelines with proper mobile optimization (min 44px touch targets)
- [x] Test on various screen sizes with attention to thumb zones on mobile
- [x] Ensure navigation is accessible with proper contrast ratios (min 4.5:1)

### 4. Create Class Dashboard (Progressive Disclosure & Labor Illusion)
- [x] Create `components/student/ClassDashboard.tsx` component
- [x] Implement metric cards with meaningful icons that reinforce concepts (Picture Superiority Effect)
- [x] Organize information by importance (progressive disclosure)
- [x] Group related metrics into visual chunks of 3-5 items (Chunking & Miller's Law)
- [x] Add subtle entrance animations for card appearance (staggered by 50ms)
- [x] Use color psychology: green for positive progress, yellow for areas needing attention
- [x] Implement skeleton loading states that match final UI (priming)
- [x] Show "calculating your progress" animations during data loading (Labor Illusion)
- [x] Connect to Class Context for data
- [x] Create empathetic error states with actionable recovery options
- [x] Add micro-interactions on hover/focus with subtle scale transforms (1.02-1.05)
- [x] Implement "time since last activity" indicators (creating urgency)
- [x] Add incomplete task indicators for assignments (Zeigarnik Effect)
- [x] Create a "continue learning" section highlighting incomplete activities (Goal Gradient Effect)
- [x] Include unexpected micro-animations as delighters on achievement milestones
- [x] Show "effort tracking" visualizations that highlight work completed (Labor Illusion)
- [x] Implement "investment tracking" to show time spent learning (Sunk Cost Effect)

### 5. Create Popup Components (Peak-End Rule & Sensory Appeal)
- [x] Create `components/student/AchievementPopup.tsx` with positive framing
- [x] Create `components/student/PointsDetailPopup.tsx` with progress visualization
- [x] Implement entrance/exit animations that draw attention without jarring users
- [x] Add confetti or celebration effects for achievements (Peak-End Rule)
- [x] Use encouraging language that emphasizes growth mindset
- [x] Include storytelling elements in achievement descriptions (Storytelling Effect)
- [x] Add variable rewards for consecutive days of activity (Variable Reward)
- [x] Implement haptic feedback for mobile users (Sensory Appeal)
- [x] Add subtle sound effects (optional, respecting user preferences)
- [x] Create "share achievement" option to encourage social validation
- [x] Ensure popups are accessible and don't trap keyboard focus
- [x] Test popup interactions across devices
- [x] Implement "snooze" option for notifications (user control)
- [x] Add exit points that invite users to take a break after achievements (Provide Exit Points)

## Phase 2: Integration (Hybrid Implementation)

### 6. Create New Routes Structure (Mental Models & Consistency)
- [x] Create `app/student/class/[id]/layout.tsx` with ClassProvider
- [x] Implement consistent page layouts with predictable element positioning
- [x] Create `app/student/class/[id]/dashboard/page.tsx` using ClassDashboard
- [x] Create `app/student/class/[id]/leaderboard/page.tsx` with empty state that encourages participation
- [x] Create `app/student/class/[id]/calendar/page.tsx` with empty state showing how calendar will help
- [x] Create `app/student/class/[id]/profile/page.tsx` with placeholder achievements
- [x] Ensure consistent back navigation and breadcrumbs (spatial memory support)
- [x] Add page titles that clearly communicate location (reducing cognitive load)

### 7. Update Student Classes Page (Choice Architecture & Familiarity Bias)
- [ ] Modify `app/student/classes/page.tsx` to use ViewTransitionLink
- [ ] Update class card design with visual hierarchy highlighting important information
- [ ] Implement card sorting by recency/relevance by default (anchoring)
- [ ] Position most important classes at beginning and end of lists (Serial Position Effect)
- [ ] Add subtle entrance animations for card appearance (150ms staggered)
- [ ] Use familiar UI patterns from popular apps (Familiarity Bias)
- [ ] Implement search with autocomplete and zero-state suggestions
- [ ] Add filter options with sensible defaults (choice architecture)
- [ ] Create visual indicators for classes with limited-time activities (Scarcity)
- [ ] Implement empty states with helpful guidance text
- [ ] Connect to API for class data with optimistic UI updates
- [ ] Add skeleton loaders that match final UI structure (expectation setting)
- [ ] Implement pull-to-refresh with visual feedback on mobile
- [ ] Add "New Term" banners for fresh class enrollments (Fresh Start Effect)

### 8. Update Student Shell (Consistency & Context Preservation)
- [ ] Modify `components/ui/specialized/role-based/student-shell.tsx`
- [ ] Add detection for class-specific pages
- [ ] Keep sidebar for non-class pages temporarily
- [ ] Implement smooth transitions between navigation styles
- [ ] Add contextual header information (e.g., class name, subject)
- [ ] Ensure consistent theme application across old and new components
- [ ] Test navigation between old and new pages
- [ ] Add subtle visual cues for navigation changes
- [ ] Implement breadcrumb trail for deep navigation (reducing disorientation)

### 9. Implement Subject-based Activities Organization with Existing Components (IKEA Effect & Investment Loops)
- [x] Adapt existing `components/shared/entities/students/StudentActivityGrid.tsx` for subject-based organization
  - [x] Create `components/student/SubjectsGrid.tsx` that leverages the existing virtualization
  - [x] Show subject completion percentage with visual progress indicators (Goal Gradient Effect)
  - [x] Display number of pending/completed activities per subject (Chunking)
  - [x] Add visual cues (colors/icons) to differentiate between subjects (Recognition Over Recall)
  - [x] Implement micro-interactions on hover/focus (Sensory Appeal)
  - [x] Add "continue learning" prompt for subjects with in-progress activities (Zeigarnik Effect)
  - [x] Show urgency indicators for subjects with approaching deadlines (Scarcity)

- [x] Adapt existing `components/student/SubjectActivitiesView.tsx` to use `VirtualizedActivityList` component
  - [x] Implement view switching using icon buttons instead of tabs (Recognition Over Recall)
  - [x] Create "pending activities" view prioritizing due soon items (Loss Aversion)
  - [x] Create "completed activities" view showing achievement history (Endowment Effect)
  - [x] Create "upcoming activities" view with preview cards (Curiosity Gap)
  - [x] Create "chapter-wise" view organizing by topics (Mental Models)
  - [x] Create "calendar view" showing temporal organization (Spacing Effect)
  - [x] Add subtle animations for view transitions (150ms duration)

- [x] Enhance Class Context to include real subject data instead of mock objects
- [x] Implement URL structure for subject-specific activities:
  - [x] `/student/class/[id]/activities` - Subjects grid overview
  - [x] `/student/class/[id]/subjects/[subjectId]/activities` - Subject activities
  - [x] Support view type via query parameter: `?view=pending|completed|upcoming|chapters|calendar`

- [x] Update `app/student/class/[id]/activities/page.tsx` to show subjects grid
- [x] Create `app/student/class/[id]/subjects/[subjectId]/activities/page.tsx` for subject activities
- [x] Create `app/student/class/[id]/subjects/[subjectId]/activities/[activityId]/page.tsx` using existing `StudentActivityViewerClient`

- [x] Leverage existing offline support from `StudentActivityViewerClient` for subject activities
  - [x] Ensure offline activity completion works with subject-based organization
  - [x] Implement sync mechanism for completed offline activities
  - [x] Add offline indicators in the subject activities view

- [x] Implement activity cards with clear completion status indicators (reuse existing card designs)
- [x] Add "new" badges for recently added activities (Novelty Bias)
- [x] Show due dates with urgency indicators for approaching deadlines (Scarcity)
- [x] Partially reveal activity content to create curiosity (Curiosity Gap)
- [x] Show progress indicators for partially completed activities (Zeigarnik Effect)
- [x] Add subtle animations for state changes (completion, new items)
- [x] Create "continue where you left off" section at the top (Endowment Effect)
- [x] Show "X% of students have completed this" indicators (Social Proof)
- [x] Implement "what you'll lose" messaging for incomplete activities (Loss Aversion)
- [x] Create "investment loops" showing cumulative time/effort in each subject
- [x] Test with real activity data across multiple subjects
- [x] Create loading states with educational facts about learning
- [x] Implement "streak" counters for consecutive days of activity completion

### 10. Adapt Leaderboard Page with Existing Components (Loss Aversion & Commitment)
- [x] Adapt existing `StudentPerformanceView` component for the leaderboard
- [x] Create `components/student/ClassLeaderboard.tsx` that leverages existing virtualization
- [x] Modify to filter by classId from context
- [x] Highlight user's position prominently (self-relevance effect)
- [x] Show progress needed to reach next position (Goal Gradient Effect)
- [x] Implement animations for position changes
- [x] Add positive framing for all positions (growth mindset)
- [x] Show recent improvers section (social proof)
- [x] Implement weekly/monthly toggle views (Fresh Start Effect)
- [x] Create visual recognition for top performers (Recognition Over Recall)
- [x] Add "most improved" category to motivate progress (Singularity Effect)
- [x] Implement "almost there" indicators when close to next rank (Endowment Effect)
- [x] Show what would be lost by dropping a rank (Loss Aversion)
- [x] Create "commitment pledges" for maintaining or improving rank (Commitment & Consistency)
- [x] Connect to `app/student/class/[id]/leaderboard/page.tsx`
- [x] Test with real leaderboard data
- [x] Add confetti animation for personal best achievements (Peak-End Rule)
- [x] Implement "challenge a friend" feature (social connection)
- [x] Create "hall of fame" for historical top performers (Recognition)
- [x] Add tooltips showing specific achievements that led to high rankings
- [x] Implement "effort visibility" showing work behind top performers (Labor Illusion) with mobile first clean and modern interface

## Phase 3: Refinement and Migration

### 11. Implement Class Calendar with Existing Components (Spacing Effect & Fresh Start Effect)
- [x] Adapt existing calendar components if available or use `StudentActivityGrid` with calendar view
- [x] Create `components/student/ClassCalendar.tsx` with optimized rendering with virtulization and offline use
- [x] Implement day/week/month views with intuitive switching
- [x] Add subtle animations for date transitions (200ms duration)
- [x] Highlight today and upcoming deadlines visually (urgency)
- [x] Implement color coding for different activity types (Chunking information)
- [x] Add visual density options (compact vs. spacious views)
- [x] Show estimated completion times for activities (combating Planning Fallacy)
- [x] Suggest optimal study intervals based on activity type (Spacing Effect)
- [x] Highlight new weeks/months as fresh start opportunities (Fresh Start Effect)
- [x] Implement "memory-optimized" study schedule suggestions
- [x] Connect to API for calendar data with optimistic updates
- [x] Implement empty states with helpful guidance
- [x] Add "add to personal calendar" functionality
- [x] Create visual markers for completed activities (Recognition Over Recall)
- [x] Implement "study streak" indicators for consistent engagement
- [x] Connect to `app/student/class/[id]/calendar/page.tsx`
- [x] Create loading states with calendar-related learning facts
- [x] Add "location-based" reminders for study activities (Method of Loci)

### 12. Implement Class Profile with Existing Components (IKEA Effect & Sunk Cost Effect)
- [x] Create `components/student/ClassProfile.tsx` that leverages existing performance metrics
- [x] Implement achievements section with progress indicators
- [x] Show partially completed achievements (Endowed Progress Effect)
- [x] Group achievements into themed collections (Chunking)
- [x] Use meaningful icons and colors for achievement categories (Picture Superiority Effect)
- [x] Create personalized avatar or profile customization options (IKEA Effect)
- [x] Allow students to create/customize their learning goals (IKEA Effect)
- [x] Implement points history section with positive framing
- [x] Add trend visualization (improvement over time)
- [x] Create "next milestone" section with clear goals
- [x] Show "X away from unlocking" messages (Goal Gradient Effect)
- [x] Display total time invested in learning (Sunk Cost Effect)
- [x] Add popup triggers for achievement details with celebration animations
- [x] Implement sharing functionality for achievements (social validation)
- [x] Create digital badges that can be displayed on profile (Endowment Effect)
- [x] Connect to `app/student/class/[id]/profile/page.tsx`
- [x] Add encouraging messages based on progress patterns
- [x] Implement "personal best" highlights
- [x] Create "your learning journey" visual timeline (Storytelling Effect)
- [x] Add unexpected "secret" achievements to discover (Delighters & Curiosity Gap)
- [x] Show "investment protected" messaging when returning after absence (Sunk Cost Effect)
- [x] Create "commitment contracts" for learning goals (Commitment & Consistency)

### 13. Add Redirects and Navigation Logic (Discoverability & Default Bias)
- [ ] Update `app/student/dashboard/page.tsx` to redirect to classes page
- [ ] Add logic to redirect from old activity pages to class-specific ones
- [ ] Implement "back to classes" navigation with consistent positioning
- [ ] Add breadcrumb navigation for deep linking (reducing disorientation)
- [ ] Implement history state preservation (back button behavior)
- [ ] Add subtle loading indicators during redirects (reducing uncertainty)
- [ ] Ensure redirects maintain scroll position where appropriate
- [ ] Design navigation with clear discoverability cues (Discoverability)
- [ ] Set intelligent defaults for navigation based on user patterns (Default Bias)
- [ ] Limit navigation options to prevent decision fatigue (Hick's Law)
- [ ] Test all navigation paths with attention to cognitive load
- [ ] Add helpful toast messages for context changes
- [ ] Implement intelligent default views based on user history
- [ ] Create consistent navigation patterns across the application (Mental Models)
- [ ] Add subtle guidance for discovering new features without overwhelming
- [ ] Implement "continue where you left off" as default landing page (Sunk Cost Effect)

### 14. Optimize Performance with Existing Components (Labor Illusion & Chronoception)
- [ ] Leverage existing `VirtualizedActivityList` component for all activity lists
- [ ] Ensure offline support is properly integrated with the existing `StudentActivityViewerClient`
- [ ] Add progressive loading with priority for visible content
- [ ] Implement skeleton screens that match final UI (expectation setting)
- [ ] Add lazy loading for images and content with blur-up previews
- [ ] Optimize API calls with SWR or React Query caching
- [ ] Implement optimistic UI updates for common actions
- [ ] Show meaningful progress indicators during loading (Labor Illusion)
- [ ] Add interesting micro-content during loading (educational facts)
- [ ] Implement "time remaining" indicators that slightly underestimate actual time (Chronoception)
- [ ] Test perceived performance with simulated network conditions
- [ ] Implement background data prefetching for likely next actions
- [ ] Create "productive waiting" with mini-learning opportunities during loads
- [ ] Test performance with large datasets (5000+ activities)
- [ ] Add subtle animations during data loading (< 300ms)
- [ ] Implement gradual UI changes that feel natural (Weber's Law)
- [ ] Create loading sequences that show work being done (Labor Illusion)

### 15. Enhance Accessibility (Empathy Gap & Inclusive Design)
- [ ] Add proper ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works correctly with visible focus states
- [ ] Add option to disable animations (respecting user preferences)
- [ ] Implement high contrast mode option
- [ ] Ensure all text meets readability standards (min 16px for body text)
- [ ] Test with screen readers and fix announcement issues
- [ ] Add alternative text for all informational images
- [ ] Ensure color is not the only means of conveying information
- [ ] Implement proper heading hierarchy for screen reader navigation
- [ ] Test with various assistive technologies
- [ ] Add skip navigation links for keyboard users

### 16. Cross-browser Testing (Consistency & Reliability)
- [ ] Test in Chrome, Firefox, Safari, and Edge
- [ ] Implement graceful fallbacks for browsers without View Transitions API
- [ ] Ensure consistent touch behavior across mobile browsers
- [ ] Fix any browser-specific issues with detailed documentation
- [ ] Test on iOS and Android devices with various screen sizes
- [ ] Verify offline functionality and error handling
- [ ] Test with different connection speeds
- [ ] Ensure consistent font rendering across platforms
- [ ] Verify that animations perform well on lower-end devices
- [ ] Document any browser-specific limitations or workarounds

## Phase 4: Final Migration and Cleanup

### 17. Complete Migration (Default Bias & Reactance)
- [ ] Update main student layout to default to new navigation
- [ ] Add permanent redirects from old routes to new ones
- [ ] Update any deep links in the application
- [ ] Create onboarding tooltips highlighting new features (progressive disclosure)
- [ ] Implement "What's New" modal with visual tour of changes (Picture Superiority Effect)
- [ ] Add option to temporarily switch back to old UI (reducing Reactance)
- [ ] Maintain familiar patterns from old UI where possible (Familiarity Bias)
- [ ] Set beneficial defaults while allowing customization (Default Bias)
- [ ] Create help documentation with screenshots and videos
- [ ] Communicate changes to users with positive framing
- [ ] Add subtle hints for new features (pulsing indicators)
- [ ] Implement guided tour option for first-time users after update
- [ ] Create feedback mechanism for migration issues
- [ ] Add "tip of the day" feature for discovering new functionality (Curiosity Gap)
- [ ] Implement skeuomorphic design elements where helpful (Skeuomorphism)
- [ ] Create "before/after" comparisons to highlight improvements (Anchoring)
- [ ] Add celebratory message after first successful use of new features (Aha! Moment)
- [ ] Provide clear choices rather than forced changes (avoiding Reactance)
- [ ] Implement gradual feature introduction to avoid overwhelming (Weber's Law)
- [ ] Create migration checklist with progress tracking (Endowment Effect)

### 18. Code Cleanup and Legacy Component Removal (Maintainability & Performance)
- [ ] Remove unused components and code, especially from the activities-legacy folder
- [ ] Refactor any duplicate logic
- [ ] Optimize bundle size with code splitting
- [ ] Update documentation with UX principles and patterns used
- [ ] Clean up console logs and debug code
- [ ] Standardize naming conventions across components
- [ ] Implement consistent error handling patterns
- [ ] Add performance monitoring hooks
- [ ] Create style guide documentation for UI patterns
- [ ] Document accessibility features and considerations
- [ ] Add comments explaining psychological principles applied
- [ ] Document the reused components and their integration points
- [ ] Create a component map showing relationships between new and existing components
- [ ] Ensure all offline functionality is properly documented

### 19. Final Testing (Edge Cases & Sensory Appeal)
- [ ] Conduct end-to-end testing of all flows
- [ ] Verify all animations and transitions
- [ ] Test edge cases with empathetic messaging and visual cues (Sensory Appeal):
  - No classes: "Ready to join your first class? Ask your teacher for an invite code." (with friendly illustration)
  - No activities: "Your teacher is preparing amazing activities for you. Check back soon!" (with progress animation)
  - Slow connection: "We're working with your connection. Content will appear shortly." (with engaging loading animation)
- [ ] Test with screen readers and keyboard navigation
- [ ] Verify that all delighters and micro-interactions work correctly
- [ ] Ensure all achievement celebrations provide multi-sensory feedback (visual, haptic, audio)
- [ ] Test that incomplete tasks remain visible and prioritized (Zeigarnik Effect)
- [ ] Verify that progress indicators accurately reflect user advancement (Goal Gradient Effect)
- [ ] Perform load testing with realistic user scenarios
- [ ] Test offline functionality and recovery
- [ ] Verify state preservation across sessions
- [ ] Test with various account types and permission levels
- [ ] Conduct usability testing with actual students
- [ ] Verify that memory-enhancing features (chunking, visual cues) are effective
- [ ] Test that variable rewards appear at appropriate intervals
- [ ] Document any known limitations with mitigation strategies

### 20. Deployment and Monitoring (Second-Order Effects & Pareto Principle)
- [ ] Deploy to staging environment
- [ ] Conduct user acceptance testing with detailed feedback collection
- [ ] Implement A/B testing for critical UI elements
- [ ] Create analytics dashboard for key UX metrics:
  - Time to first meaningful interaction
  - Task completion rates
  - Error rates and recovery
  - Session duration and engagement
  - Completion of partially finished activities (Zeigarnik Effect measurement)
  - Response to variable rewards and delighters
  - Investment loop engagement metrics
  - Labor illusion effectiveness measurements
- [ ] Deploy to production with phased rollout
- [ ] Monitor for errors and performance issues
- [ ] Implement automated anomaly detection
- [ ] Create "learning insights" dashboard for students (Hawthorne Effect)
- [ ] Add opt-in activity tracking with clear benefits for users (Reciprocity)
- [ ] Analyze second-order effects of UX changes (unintended consequences)
- [ ] Focus optimization on the 20% of features used 80% of the time (Pareto Principle)
- [ ] Gather user feedback through multiple channels:
  - In-app feedback widget
  - Targeted surveys (keep under 5 questions)
  - Session recordings (with consent)
  - Self-initiated feedback options (Self-Initiated Triggers)
- [ ] Implement periodic "celebration moments" highlighting user progress (Peak-End Rule)
- [ ] Create regular UX review schedule
- [ ] Document learnings and insights for future projects
- [ ] Set up automatic reminders for incomplete activities (Zeigarnik Effect)
- [ ] Develop system for identifying and addressing negative experiences (Negativity Bias)
- [ ] Monitor for decision fatigue patterns in user behavior
- [ ] Implement "temptation bundling" for challenging learning activities

## Component Implementation Details with UX Psychology Principles

### ViewTransitionLink Component (Reducing Cognitive Load)
```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, ReactNode, useEffect } from 'react';

interface ViewTransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean; // Enable prefetching for perceived performance
  hapticFeedback?: boolean; // Enable haptic feedback on mobile
}

export function ViewTransitionLink({
  href,
  children,
  className,
  prefetch = true,
  hapticFeedback = true
}: ViewTransitionLinkProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Prefetch the target page for perceived instant loading
  useEffect(() => {
    if (prefetch) {
      router.prefetch(href);
    }
  }, [href, prefetch, router]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (isTransitioning) return;

    // Provide haptic feedback on mobile devices if supported
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(10); // Subtle 10ms vibration
    }

    setIsTransitioning(true);
    document.documentElement.classList.add('page-transitioning');

    // Show loading indicator after a delay if navigation takes too long
    const loadingTimeout = setTimeout(() => {
      // Only show loading indicator if still transitioning after 300ms
      if (isTransitioning) {
        document.documentElement.classList.add('show-loading-indicator');
      }
    }, 300);

    // Delay navigation to allow exit animation to play
    setTimeout(() => {
      router.push(href);
      clearTimeout(loadingTimeout);
    }, 300); // Match this with your CSS transition duration
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
      aria-current={router.pathname === href ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
```

### StudentBottomNav Component (Hick's Law & Cognitive Load)
```tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ViewTransitionLink } from '@/components/ui/view-transition-link';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  Trophy,
  Calendar,
  User,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface StudentBottomNavProps {
  classId: string;
}

export function StudentBottomNav({ classId }: StudentBottomNavProps) {
  const pathname = usePathname();
  // Default to expanded on larger screens, collapsed on mobile
  const [isExpanded, setIsExpanded] = useState(() => {
    // Use window.innerWidth if available (client-side)
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });

  // Store user preference in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('navExpanded');
      if (savedState !== null) {
        setIsExpanded(savedState === 'true');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('navExpanded', String(isExpanded));
    }
  }, [isExpanded]);

  // Limited to 5 items (Hick's Law - reducing choice complexity)
  const navItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Dashboard',
      href: `/student/class/${classId}/dashboard`,
      ariaLabel: 'Go to class dashboard'
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Activities',
      href: `/student/class/${classId}/activities`,
      ariaLabel: 'View class activities'
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: 'Leaderboard',
      href: `/student/class/${classId}/leaderboard`,
      ariaLabel: 'Check class leaderboard'
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Calendar',
      href: `/student/class/${classId}/calendar`,
      ariaLabel: 'View class calendar'
    },
    {
      icon: <User className="h-5 w-5" />,
      label: 'Profile',
      href: `/student/class/${classId}/profile`,
      ariaLabel: 'Go to your class profile'
    }
  ];

  const toggleNav = () => {
    setIsExpanded(!isExpanded);
    // Provide haptic feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background border-t transition-transform duration-150 ease-in-out shadow-lg",
          !isExpanded && "translate-y-[calc(100%-2.5rem)]"
        )}
      >
        <div
          className="flex justify-center border-b cursor-pointer py-1 hover:bg-muted transition-colors"
          onClick={toggleNav}
          role="button"
          aria-expanded={isExpanded}
          aria-controls="navigation-menu"
          tabIndex={0}
          aria-label={isExpanded ? "Collapse navigation" : "Expand navigation"}
        >
          <div className="flex items-center gap-2">
            {isExpanded ?
              <ChevronDown className="h-4 w-4 text-primary animate-pulse" /> :
              <ChevronUp className="h-4 w-4 text-primary animate-pulse" />
            }
            <span className="text-xs font-medium text-muted-foreground">
              {isExpanded ? "Hide menu" : "Show menu"}
            </span>
          </div>
        </div>
        <nav
          id="navigation-menu"
          className="flex items-center justify-around h-16 px-2"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <ViewTransitionLink
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center space-y-1 px-2 py-1 transition-colors duration-150',
                  'min-h-[44px] min-w-[44px]', // Ensure minimum touch target size (accessibility)
                  'relative overflow-hidden rounded-md',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                aria-label={item.ariaLabel}
                hapticFeedback={true}
              >
                <div className={cn(
                  'h-6 w-6 transition-transform duration-150',
                  isActive ? 'text-primary scale-110' : 'text-muted-foreground'
                )}>
                  {item.icon}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
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

### Class Context (Mental Models & Error Handling)
```tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';

// Educational facts to show during loading (Cognitive Load Reduction)
const LEARNING_FACTS = [
  "Regular practice improves retention by 80%",
  "Taking short breaks between study sessions improves focus",
  "Teaching others what you've learned reinforces your own understanding",
  "Connecting new information to things you already know helps memory",
  "Testing yourself is more effective than re-reading material",
  "Spaced repetition is the most effective way to memorize information",
  "Your brain processes information better when you're well-rested",
  "Visual learning can improve understanding by up to 400%",
  "Setting specific goals increases motivation and achievement",
  "Growth mindset students achieve more than fixed mindset students"
];

interface ClassContextType {
  classId: string;
  className: string;
  loading: boolean;
  error: boolean;
  errorMessage: string;
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
  learningFact: string; // Educational content during loading
  retry: () => void; // Error recovery function
}

const ClassContext = createContext<ClassContextType | null>(null);

export function ClassProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const classId = params.id as string;

  // Select a random learning fact
  const [learningFact, setLearningFact] = useState(() => {
    const randomIndex = Math.floor(Math.random() * LEARNING_FACTS.length);
    return LEARNING_FACTS[randomIndex];
  });

  // Rotate learning facts during extended loading
  useEffect(() => {
    if (!classId) return;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * LEARNING_FACTS.length);
      setLearningFact(LEARNING_FACTS[randomIndex]);
    }, 8000); // Change fact every 8 seconds

    return () => clearInterval(interval);
  }, [classId]);

  const [classData, setClassData] = useState<Omit<ClassContextType, 'retry'>>({
    classId,
    className: '',
    loading: true,
    error: false,
    errorMessage: '',
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
    },
    learningFact
  });

  const { data, isLoading, error, refetch } = api.student.getClassDetails.useQuery(
    { classId },
    {
      enabled: !!classId,
      retry: 2, // Retry failed requests twice
      retryDelay: 1000, // Wait 1 second between retries
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    }
  );

  // Error recovery function
  const retry = () => {
    setClassData(prev => ({ ...prev, loading: true, error: false }));
    void refetch();
  };

  useEffect(() => {
    if (data) {
      setClassData({
        classId,
        className: data.name,
        loading: false,
        error: false,
        errorMessage: '',
        averageGrade: data.averageGrade,
        leaderboardPosition: data.leaderboardPosition,
        points: data.points,
        level: data.level,
        achievements: data.achievements,
        attendance: data.attendance,
        learningFact
      });
    } else if (error) {
      setClassData(prev => ({
        ...prev,
        loading: false,
        error: true,
        errorMessage: error.message || "We're having trouble connecting. This doesn't affect your progress."
      }));
    }
  }, [data, error, classId, learningFact]);

  const contextValue = {
    ...classData,
    retry
  };

  return (
    <ClassContext.Provider value={contextValue}>
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

### CSS for View Transitions (Cognitive Load & Attention)
```css
/* Add to globals.css */

/* Page transition animations - optimized for cognitive processing */
.page-content {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
  will-change: opacity, transform; /* Performance optimization */
}

.page-transitioning .page-content {
  opacity: 0;
  transform: translateY(20px);
}

/* Loading indicator for slower connections */
.loading-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 50%, var(--primary) 100%);
  background-size: 200% 100%;
  animation: loading-progress 1.5s infinite;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 9999;
}

.show-loading-indicator .loading-indicator {
  opacity: 1;
}

@keyframes loading-progress {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

/* View transitions API - optimized for perceived performance */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-from-right {
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-to-left {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-20px); opacity: 0; }
}

/* Reduced motion preference support */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root) {
    animation: 150ms ease-out both fade-out;
  }

  ::view-transition-new(root) {
    animation: 150ms ease-in both fade-in;
  }
}

/* Standard animations */
::view-transition-old(root) {
  animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-out,
             300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-to-left;
}

::view-transition-new(root) {
  animation: 300ms cubic-bezier(0.4, 0, 0.2, 1) both fade-in,
             300ms cubic-bezier(0.4, 0, 0.2, 1) both slide-from-right;
}

/* Micro-interactions for feedback */
.btn-feedback {
  position: relative;
  overflow: hidden;
}

.btn-feedback::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.7);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.btn-feedback:active::after {
  opacity: 0.3;
  animation: ripple 600ms ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}
```

### Next.js Config Update (Performance Optimization)
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    viewTransition: true,
    optimizeCss: true, // Optimize CSS for better performance
    scrollRestoration: true, // Maintain scroll position during navigation
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Modern image formats for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive image sizes
  },
  // Optimize loading performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
}

module.exports = nextConfig
```
--------------------------------







Standardize Virtualization - Ensure all activity lists use the EnhancedVirtualizedActivityList component
Complete Offline Integration - Verify offline support is properly integrated with StudentActivityViewerClient
Implement Progressive Loading - Add priority loading for visible content in all list components
Standardize Skeleton Screens - Ensure all loading states use skeleton screens that match final UI
Add Lazy Loading for Images - Implement blur-up previews for all images
Optimize API Calls - Implement consistent SWR or React Query caching
Add Optimistic UI Updates - For all common actions (completing activities, etc.)
Enhance Loading Indicators - Add meaningful progress indicators with Labor Illusion
Add Educational Facts - During loading states across all components
Implement Time Remaining Indicators - That slightly underestimate actual time
Test Performance - With simulated network conditions and large datasets
Add Background Prefetching - For likely next actions in all components
Create Productive Waiting - With mini-learning opportunities during loads
Add Subtle Animations - During data loading (< 300ms)
Implement Gradual UI Changes - That feel natural (Weber's Law)