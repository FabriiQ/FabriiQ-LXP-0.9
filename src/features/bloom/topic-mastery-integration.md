# Topic Mastery Integration with Bloom's Taxonomy and Rubrics

This document outlines how to integrate topic mastery tracking and visualization with our Bloom's Taxonomy and rubrics implementation.

## Overview

Topic mastery represents a student's comprehensive understanding of a subject area, measured across the cognitive levels of Bloom's Taxonomy. By integrating topic mastery with our existing system, we can provide:

1. Detailed tracking of student progress through cognitive levels
2. Visual representation of mastery achievement
3. Targeted recommendations for improvement
4. Comprehensive reporting for teachers and administrators

## Topic Mastery Data Model

### 1. Topic Mastery Schema

```prisma
model TopicMastery {
  id                String              @id @default(cuid())
  studentId         String
  topicId           String
  subjectId         String
  
  // Mastery levels for each Bloom's level (0-100)
  rememberLevel     Int                 @default(0)
  understandLevel   Int                 @default(0)
  applyLevel        Int                 @default(0)
  analyzeLevel      Int                 @default(0)
  evaluateLevel     Int                 @default(0)
  createLevel       Int                 @default(0)
  
  // Overall mastery (weighted average)
  overallMastery    Int                 @default(0)
  
  // Timestamps
  lastUpdated       DateTime            @updatedAt
  createdAt         DateTime            @default(now())
  
  // Relationships
  student           User                @relation(fields: [studentId], references: [id])
  topic             Topic               @relation(fields: [topicId], references: [id])
  subject           Subject             @relation(fields: [subjectId], references: [id])
  assessmentResults AssessmentResult[]
}

model AssessmentResult {
  id                String              @id @default(cuid())
  studentId         String
  assessmentId      String
  topicMasteryId    String?
  
  // Results by Bloom's level
  bloomsResults     Json                // Detailed results by Bloom's level
  
  // Overall score
  score             Float
  maxScore          Float
  passingScore      Float
  
  // Timestamps
  submittedAt       DateTime            @default(now())
  
  // Relationships
  student           User                @relation(fields: [studentId], references: [id])
  assessment        Assessment          @relation(fields: [assessmentId], references: [id])
  topicMastery      TopicMastery?       @relation(fields: [topicMasteryId], references: [id])
}
```

### 2. TypeScript Interfaces

```typescript
export interface TopicMasteryData {
  id: string;
  studentId: string;
  topicId: string;
  subjectId: string;
  
  // Mastery levels for each Bloom's level (0-100)
  rememberLevel: number;
  understandLevel: number;
  applyLevel: number;
  analyzeLevel: number;
  evaluateLevel: number;
  createLevel: number;
  
  // Overall mastery (weighted average)
  overallMastery: number;
  
  // Metadata
  lastUpdated: Date;
  createdAt: Date;
  
  // Populated relationships
  student?: User;
  topic?: Topic;
  subject?: Subject;
  assessmentResults?: AssessmentResult[];
}

export interface BloomsLevelResult {
  level: BloomsTaxonomyLevel;
  score: number;
  maxScore: number;
  percentage: number;
  questionCount: number;
  correctCount: number;
}

export interface AssessmentResultData {
  id: string;
  studentId: string;
  assessmentId: string;
  topicMasteryId?: string;
  
  // Results by Bloom's level
  bloomsResults: BloomsLevelResult[];
  
  // Overall score
  score: number;
  maxScore: number;
  passingScore: number;
  percentage: number;
  passed: boolean;
  
  // Timestamps
  submittedAt: Date;
}
```

## Topic Mastery Calculation

### 1. Mastery Calculation Service

