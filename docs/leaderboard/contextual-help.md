# Leaderboard Contextual Help Implementation Guide

This document provides guidelines for implementing contextual help within the leaderboard interface. Contextual help provides users with relevant information and guidance at the point of need, improving usability and reducing support requests.

## Implementation Strategy

The leaderboard system implements contextual help through several mechanisms:

1. **Tooltips**: Brief explanations that appear when hovering over UI elements
2. **Help Icons**: Clickable icons that display more detailed information
3. **Guided Tours**: Step-by-step walkthroughs of key features
4. **Contextual Panels**: Collapsible panels with context-specific guidance
5. **Smart Suggestions**: AI-powered recommendations based on user behavior

## Tooltip Implementation

Tooltips provide brief explanations of UI elements:

```jsx
// Basic tooltip implementation
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

function RankColumn({ rank, previousRank }) {
  const rankChange = previousRank ? previousRank - rank : 0;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="rank-cell">
          {rank}
          {rankChange !== 0 && (
            <span className={`rank-change ${rankChange > 0 ? 'positive' : 'negative'}`}>
              {rankChange > 0 ? '↑' : '↓'}{Math.abs(rankChange)}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Current rank: {rank}</p>
        {rankChange !== 0 && (
          <p>
            {rankChange > 0 
              ? `Improved by ${rankChange} position(s) since last period` 
              : `Decreased by ${Math.abs(rankChange)} position(s) since last period`}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
```

Tooltip guidelines:
- Keep content brief (1-2 sentences)
- Position consistently (right or bottom preferred)
- Use for explaining UI elements, not for primary instructions
- Ensure they work on touch devices (tap to show)
- Include keyboard accessibility

## Help Icons

Help icons provide more detailed information:

```jsx
// Help icon implementation
import { HelpCircle } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function PointsColumnHeader() {
  return (
    <div className="column-header">
      <span>Points</span>
      <Dialog>
        <DialogTrigger asChild>
          <button className="help-icon">
            <HelpCircle size={16} />
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>About Points</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p>Points represent the total achievement score earned by students.</p>
            <h4>How points are earned:</h4>
            <ul>
              <li>Completing assignments: 10-50 points</li>
              <li>Class participation: 5-15 points</li>
              <li>Bonus activities: Varies by activity</li>
            </ul>
            <p>Points are calculated based on the selected time period (daily, weekly, monthly, term, or all-time).</p>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

Help icon guidelines:
- Place consistently (usually after labels or headers)
- Use recognizable icons (question mark or info icon)
- Provide more detailed information than tooltips
- Include visual examples when helpful
- Consider including links to related documentation

## Guided Tours

Guided tours walk users through key features:

```jsx
// Guided tour implementation
import { useEffect, useState } from 'react';
import { Tour, TourStep } from '@/components/ui/tour';

function LeaderboardWithTour() {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentUser] = useUser();
  
  // Show tour for first-time users
  useEffect(() => {
    if (currentUser?.preferences?.hasSeenLeaderboardTour !== true) {
      setIsTourOpen(true);
    }
  }, [currentUser]);
  
  const handleTourComplete = async () => {
    setIsTourOpen(false);
    // Update user preferences
    await updateUserPreferences({
      hasSeenLeaderboardTour: true
    });
  };
  
  return (
    <div>
      <LeaderboardComponent />
      
      <Tour
        isOpen={isTourOpen}
        onRequestClose={() => setIsTourOpen(false)}
        onComplete={handleTourComplete}
        steps={[
          {
            target: '.time-period-selector',
            content: 'Select different time periods to view rankings over different timeframes.',
            placement: 'bottom'
          },
          {
            target: '.rank-column',
            content: 'The rank column shows each student\'s position. Arrows indicate changes from the previous period.',
            placement: 'right'
          },
          {
            target: '.search-bar',
            content: 'Use the search bar to quickly find specific students.',
            placement: 'bottom'
          },
          {
            target: '.current-user-row',
            content: 'Your position is highlighted for easy reference.',
            placement: 'top'
          }
        ]}
      />
      
      <Button onClick={() => setIsTourOpen(true)}>
        Show Tour
      </Button>
    </div>
  );
}
```

Guided tour guidelines:
- Limit to 4-6 steps for initial tours
- Focus on key functionality
- Allow users to skip or pause
- Remember completion state
- Provide a way to replay the tour
- Consider role-specific tours

## Contextual Panels

Contextual help panels provide detailed guidance:

```jsx
// Contextual panel implementation
import { useState } from 'react';
import { Panel, PanelTrigger, PanelContent } from '@/components/ui/panel';
import { ChevronRight, ChevronDown } from 'lucide-react';

