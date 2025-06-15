# Topic Mastery Analytics

This document outlines the analytics capabilities for tracking and visualizing topic mastery across Bloom's Taxonomy levels.

## Overview

Topic mastery analytics provide insights into student progress across different cognitive levels of Bloom's Taxonomy. These analytics help teachers identify learning gaps, track student growth, and make data-driven instructional decisions.

## Analytics Data Models

### 1. Student Mastery Analytics

```typescript
export interface StudentMasteryAnalytics {
  studentId: string;
  studentName: string;
  
  // Overall mastery metrics
  overallMastery: number;
  masteryBySubject: {
    [subjectId: string]: {
      subjectName: string;
      overallMastery: number;
      topicsMastered: number;
      totalTopics: number;
    }
  };
  
  // Bloom's level breakdown
  bloomsLevels: {
    [level in BloomsTaxonomyLevel]: {
      averageMastery: number;
      strengths: string[];
      weaknesses: string[];
    }
  };
  
  // Growth metrics
  growth: {
    overall: number; // Percentage points improvement in last 30 days
    byLevel: {
      [level in BloomsTaxonomyLevel]: number;
    }
  };
  
  // Mastery gaps
  masteryGaps: {
    topicId: string;
    topicName: string;
    level: BloomsTaxonomyLevel;
    currentMastery: number;
    targetMastery: number;
    gap: number;
  }[];
  
  // Recommendations
  recommendations: {
    type: 'activity' | 'assessment' | 'resource';
    level: BloomsTaxonomyLevel;
    description: string;
    resourceId?: string;
  }[];
}
```

### 2. Class Mastery Analytics

```typescript
export interface ClassMasteryAnalytics {
  classId: string;
  className: string;
  
  // Overall class metrics
  averageMastery: number;
  masteryDistribution: {
    excellent: number; // Percentage of students with 90%+ mastery
    good: number; // Percentage of students with 75-89% mastery
    satisfactory: number; // Percentage of students with 60-74% mastery
    needsImprovement: number; // Percentage of students with 40-59% mastery
    insufficient: number; // Percentage of students with <40% mastery
  };
  
  // Bloom's level breakdown
  bloomsLevels: {
    [level in BloomsTaxonomyLevel]: {
      averageMastery: number;
      distribution: {
        excellent: number;
        good: number;
        satisfactory: number;
        needsImprovement: number;
        insufficient: number;
      }
    }
  };
  
  // Topic mastery breakdown
  topicMastery: {
    [topicId: string]: {
      topicName: string;
      averageMastery: number;
      bloomsLevels: {
        [level in BloomsTaxonomyLevel]: number;
      }
    }
  };
  
  // Class mastery gaps
  masteryGaps: {
    topicId: string;
    topicName: string;
    level: BloomsTaxonomyLevel;
    averageMastery: number;
    targetMastery: number;
    gap: number;
    affectedStudents: number; // Number of students below target
  }[];
  
  // Recommendations
  recommendations: {
    type: 'activity' | 'assessment' | 'resource' | 'intervention';
    level: BloomsTaxonomyLevel;
    description: string;
    targetGroup: 'all' | 'below-average' | 'specific-students';
    studentIds?: string[]; // For specific students
  }[];
}
```

## Analytics Generation

### 1. Student Mastery Analytics Service