```typescript
// src/features/topic-mastery/services/mastery-calculator.service.ts
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { AssessmentResultData, TopicMasteryData } from '../types';

// Weights for each Bloom's level in overall mastery calculation
const MASTERY_WEIGHTS = {
  [BloomsTaxonomyLevel.REMEMBER]: 0.1,
  [BloomsTaxonomyLevel.UNDERSTAND]: 0.15,
  [BloomsTaxonomyLevel.APPLY]: 0.2,
  [BloomsTaxonomyLevel.ANALYZE]: 0.2,
  [BloomsTaxonomyLevel.EVALUATE]: 0.15,
  [BloomsTaxonomyLevel.CREATE]: 0.2
};

// Decay factor for older assessments (0.9 means 90% of previous value is retained)
const DECAY_FACTOR = 0.9;

export class MasteryCalculator {
  /**
   * Calculate topic mastery based on a new assessment result
   */
  public static calculateMastery(
    currentMastery: TopicMasteryData | null,
    newResult: AssessmentResultData
  ): TopicMasteryData {
    // If no current mastery, initialize a new one
    if (!currentMastery) {
      return this.initializeFromResult(newResult);
    }
    
    // Apply decay to current mastery levels
    const decayedMastery = this.applyDecay(currentMastery);
    
    // Update mastery levels based on new result
    const updatedMastery = this.updateMasteryLevels(decayedMastery, newResult);
    
    // Calculate overall mastery
    updatedMastery.overallMastery = this.calculateOverallMastery(updatedMastery);
    
    return updatedMastery;
  }
  
  /**
   * Initialize mastery from first assessment result
   */
  private static initializeFromResult(result: AssessmentResultData): TopicMasteryData {
    const mastery: Partial<TopicMasteryData> = {
      studentId: result.studentId,
      topicId: '', // Must be set by caller
      subjectId: '', // Must be set by caller
      rememberLevel: 0,
      understandLevel: 0,
      applyLevel: 0,
      analyzeLevel: 0,
      evaluateLevel: 0,
      createLevel: 0,
      overallMastery: 0
    };
    
    // Set initial levels based on result
    for (const levelResult of result.bloomsResults) {
      const level = levelResult.level.toLowerCase() as keyof typeof mastery;
      mastery[`${level}Level`] = levelResult.percentage;
    }
    
    // Calculate overall mastery
    mastery.overallMastery = this.calculateOverallMastery(mastery as TopicMasteryData);
    
    return mastery as TopicMasteryData;
  }
  
  /**
   * Apply decay to current mastery levels
   */
  private static applyDecay(mastery: TopicMasteryData): TopicMasteryData {
    const decayed = { ...mastery };
    
    decayed.rememberLevel = Math.round(decayed.rememberLevel * DECAY_FACTOR);
    decayed.understandLevel = Math.round(decayed.understandLevel * DECAY_FACTOR);
    decayed.applyLevel = Math.round(decayed.applyLevel * DECAY_FACTOR);
    decayed.analyzeLevel = Math.round(decayed.analyzeLevel * DECAY_FACTOR);
    decayed.evaluateLevel = Math.round(decayed.evaluateLevel * DECAY_FACTOR);
    decayed.createLevel = Math.round(decayed.createLevel * DECAY_FACTOR);
    
    return decayed;
  }
  
  /**
   * Update mastery levels based on new result
   */
  private static updateMasteryLevels(
    mastery: TopicMasteryData,
    result: AssessmentResultData
  ): TopicMasteryData {
    const updated = { ...mastery };
    
    // Update each Bloom's level
    for (const levelResult of result.bloomsResults) {
      const levelKey = `${levelResult.level.toLowerCase()}Level` as keyof typeof updated;
      const currentLevel = updated[levelKey] as number;
      
      // Weighted average: 70% previous, 30% new result
      updated[levelKey] = Math.round(currentLevel * 0.7 + levelResult.percentage * 0.3) as never;
    }
    
    return updated;
  }
  
  /**
   * Calculate overall mastery as weighted average of all levels
   */
  private static calculateOverallMastery(mastery: TopicMasteryData): number {
    let weightedSum = 0;
    let totalWeight = 0;
    
    weightedSum += mastery.rememberLevel * MASTERY_WEIGHTS[BloomsTaxonomyLevel.REMEMBER];
    weightedSum += mastery.understandLevel * MASTERY_WEIGHTS[BloomsTaxonomyLevel.UNDERSTAND];
    weightedSum += mastery.applyLevel * MASTERY_WEIGHTS[BloomsTaxonomyLevel.APPLY];
    weightedSum += mastery.analyzeLevel * MASTERY_WEIGHTS[BloomsTaxonomyLevel.ANALYZE];
    weightedSum += mastery.evaluateLevel * MASTERY_WEIGHTS[BloomsTaxonomyLevel.EVALUATE];
    weightedSum += mastery.createLevel * MASTERY_WEIGHTS[BloomsTaxonomyLevel.CREATE];
    
    totalWeight = Object.values(MASTERY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    
    return Math.round(weightedSum / totalWeight);
  }
}
```