function LeaderboardWithHelpPanel() {
  const [activePanel, setActivePanel] = useState(null);
  
  return (
    <div className="leaderboard-container">
      <div className="leaderboard-main">
        <LeaderboardComponent />
      </div>
      
      <div className="help-panels">
        <Panel
          isOpen={activePanel === 'understanding'}
          onToggle={() => setActivePanel(activePanel === 'understanding' ? null : 'understanding')}
        >
          <PanelTrigger>
            {activePanel === 'understanding' ? <ChevronDown /> : <ChevronRight />}
            Understanding the Leaderboard
          </PanelTrigger>
          <PanelContent>
            <h4>Reading the Leaderboard</h4>
            <p>The leaderboard displays student rankings based on points earned.</p>
            <ul>
              <li><strong>Rank:</strong> Student's position relative to peers</li>
              <li><strong>Points:</strong> Total points earned in the selected period</li>
              <li><strong>Level:</strong> Achievement level based on cumulative points</li>
            </ul>
            <img src="/help/leaderboard-anatomy.png" alt="Leaderboard anatomy" />
          </PanelContent>
        </Panel>
        
        <Panel
          isOpen={activePanel === 'tips'}
          onToggle={() => setActivePanel(activePanel === 'tips' ? null : 'tips')}
        >
          <PanelTrigger>
            {activePanel === 'tips' ? <ChevronDown /> : <ChevronRight />}
            Tips for Improvement
          </PanelTrigger>
          <PanelContent>
            <h4>How to Improve Your Ranking</h4>
            <ul>
              <li>Complete assignments on time</li>
              <li>Participate actively in class</li>
              <li>Take advantage of bonus point opportunities</li>
              <li>Maintain consistent performance</li>
            </ul>
          </PanelContent>
        </Panel>
      </div>
    </div>
  );
}
```

Contextual panel guidelines:
- Group related help topics
- Allow collapsing/expanding
- Include visual aids when helpful
- Position consistently (usually right side or bottom)
- Consider user context (role, experience level)

## Smart Suggestions

AI-powered contextual suggestions:

```jsx
// Smart suggestions implementation
import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';

function SmartLeaderboardSuggestions({ userData, leaderboardData }) {
  const [suggestions, setSuggestions] = useState([]);
  
  useEffect(() => {
    // Generate contextual suggestions based on user behavior and data
    const newSuggestions = [];
    
    // Suggestion 1: First-time user
    if (!userData.hasViewedLeaderboard) {
      newSuggestions.push({
        id: 'first-time',
        title: 'Welcome to the Leaderboard!',
        description: 'This is where you can track your ranking and progress. Try changing the time period to see different views.',
        action: 'Take a tour',
        actionHandler: () => startTour()
      });
    }
    
    // Suggestion 2: Rank decreased
    if (userData.previousRank && userData.currentRank > userData.previousRank) {
      newSuggestions.push({
        id: 'rank-decrease',
        title: 'Your rank has decreased',
        description: `You've moved from rank ${userData.previousRank} to ${userData.currentRank}. Complete pending assignments to improve your position.`,
        action: 'View pending tasks',
        actionHandler: () => navigateToTasks()
      });
    }
    
    // Suggestion 3: Close to next level
    const pointsToNextLevel = userData.nextLevelThreshold - userData.points;
    if (pointsToNextLevel <= 50) {
      newSuggestions.push({
        id: 'near-level-up',
        title: 'Almost to the next level!',
        description: `You're only ${pointsToNextLevel} points away from reaching Level ${userData.currentLevel + 1}.`,
        action: 'Find ways to earn points',
        actionHandler: () => showPointsOpportunities()
      });
    }
    
    setSuggestions(newSuggestions);
  }, [userData, leaderboardData]);
  
  const dismissSuggestion = (id) => {
    setSuggestions(suggestions.filter(s => s.id !== id));
  };
  
  return (
    <div className="suggestions-container">
      {suggestions.map(suggestion => (
        <Alert key={suggestion.id} className="suggestion">
          <button 
            className="dismiss-button" 
            onClick={() => dismissSuggestion(suggestion.id)}
          >
            <X size={16} />
          </button>
          <AlertTitle>{suggestion.title}</AlertTitle>
          <AlertDescription>{suggestion.description}</AlertDescription>
          {suggestion.action && (
            <button 
              className="suggestion-action"
              onClick={suggestion.actionHandler}
            >
              {suggestion.action}
            </button>
          )}
        </Alert>
      ))}
    </div>
  );
}
```

Smart suggestion guidelines:
- Base suggestions on actual user behavior
- Limit to 2-3 suggestions at a time
- Allow dismissing individual suggestions
- Include actionable recommendations
- Personalize based on user context
- Avoid interrupting the main workflow

## Implementation Checklist

When implementing contextual help:

- [ ] Identify key areas where users need assistance
- [ ] Choose appropriate help mechanisms for each area
- [ ] Write clear, concise help content
- [ ] Test with users of different experience levels
- [ ] Ensure accessibility compliance
- [ ] Implement tracking to measure help effectiveness
- [ ] Create a process for updating help content

## Content Guidelines

When writing contextual help content:

1. **Be concise**: Use simple language and short sentences
2. **Be specific**: Address the exact task or concept
3. **Be actionable**: Tell users what to do, not just what something is
4. **Use visuals**: Include screenshots or diagrams when helpful
5. **Consider context**: Adapt content based on user role and experience
6. **Use consistent terminology**: Match terms used elsewhere in the UI
7. **Focus on common tasks**: Prioritize help for frequently used features

## Accessibility Considerations

Ensure contextual help is accessible to all users:

- Ensure all help content is screen reader compatible
- Provide keyboard shortcuts for accessing help
- Maintain sufficient color contrast for readability
- Allow adjusting text size without breaking layouts
- Ensure tooltips and popups don't disappear too quickly
- Provide alternatives to hover-based interactions for mobile users

## Measuring Effectiveness

Track the effectiveness of contextual help:

- Monitor help usage (which help items are accessed most)
- Track support requests related to leaderboard features
- Measure task completion rates before and after help implementation
- Collect user feedback on help usefulness
- Analyze user behavior after viewing help content