```typescript
// src/features/topic-mastery/services/student-analytics.service.ts
import { prisma } from '@/lib/prisma';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { StudentMasteryAnalytics } from '../types';

export async function generateStudentMasteryAnalytics(
  studentId: string
): Promise<StudentMasteryAnalytics> {
  // Fetch all topic masteries for the student
  const topicMasteries = await prisma.topicMastery.findMany({
    where: { studentId },
    include: {
      topic: {
        select: { id: true, name: true, subjectId: true }
      },
      subject: {
        select: { id: true, name: true }
      },
      assessmentResults: {
        orderBy: { submittedAt: 'desc' },
        take: 10
      }
    }
  });
  
  // Fetch student info
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true }
  });
  
  // Calculate overall mastery
  const overallMastery = calculateAverageMastery(topicMasteries);
  
  // Calculate mastery by subject
  const masteryBySubject = calculateMasteryBySubject(topicMasteries);
  
  // Calculate Bloom's level breakdown
  const bloomsLevels = calculateBloomsLevels(topicMasteries);
  
  // Calculate growth metrics
  const growth = calculateGrowthMetrics(topicMasteries);
  
  // Identify mastery gaps
  const masteryGaps = identifyMasteryGaps(topicMasteries);
  
  // Generate recommendations
  const recommendations = generateRecommendations(topicMasteries, masteryGaps);
  
  return {
    studentId,
    studentName: student?.name || 'Unknown Student',
    overallMastery,
    masteryBySubject,
    bloomsLevels,
    growth,
    masteryGaps,
    recommendations
  };
}

// Helper functions
function calculateAverageMastery(topicMasteries) {
  if (topicMasteries.length === 0) return 0;
  
  const sum = topicMasteries.reduce((total, mastery) => total + mastery.overallMastery, 0);
  return Math.round(sum / topicMasteries.length);
}

function calculateMasteryBySubject(topicMasteries) {
  const subjectMap = {};
  
  // Group by subject
  topicMasteries.forEach(mastery => {
    const subjectId = mastery.subject.id;
    
    if (!subjectMap[subjectId]) {
      subjectMap[subjectId] = {
        subjectName: mastery.subject.name,
        masteries: [],
        topicsMastered: 0,
        totalTopics: 0
      };
    }
    
    subjectMap[subjectId].masteries.push(mastery);
    subjectMap[subjectId].totalTopics++;
    
    if (mastery.overallMastery >= 75) {
      subjectMap[subjectId].topicsMastered++;
    }
  });
  
  // Calculate average mastery for each subject
  const result = {};
  Object.entries(subjectMap).forEach(([subjectId, data]) => {
    const sum = data.masteries.reduce((total, mastery) => total + mastery.overallMastery, 0);
    const average = Math.round(sum / data.masteries.length);
    
    result[subjectId] = {
      subjectName: data.subjectName,
      overallMastery: average,
      topicsMastered: data.topicsMastered,
      totalTopics: data.totalTopics
    };
  });
  
  return result;
}

function calculateBloomsLevels(topicMasteries) {
  // Implementation...
}

function calculateGrowthMetrics(topicMasteries) {
  // Implementation...
}

function identifyMasteryGaps(topicMasteries) {
  // Implementation...
}

function generateRecommendations(topicMasteries, masteryGaps) {
  // Implementation...
}
```

### 2. Class Mastery Analytics Service

```typescript
// src/features/topic-mastery/services/class-analytics.service.ts
import { prisma } from '@/lib/prisma';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';
import { ClassMasteryAnalytics } from '../types';

export async function generateClassMasteryAnalytics(
  classId: string,
  subjectId?: string
): Promise<ClassMasteryAnalytics> {
  // Fetch class info
  const classInfo = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, name: true, studentIds: true }
  });
  
  // Fetch all topic masteries for students in the class
  const whereClause: any = {
    studentId: { in: classInfo?.studentIds || [] }
  };
  
  if (subjectId) {
    whereClause.subjectId = subjectId;
  }
  
  const topicMasteries = await prisma.topicMastery.findMany({
    where: whereClause,
    include: {
      topic: {
        select: { id: true, name: true, subjectId: true }
      },
      subject: {
        select: { id: true, name: true }
      },
      student: {
        select: { id: true, name: true }
      }
    }
  });
  
  // Calculate average mastery
  const averageMastery = calculateClassAverageMastery(topicMasteries);
  
  // Calculate mastery distribution
  const masteryDistribution = calculateMasteryDistribution(topicMasteries);
  
  // Calculate Bloom's level breakdown
  const bloomsLevels = calculateClassBloomsLevels(topicMasteries);
  
  // Calculate topic mastery breakdown
  const topicMastery = calculateTopicMasteryBreakdown(topicMasteries);
  
  // Identify class mastery gaps
  const masteryGaps = identifyClassMasteryGaps(topicMasteries);
  
  // Generate recommendations
  const recommendations = generateClassRecommendations(topicMasteries, masteryGaps);
  
  return {
    classId,
    className: classInfo?.name || 'Unknown Class',
    averageMastery,
    masteryDistribution,
    bloomsLevels,
    topicMastery,
    masteryGaps,
    recommendations
  };
}

// Helper functions
function calculateClassAverageMastery(topicMasteries) {
  // Implementation...
}

function calculateMasteryDistribution(topicMasteries) {
  // Implementation...
}

function calculateClassBloomsLevels(topicMasteries) {
  // Implementation...
}

function calculateTopicMasteryBreakdown(topicMasteries) {
  // Implementation...
}

function identifyClassMasteryGaps(topicMasteries) {
  // Implementation...
}

function generateClassRecommendations(topicMasteries, masteryGaps) {
  // Implementation...
}
```