## Integration with Existing Components

### 1. Student Profile Updates

The student profile should be updated to display topic mastery information:

```tsx
// src/components/student/TopicMasteryCard.tsx
import React from 'react';
import { TopicMasteryData } from '@/features/topic-mastery/types';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface TopicMasteryCardProps {
  topicMastery: TopicMasteryData;
}

export function TopicMasteryCard({ topicMastery }: TopicMasteryCardProps) {
  const masteryLevels = [
    { level: BloomsTaxonomyLevel.REMEMBER, value: topicMastery.rememberLevel, label: 'Remember' },
    { level: BloomsTaxonomyLevel.UNDERSTAND, value: topicMastery.understandLevel, label: 'Understand' },
    { level: BloomsTaxonomyLevel.APPLY, value: topicMastery.applyLevel, label: 'Apply' },
    { level: BloomsTaxonomyLevel.ANALYZE, value: topicMastery.analyzeLevel, label: 'Analyze' },
    { level: BloomsTaxonomyLevel.EVALUATE, value: topicMastery.evaluateLevel, label: 'Evaluate' },
    { level: BloomsTaxonomyLevel.CREATE, value: topicMastery.createLevel, label: 'Create' }
  ];
  
  return (
    <div className="topic-mastery-card">
      <div className="card-header">
        <h3>{topicMastery.topic?.name || 'Topic'} Mastery</h3>
        <div className="overall-mastery">
          <div className="mastery-badge" style={{ backgroundColor: getMasteryColor(topicMastery.overallMastery) }}>
            {topicMastery.overallMastery}%
          </div>
        </div>
      </div>
      
      <div className="mastery-levels">
        {masteryLevels.map(level => (
          <div key={level.level} className="mastery-level">
            <div className="level-label">{level.label}</div>
            <div className="level-bar-container">
              <div 
                className="level-bar" 
                style={{ 
                  width: `${level.value}%`,
                  backgroundColor: getMasteryColor(level.value)
                }}
              />
            </div>
            <div className="level-value">{level.value}%</div>
          </div>
        ))}
      </div>
      
      <div className="mastery-footer">
        <div className="last-updated">
          Last updated: {new Date(topicMastery.lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// Helper function to get color based on mastery level
function getMasteryColor(level: number): string {
  if (level >= 90) return '#4CAF50'; // Green
  if (level >= 75) return '#8BC34A'; // Light Green
  if (level >= 60) return '#FFEB3B'; // Yellow
  if (level >= 40) return '#FFC107'; // Amber
  return '#F44336'; // Red
}
```

### 2. Leaderboard Integration

Update the leaderboard to include topic mastery rankings:

```tsx
// src/components/leaderboard/TopicMasteryLeaderboard.tsx
import React from 'react';
import { TopicMasteryData } from '@/features/topic-mastery/types';

interface TopicMasteryLeaderboardProps {
  topicMasteries: (TopicMasteryData & { student: { name: string; avatar?: string } })[];
  topicName: string;
}

export function TopicMasteryLeaderboard({ topicMasteries, topicName }: TopicMasteryLeaderboardProps) {
  // Sort by overall mastery
  const sortedMasteries = [...topicMasteries].sort((a, b) => b.overallMastery - a.overallMastery);
  
  return (
    <div className="topic-mastery-leaderboard">
      <h3>{topicName} Mastery Leaderboard</h3>
      
      <div className="leaderboard-list">
        {sortedMasteries.map((mastery, index) => (
          <div key={mastery.id} className="leaderboard-item">
            <div className="rank">{index + 1}</div>
            <div className="student-info">
              {mastery.student.avatar && (
                <img src={mastery.student.avatar} alt={mastery.student.name} className="avatar" />
              )}
              <span className="name">{mastery.student.name}</span>
            </div>
            <div className="mastery-level">
              <div 
                className="mastery-badge"
                style={{ backgroundColor: getMasteryColor(mastery.overallMastery) }}
              >
                {mastery.overallMastery}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to get color based on mastery level
function getMasteryColor(level: number): string {
  if (level >= 90) return '#4CAF50'; // Green
  if (level >= 75) return '#8BC34A'; // Light Green
  if (level >= 60) return '#FFEB3B'; // Yellow
  if (level >= 40) return '#FFC107'; // Amber
  return '#F44336'; // Red
}
```

### 3. Teacher Class Interface Updates

Update the teacher class interface to show topic mastery analytics:

```tsx
// src/components/teacher/ClassMasteryAnalytics.tsx
import React from 'react';
import { TopicMasteryData } from '@/features/topic-mastery/types';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface ClassMasteryAnalyticsProps {
  classMasteries: TopicMasteryData[];
  topicName: string;
}

export function ClassMasteryAnalytics({ classMasteries, topicName }: ClassMasteryAnalyticsProps) {
  // Calculate average mastery levels for the class
  const averageMastery = {
    overall: calculateAverage(classMasteries.map(m => m.overallMastery)),
    remember: calculateAverage(classMasteries.map(m => m.rememberLevel)),
    understand: calculateAverage(classMasteries.map(m => m.understandLevel)),
    apply: calculateAverage(classMasteries.map(m => m.applyLevel)),
    analyze: calculateAverage(classMasteries.map(m => m.analyzeLevel)),
    evaluate: calculateAverage(classMasteries.map(m => m.evaluateLevel)),
    create: calculateAverage(classMasteries.map(m => m.createLevel))
  };
  
  // Calculate distribution of mastery levels
  const masteryDistribution = calculateMasteryDistribution(classMasteries);
  
  return (
    <div className="class-mastery-analytics">
      <h3>{topicName} Class Mastery Analytics</h3>
      
      <div className="analytics-summary">
        <div className="average-mastery">
          <h4>Average Mastery</h4>
          <div className="mastery-badge large" style={{ backgroundColor: getMasteryColor(averageMastery.overall) }}>
            {averageMastery.overall}%
          </div>
        </div>
        
        <div className="distribution">
          <h4>Mastery Distribution</h4>
          <div className="distribution-bars">
            <div className="distribution-bar">
              <div className="bar-label">Excellent (90%+)</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${masteryDistribution.excellent}%`,
                    backgroundColor: '#4CAF50'
                  }}
                />
              </div>
              <div className="bar-value">{masteryDistribution.excellent}%</div>
            </div>
            <div className="distribution-bar">
              <div className="bar-label">Good (75-89%)</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${masteryDistribution.good}%`,
                    backgroundColor: '#8BC34A'
                  }}
                />
              </div>
              <div className="bar-value">{masteryDistribution.good}%</div>
            </div>
            <div className="distribution-bar">
              <div className="bar-label">Satisfactory (60-74%)</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${masteryDistribution.satisfactory}%`,
                    backgroundColor: '#FFEB3B'
                  }}
                />
              </div>
              <div className="bar-value">{masteryDistribution.satisfactory}%</div>
            </div>
            <div className="distribution-bar">
              <div className="bar-label">Needs Improvement (40-59%)</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${masteryDistribution.needsImprovement}%`,
                    backgroundColor: '#FFC107'
                  }}
                />
              </div>
              <div className="bar-value">{masteryDistribution.needsImprovement}%</div>
            </div>
            <div className="distribution-bar">
              <div className="bar-label">Insufficient (<40%)</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${masteryDistribution.insufficient}%`,
                    backgroundColor: '#F44336'
                  }}
                />
              </div>
              <div className="bar-value">{masteryDistribution.insufficient}%</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="blooms-levels-analysis">
        <h4>Bloom's Taxonomy Levels Analysis</h4>
        <div className="levels-chart">
          {Object.entries(averageMastery)
            .filter(([key]) => key !== 'overall')
            .map(([key, value]) => (
              <div key={key} className="level-bar">
                <div className="level-label">{capitalizeFirstLetter(key)}</div>
                <div className="bar-container">
                  <div 
                    className="bar" 
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
      </div>
    </div>
  );
}

// Helper functions
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round(sum / values.length);
}

