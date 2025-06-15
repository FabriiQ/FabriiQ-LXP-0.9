# System Integration Updates for Bloom's Taxonomy and Topic Mastery

This document outlines the necessary updates to existing system components to fully integrate Bloom's Taxonomy, rubrics, and topic mastery tracking.

## Overview

With the implementation of Bloom's Taxonomy, rubrics, and topic mastery, several existing system components need to be updated to ensure seamless integration. These updates will enhance the educational value of our platform while maintaining compatibility with existing functionality.

## Student Profile Updates

### 1. Student Dashboard

The student dashboard should be updated to display:

- Topic mastery progress cards
- Bloom's level achievements
- Recommended activities based on mastery gaps

```tsx
// src/components/student/dashboard/MasteryProgressSection.tsx
import React from 'react';
import { TopicMasteryCard } from '@/components/student/TopicMasteryCard';
import { useTopicMasteries } from '@/features/topic-mastery/hooks/useTopicMasteries';

export function MasteryProgressSection({ studentId }: { studentId: string }) {
  const { topicMasteries, isLoading } = useTopicMasteries(studentId);
  
  if (isLoading) return <div>Loading mastery data...</div>;
  
  if (!topicMasteries || topicMasteries.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Mastery Data Yet</h3>
        <p>Complete assessments to start tracking your topic mastery.</p>
      </div>
    );
  }
  
  // Sort by last updated
  const sortedMasteries = [...topicMasteries].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
  
  return (
    <div className="mastery-progress-section">
      <h2>Topic Mastery Progress</h2>
      
      <div className="mastery-cards">
        {sortedMasteries.slice(0, 3).map(mastery => (
          <TopicMasteryCard key={mastery.id} topicMastery={mastery} />
        ))}
      </div>
      
      {sortedMasteries.length > 3 && (
        <div className="view-all">
          <a href="/student/masteries">View All Masteries</a>
        </div>
      )}
    </div>
  );
}
```

### 2. Student Profile Page

Add a dedicated section for Bloom's Taxonomy mastery:

```tsx
// src/pages/student/profile.tsx
import { BloomsMasterySection } from '@/components/student/BloomsMasterySection';

// Add to existing profile page
<BloomsMasterySection studentId={studentId} />
```

## Teacher Interface Updates

### 1. Class Overview Dashboard

Update the class overview to include Bloom's Taxonomy and mastery metrics:

```tsx
// src/components/teacher/dashboard/ClassBloomsSummary.tsx
import React from 'react';
import { useClassMasteryAnalytics } from '@/features/topic-mastery/hooks/useClassMasteryAnalytics';

export function ClassBloomsSummary({ classId }: { classId: string }) {
  const { analytics, isLoading } = useClassMasteryAnalytics(classId);
  
  if (isLoading) return <div>Loading analytics...</div>;
  
  if (!analytics) {
    return (
      <div className="empty-state">
        <h3>No Mastery Data Available</h3>
        <p>Students need to complete assessments to generate mastery data.</p>
      </div>
    );
  }
  
  return (
    <div className="class-blooms-summary">
      <h2>Class Bloom's Taxonomy Progress</h2>
      
      <div className="blooms-levels-summary">
        {Object.entries(analytics.averageLevels).map(([level, value]) => (
          <div key={level} className="level-summary">
            <div className="level-name">{formatLevelName(level)}</div>
            <div className="level-progress">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${value}%`,
                  backgroundColor: getMasteryColor(value)
                }}
              />
            </div>
            <div className="level-value">{value}%</div>
          </div>
        ))}
      </div>
      
      <div className="mastery-gaps">
        <h3>Mastery Gaps</h3>
        {analytics.masteryGaps.length > 0 ? (
          <ul className="gaps-list">
            {analytics.masteryGaps.map((gap, index) => (
              <li key={index} className="gap-item">
                <span className="gap-level">{formatLevelName(gap.level)}</span>
                <span className="gap-description">{gap.description}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No significant mastery gaps detected.</p>
        )}
      </div>
    </div>
  );
}

function formatLevelName(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getMasteryColor(level: number): string {
  if (level >= 90) return '#4CAF50'; // Green
  if (level >= 75) return '#8BC34A'; // Light Green
  if (level >= 60) return '#FFEB3B'; // Yellow
  if (level >= 40) return '#FFC107'; // Amber
  return '#F44336'; // Red
}
```

### 2. Student Progress View

Enhance the student progress view with Bloom's Taxonomy details:

```tsx
// src/components/teacher/student-progress/BloomsProgressTab.tsx
import React from 'react';
import { useStudentMasteries } from '@/features/topic-mastery/hooks/useStudentMasteries';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

export function BloomsProgressTab({ studentId }: { studentId: string }) {
  const { masteries, isLoading } = useStudentMasteries(studentId);
  
  if (isLoading) return <div>Loading student mastery data...</div>;
  
  if (!masteries || masteries.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Bloom's Taxonomy Data</h3>
        <p>This student hasn't completed any assessments with Bloom's Taxonomy alignment yet.</p>
      </div>
    );
  }
  
  // Calculate average mastery for each Bloom's level across all topics
  const averageLevels = calculateAverageLevels(masteries);
  
  return (
    <div className="blooms-progress-tab">
      <h2>Bloom's Taxonomy Progress</h2>
      
      <div className="blooms-radar-chart">
        {/* Radar chart visualization of Bloom's levels */}
        <BloomsRadarChart levels={averageLevels} />
      </div>
      
      <div className="topics-breakdown">
        <h3>Topic Breakdown</h3>
        <table className="topics-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Remember</th>
              <th>Understand</th>
              <th>Apply</th>
              <th>Analyze</th>
              <th>Evaluate</th>
              <th>Create</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {masteries.map(mastery => (
              <tr key={mastery.id}>
                <td>{mastery.topic?.name || 'Unknown Topic'}</td>
                <td className={getMasteryClass(mastery.rememberLevel)}>{mastery.rememberLevel}%</td>
                <td className={getMasteryClass(mastery.understandLevel)}>{mastery.understandLevel}%</td>
                <td className={getMasteryClass(mastery.applyLevel)}>{mastery.applyLevel}%</td>
                <td className={getMasteryClass(mastery.analyzeLevel)}>{mastery.analyzeLevel}%</td>
                <td className={getMasteryClass(mastery.evaluateLevel)}>{mastery.evaluateLevel}%</td>
                <td className={getMasteryClass(mastery.createLevel)}>{mastery.createLevel}%</td>
                <td className={getMasteryClass(mastery.overallMastery)}>{mastery.overallMastery}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="recommendations">
        <h3>Recommendations</h3>
        <ul className="recommendations-list">
          {generateRecommendations(masteries).map((rec, index) => (
            <li key={index} className="recommendation-item">
              <span className="recommendation-level">{rec.level}</span>
              <span className="recommendation-text">{rec.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Helper functions
function calculateAverageLevels(masteries) {
  // Implementation...
}

function getMasteryClass(level: number): string {
  if (level >= 90) return 'mastery-excellent';
  if (level >= 75) return 'mastery-good';
  if (level >= 60) return 'mastery-satisfactory';
  if (level >= 40) return 'mastery-needs-improvement';
  return 'mastery-insufficient';
}

function generateRecommendations(masteries) {
  // Implementation...
}
```

## Assessment System Updates

### 1. Assessment Results Page

Update the assessment results page to show Bloom's Taxonomy breakdown:

```tsx
// src/components/assessment/results/BloomsBreakdown.tsx
import React from 'react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface BloomsBreakdownProps {
  bloomsResults: {
    level: BloomsTaxonomyLevel;
    score: number;
    maxScore: number;
    percentage: number;
  }[];
}

export function BloomsBreakdown({ bloomsResults }: BloomsBreakdownProps) {
  if (!bloomsResults || bloomsResults.length === 0) {
    return null;
  }
  
  return (
    <div className="blooms-breakdown">
      <h3>Bloom's Taxonomy Breakdown</h3>
      
      <div className="breakdown-chart">
        {bloomsResults.map(result => (
          <div key={result.level} className="level-result">
            <div className="level-name">{formatLevelName(result.level)}</div>
            <div className="level-bar-container">
              <div 
                className="level-bar" 
                style={{ 
                  width: `${result.percentage}%`,
                  backgroundColor: getMasteryColor(result.percentage)
                }}
              />
            </div>
            <div className="level-score">
              {result.score}/{result.maxScore} ({result.percentage}%)
            </div>
          </div>
        ))}
      </div>
      
      <div className="blooms-explanation">
        <h4>What This Means</h4>
        <p>
          This breakdown shows your performance across different cognitive levels of Bloom's Taxonomy.
          Higher levels represent more complex thinking skills.
        </p>
        <ul>
          <li><strong>Remember:</strong> Recalling facts and basic concepts</li>
          <li><strong>Understand:</strong> Explaining ideas or concepts</li>
          <li><strong>Apply:</strong> Using information in new situations</li>
          <li><strong>Analyze:</strong> Drawing connections among ideas</li>
          <li><strong>Evaluate:</strong> Justifying a stand or decision</li>
          <li><strong>Create:</strong> Producing new or original work</li>
        </ul>
      </div>
    </div>
  );
}

function formatLevelName(level: BloomsTaxonomyLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getMasteryColor(percentage: number): string {
  if (percentage >= 90) return '#4CAF50'; // Green
  if (percentage >= 75) return '#8BC34A'; // Light Green
  if (percentage >= 60) return '#FFEB3B'; // Yellow
  if (percentage >= 40) return '#FFC107'; // Amber
  return '#F44336'; // Red
}
```

### 2. Assessment Creation Flow

Add Bloom's Taxonomy distribution visualization to the assessment creation flow:

```tsx
// src/components/assessment/creation/BloomsDistributionChart.tsx
import React from 'react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface BloomsDistributionChartProps {
  questions: {
    id: string;
    bloomsLevel: BloomsTaxonomyLevel;
    // other question properties
  }[];
}

export function BloomsDistributionChart({ questions }: BloomsDistributionChartProps) {
  // Calculate distribution
  const distribution = calculateDistribution(questions);
  
  // Calculate recommended distribution based on learning outcomes
  const recommendedDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 20,
    [BloomsTaxonomyLevel.UNDERSTAND]: 25,
    [BloomsTaxonomyLevel.APPLY]: 30,
    [BloomsTaxonomyLevel.ANALYZE]: 15,
    [BloomsTaxonomyLevel.EVALUATE]: 5,
    [BloomsTaxonomyLevel.CREATE]: 5
  };
  
  return (
    <div className="blooms-distribution-chart">
      <h3>Bloom's Taxonomy Distribution</h3>
      
      <div className="distribution-bars">
        {Object.entries(BloomsTaxonomyLevel).map(([key, level]) => (
          <div key={level} className="level-distribution">
            <div className="level-name">{formatLevelName(level)}</div>
            <div className="distribution-bar-container">
              <div 
                className="actual-bar" 
                style={{ 
                  width: `${distribution[level] || 0}%`,
                  backgroundColor: getBloomsLevelColor(level)
                }}
              />
              <div 
                className="recommended-marker"
                style={{
                  left: `${recommendedDistribution[level]}%`
                }}
              />
            </div>
            <div className="distribution-values">
              <span className="actual-value">{distribution[level] || 0}%</span>
              <span className="recommended-value">({recommendedDistribution[level]}%)</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="distribution-legend">
        <div className="legend-item">
          <div className="legend-color actual"></div>
          <div className="legend-label">Actual Distribution</div>
        </div>
        <div className="legend-item">
          <div className="legend-color recommended"></div>
          <div className="legend-label">Recommended Distribution</div>
        </div>
      </div>
      
      {!isBalanced(distribution, recommendedDistribution) && (
        <div className="distribution-warning">
          <p>
            <strong>Note:</strong> Your current question distribution doesn't match the recommended
            distribution for the selected learning outcomes. Consider adding more questions at the
            levels marked with a significant difference.
          </p>
        </div>
      )}
    </div>
  );
}

// Helper functions
function calculateDistribution(questions) {
  // Implementation...
}

function formatLevelName(level: BloomsTaxonomyLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getBloomsLevelColor(level: BloomsTaxonomyLevel): string {
  switch (level) {
    case BloomsTaxonomyLevel.REMEMBER: return '#E3F2FD'; // Light Blue
    case BloomsTaxonomyLevel.UNDERSTAND: return '#90CAF9'; // Blue
    case BloomsTaxonomyLevel.APPLY: return '#42A5F5'; // Medium Blue
    case BloomsTaxonomyLevel.ANALYZE: return '#1E88E5'; // Dark Blue
    case BloomsTaxonomyLevel.EVALUATE: return '#1565C0'; // Darker Blue
    case BloomsTaxonomyLevel.CREATE: return '#0D47A1'; // Darkest Blue
    default: return '#BBDEFB'; // Default Blue
  }
}

function isBalanced(actual, recommended) {
  // Implementation...
}
```

## Leaderboard System Updates

### 1. Bloom's Mastery Leaderboard

Add a specialized leaderboard for Bloom's Taxonomy mastery:

```tsx
// src/components/leaderboard/BloomsMasteryLeaderboard.tsx
import React, { useState } from 'react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface BloomsMasteryLeaderboardProps {
  classId: string;
  subjectId?: string;
  topicId?: string;
}

export function BloomsMasteryLeaderboard({ 
  classId, 
  subjectId, 
  topicId 
}: BloomsMasteryLeaderboardProps) {
  const [selectedLevel, setSelectedLevel] = useState<BloomsTaxonomyLevel | 'overall'>(
    'overall'
  );
  
  const { leaderboardData, isLoading } = useBloomsMasteryLeaderboard(
    classId, 
    subjectId, 
    topicId,
    selectedLevel
  );
  
  if (isLoading) return <div>Loading leaderboard...</div>;
  
  return (
    <div className="blooms-mastery-leaderboard">
      <h2>Bloom's Mastery Leaderboard</h2>
      
      <div className="level-selector">
        <button 
          className={selectedLevel === 'overall' ? 'active' : ''}
          onClick={() => setSelectedLevel('overall')}
        >
          Overall
        </button>
        {Object.values(BloomsTaxonomyLevel).map(level => (
          <button
            key={level}
            className={selectedLevel === level ? 'active' : ''}
            onClick={() => setSelectedLevel(level)}
          >
            {formatLevelName(level)}
          </button>
        ))}
      </div>
      
      <div className="leaderboard-list">
        {leaderboardData.map((entry, index) => (
          <div key={entry.studentId} className="leaderboard-entry">
            <div className="rank">{index + 1}</div>
            <div className="student-info">
              <img 
                src={entry.student.avatar || '/default-avatar.png'} 
                alt={entry.student.name}
                className="avatar"
              />
              <span className="name">{entry.student.name}</span>
            </div>
            <div className="mastery-level">
              <div 
                className="mastery-badge"
                style={{ backgroundColor: getMasteryColor(entry.masteryLevel) }}
              >
                {entry.masteryLevel}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions and hooks
function formatLevelName(level: BloomsTaxonomyLevel | 'overall'): string {
  if (level === 'overall') return 'Overall';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getMasteryColor(level: number): string {
  if (level >= 90) return '#4CAF50'; // Green
  if (level >= 75) return '#8BC34A'; // Light Green
  if (level >= 60) return '#FFEB3B'; // Yellow
  if (level >= 40) return '#FFC107'; // Amber
  return '#F44336'; // Red
}

function useBloomsMasteryLeaderboard(
  classId: string,
  subjectId?: string,
  topicId?: string,
  level: BloomsTaxonomyLevel | 'overall' = 'overall'
) {
  // Implementation...
}
```

## Conclusion

These system integration updates ensure that Bloom's Taxonomy, rubrics, and topic mastery are seamlessly incorporated into our existing platform. By enhancing the student profile, teacher interface, assessment system, and leaderboard, we provide a comprehensive educational experience that promotes deeper learning and mastery across all cognitive levels.