## Analytics Visualization Components

### 1. Student Mastery Radar Chart

```tsx
// src/components/analytics/StudentMasteryRadarChart.tsx
import React from 'react';
import { Radar } from 'react-chartjs-2';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface StudentMasteryRadarChartProps {
  bloomsLevels: {
    [level in BloomsTaxonomyLevel]: {
      averageMastery: number;
    }
  };
}

export function StudentMasteryRadarChart({ bloomsLevels }: StudentMasteryRadarChartProps) {
  const data = {
    labels: Object.values(BloomsTaxonomyLevel).map(formatLevelName),
    datasets: [
      {
        label: 'Mastery Level',
        data: Object.values(BloomsTaxonomyLevel).map(level => bloomsLevels[level].averageMastery),
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  };
  
  const options = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };
  
  return (
    <div className="student-mastery-radar-chart">
      <h3>Bloom's Taxonomy Mastery Profile</h3>
      <Radar data={data} options={options} />
    </div>
  );
}

function formatLevelName(level: BloomsTaxonomyLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}
```

### 2. Class Mastery Heatmap

```tsx
// src/components/analytics/ClassMasteryHeatmap.tsx
import React from 'react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface ClassMasteryHeatmapProps {
  topicMastery: {
    [topicId: string]: {
      topicName: string;
      bloomsLevels: {
        [level in BloomsTaxonomyLevel]: number;
      }
    }
  };
}

export function ClassMasteryHeatmap({ topicMastery }: ClassMasteryHeatmapProps) {
  const topics = Object.values(topicMastery);
  
  return (
    <div className="class-mastery-heatmap">
      <h3>Topic Mastery Heatmap</h3>
      
      <div className="heatmap-container">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Topic</th>
              {Object.values(BloomsTaxonomyLevel).map(level => (
                <th key={level}>{formatLevelName(level)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topics.map(topic => (
              <tr key={topic.topicName}>
                <td>{topic.topicName}</td>
                {Object.values(BloomsTaxonomyLevel).map(level => (
                  <td 
                    key={level}
                    className="heatmap-cell"
                    style={{ backgroundColor: getMasteryHeatColor(topic.bloomsLevels[level]) }}
                  >
                    {topic.bloomsLevels[level]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatLevelName(level: BloomsTaxonomyLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getMasteryHeatColor(level: number): string {
  // Color gradient from red (0%) to green (100%)
  const red = Math.max(0, 255 - Math.round(level * 2.55));
  const green = Math.min(255, Math.round(level * 2.55));
  return `rgb(${red}, ${green}, 0)`;
}
```

## Conclusion

Topic mastery analytics provide powerful insights into student learning across Bloom's Taxonomy levels. By tracking mastery at each cognitive level, teachers can identify specific areas where students need additional support and tailor instruction accordingly.

The analytics system includes:

1. Comprehensive data models for student and class analytics
2. Services for generating detailed analytics
3. Visualization components for presenting mastery data
4. Recommendation engines for suggesting targeted interventions

These analytics capabilities enhance our Bloom's Taxonomy and rubrics implementation by providing actionable insights that help teachers promote deeper learning and comprehensive topic mastery.