function calculateMasteryDistribution(masteries: TopicMasteryData[]) {
  const total = masteries.length;
  if (total === 0) {
    return {
      excellent: 0,
      good: 0,
      satisfactory: 0,
      needsImprovement: 0,
      insufficient: 0
    };
  }
  
  const counts = {
    excellent: masteries.filter(m => m.overallMastery >= 90).length,
    good: masteries.filter(m => m.overallMastery >= 75 && m.overallMastery < 90).length,
    satisfactory: masteries.filter(m => m.overallMastery >= 60 && m.overallMastery < 75).length,
    needsImprovement: masteries.filter(m => m.overallMastery >= 40 && m.overallMastery < 60).length,
    insufficient: masteries.filter(m => m.overallMastery < 40).length
  };
  
  return {
    excellent: Math.round((counts.excellent / total) * 100),
    good: Math.round((counts.good / total) * 100),
    satisfactory: Math.round((counts.satisfactory / total) * 100),
    needsImprovement: Math.round((counts.needsImprovement / total) * 100),
    insufficient: Math.round((counts.insufficient / total) * 100)
  };
}

function getMasteryColor(level: number): string {
  if (level >= 90) return '#4CAF50'; // Green
  if (level >= 75) return '#8BC34A'; // Light Green
  if (level >= 60) return '#FFEB3B'; // Yellow
  if (level >= 40) return '#FFC107'; // Amber
  return '#F44336'; // Red
}

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
```

## Integration with Assessment System

To update topic mastery when assessments are completed:

```typescript
// src/features/assessment/services/assessment-submission.service.ts
import { MasteryCalculator } from '@/features/topic-mastery/services/mastery-calculator.service';
import { prisma } from '@/lib/prisma';

export async function processAssessmentSubmission(
  studentId: string,
  assessmentId: string,
  answers: any[]
): Promise<any> {
  // Existing assessment processing code...
  
  // Calculate results by Bloom's level
  const bloomsResults = calculateBloomsResults(assessment, answers);
  
  // Save assessment result
  const result = await prisma.assessmentResult.create({
    data: {
      studentId,
      assessmentId,
      score,
      maxScore: assessment.maxScore,
      passingScore: assessment.passingScore,
      bloomsResults: bloomsResults
    }
  });
  
  // Update topic mastery
  await updateTopicMastery(studentId, assessment, result);
  
  return result;
}

async function updateTopicMastery(
  studentId: string,
  assessment: any,
  result: any
): Promise<void> {
  // Get topic ID from assessment
  const topicId = assessment.topicId;
  if (!topicId) return;
  
  // Get current topic mastery
  let topicMastery = await prisma.topicMastery.findFirst({
    where: {
      studentId,
      topicId
    }
  });
  
  // Calculate new mastery
  const newMastery = MasteryCalculator.calculateMastery(topicMastery, result);
  
  // Update or create topic mastery
  if (topicMastery) {
    await prisma.topicMastery.update({
      where: { id: topicMastery.id },
      data: {
        rememberLevel: newMastery.rememberLevel,
        understandLevel: newMastery.understandLevel,
        applyLevel: newMastery.applyLevel,
        analyzeLevel: newMastery.analyzeLevel,
        evaluateLevel: newMastery.evaluateLevel,
        createLevel: newMastery.createLevel,
        overallMastery: newMastery.overallMastery,
        assessmentResults: {
          connect: { id: result.id }
        }
      }
    });
  } else {
    await prisma.topicMastery.create({
      data: {
        studentId,
        topicId,
        subjectId: assessment.subjectId,
        rememberLevel: newMastery.rememberLevel,
        understandLevel: newMastery.understandLevel,
        applyLevel: newMastery.applyLevel,
        analyzeLevel: newMastery.analyzeLevel,
        evaluateLevel: newMastery.evaluateLevel,
        createLevel: newMastery.createLevel,
        overallMastery: newMastery.overallMastery,
        assessmentResults: {
          connect: { id: result.id }
        }
      }
    });
  }
}
```

## Student Achievement Integration

Add topic mastery achievements:

```typescript
// src/features/achievements/topic-mastery-achievements.ts
import { Achievement, AchievementType } from './types';

export const topicMasteryAchievements: Achievement[] = [
  {
    id: 'topic-master-bronze',
    title: 'Topic Master Bronze',
    description: 'Achieve at least 60% mastery in any topic',
    type: AchievementType.TOPIC_MASTERY,
    icon: 'trophy-bronze',
    condition: (student) => {
      return student.topicMasteries.some(mastery => mastery.overallMastery >= 60);
    }
  },
  {
    id: 'topic-master-silver',
    title: 'Topic Master Silver',
    description: 'Achieve at least 75% mastery in any topic',
    type: AchievementType.TOPIC_MASTERY,
    icon: 'trophy-silver',
    condition: (student) => {
      return student.topicMasteries.some(mastery => mastery.overallMastery >= 75);
    }
  },
  {
    id: 'topic-master-gold',
    title: 'Topic Master Gold',
    description: 'Achieve at least 90% mastery in any topic',
    type: AchievementType.TOPIC_MASTERY,
    icon: 'trophy-gold',
    condition: (student) => {
      return student.topicMasteries.some(mastery => mastery.overallMastery >= 90);
    }
  },
  {
    id: 'bloom-master',
    title: 'Bloom Master',
    description: 'Achieve at least 80% mastery in all Bloom\'s levels for any topic',
    type: AchievementType.TOPIC_MASTERY,
    icon: 'bloom',
    condition: (student) => {
      return student.topicMasteries.some(mastery => 
        mastery.rememberLevel >= 80 &&
        mastery.understandLevel >= 80 &&
        mastery.applyLevel >= 80 &&
        mastery.analyzeLevel >= 80 &&
        mastery.evaluateLevel >= 80 &&
        mastery.createLevel >= 80
      );
    }
  },
  {
    id: 'subject-master',
    title: 'Subject Master',
    description: 'Achieve at least 75% mastery in all topics of a subject',
    type: AchievementType.TOPIC_MASTERY,
    icon: 'book',
    condition: (student) => {
      // Group masteries by subject
      const subjectMasteries = {};
      student.topicMasteries.forEach(mastery => {
        if (!subjectMasteries[mastery.subjectId]) {
          subjectMasteries[mastery.subjectId] = [];
        }
        subjectMasteries[mastery.subjectId].push(mastery);
      });
      
      // Check if all topics in any subject have at least 75% mastery
      return Object.values(subjectMasteries).some((masteries: any[]) => {
        return masteries.length > 0 && masteries.every(m => m.overallMastery >= 75);
      });
    }
  }
];
```

## Conclusion

This topic mastery integration provides a comprehensive way to track student progress through Bloom's Taxonomy levels. By integrating with our existing assessment system and rubrics, we can provide detailed insights into student understanding and achievement.

The implementation includes:

1. Data models for tracking mastery at each cognitive level
2. Calculation services for updating mastery based on assessment results
3. UI components for visualizing mastery in student profiles
4. Leaderboard integration for fostering healthy competition
5. Teacher analytics for monitoring class progress
6. Achievement system integration for motivating students

This approach ensures that topic mastery is not just a single score but a nuanced view of a student's cognitive development across all levels of Bloom's Taxonomy.
