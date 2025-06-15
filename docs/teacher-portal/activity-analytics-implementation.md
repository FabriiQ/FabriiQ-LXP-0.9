# Activity Analytics Implementation Plan

## Overview

This document outlines the plan for implementing a minimalist, psychologically-informed activity analytics dashboard in the teacher portal. The goal is to provide teachers with meaningful insights into student engagement with activities, with a special focus on time tracking analytics. We'll leverage existing API endpoints where possible to accelerate implementation.

## Current Implementation

The teacher portal already has several components in place:

- Basic tracking of activity starts and completions via `analyticsManager.trackEvent()`
- Activity analytics types defined in `src/features/activties/analytics/types.ts`
- API endpoints in `src/server/api/routers/analytics.ts`
- Basic visualization components in `src/components/teacher/activities/enhanced/ActivityAnalyticsWrapper.tsx`

## Enhanced Activity Analytics Features with Psychological Principles

### 1. Minimalist Activity Engagement Dashboard ✅

**Component:** `MinimalistActivityEngagementDashboard` (Implemented)

**Purpose:** Provide a clean, focused overview of student engagement with activities.

**Key Metrics with Psychological Principles:**
- **Attempt Rates**: Percentage of students who have attempted each activity
  - *Social Proof*: Show popularity metrics to encourage engagement with top activities
- **Completion Rates**: Percentage of students who have completed each activity
  - *Goal Gradient Effect*: Visual progress bars showing proximity to 100% completion
- **Time Investment**: Average time students spend on each activity
  - *Effort Heuristic*: Visualize the relationship between effort and outcomes

**Implementation:**
```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Activity Engagement</CardTitle>
    <CardDescription className="text-xs">
      Student interaction with top activities
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Minimalist tabs with subtle indicators */}
    <Tabs defaultValue="attempt" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-8">
        <TabsTrigger value="attempt" className="text-xs">Attempts</TabsTrigger>
        <TabsTrigger value="completion" className="text-xs">Completion</TabsTrigger>
        <TabsTrigger value="time" className="text-xs">Time</TabsTrigger>
      </TabsList>

      <TabsContent value="attempt">
        <div className="mt-2">
          {/* Limited to top 5 activities for cognitive ease */}
          <MinimalistBarChart
            data={topActivitiesByAttempts.slice(0, 5)}
            valueKey="attemptRate"
            labelKey="title"
            formatValue={(value) => `${value}%`}
            height={180}
            showLegend={false}
            colors={['#E2F0F9']}
            highlightIndex={0} // Von Restorff Effect - highlight the most attempted
          />
          <div className="mt-1 text-xs text-right text-muted-foreground">
            Based on {studentCount} students
          </div>
        </div>
      </TabsContent>

      <TabsContent value="completion">
        <div className="mt-2">
          <MinimalistBarChart
            data={topActivitiesByCompletion.slice(0, 5)}
            valueKey="completionRate"
            labelKey="title"
            formatValue={(value) => `${value}%`}
            height={180}
            showLegend={false}
            colors={['#E2F9EC']}
            highlightIndex={0}
          />
          <div className="mt-1 text-xs text-right text-muted-foreground">
            Based on {attemptCount} attempts
          </div>
        </div>
      </TabsContent>

      <TabsContent value="time">
        <div className="mt-2">
          <MinimalistBarChart
            data={topActivitiesByTimeSpent.slice(0, 5)}
            valueKey="averageTimeSpent"
            labelKey="title"
            formatValue={(value) => `${Math.round(value / 60)}m`}
            height={180}
            showLegend={false}
            colors={['#F9F0E2']}
            highlightIndex={0}
          />
          <div className="mt-1 text-xs text-right text-muted-foreground">
            Average time per student
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
```

### 2. Time Tracking Analytics Dashboard ✅

**Component:** `TimeTrackingDashboard` (Implemented)

**Purpose:** Provide insights into how students spend time on activities and how time investment relates to performance.

**Key Metrics with Psychological Principles:**
- **Time Distribution Heatmap**: When students spend time on activities
  - *Visual Hierarchy*: Use color intensity to immediately show patterns
  - *Zeigarnik Effect*: Highlight incomplete activities during peak productivity times
- **Time Efficiency Analysis**: Relationship between time spent and performance
  - *Pareto Principle*: Highlight the 20% of time that produces 80% of results
  - *Anchoring*: Show comparison to class average as reference point
- **Focus Duration Metrics**: Analysis of sustained attention spans
  - *Flow Theory*: Identify optimal challenge levels that maintain student focus

**Implementation:**
```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Time Analytics</CardTitle>
    <CardDescription className="text-xs">
      How students allocate time on activities
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="distribution" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-8">
        <TabsTrigger value="distribution" className="text-xs">Distribution</TabsTrigger>
        <TabsTrigger value="efficiency" className="text-xs">Efficiency</TabsTrigger>
        <TabsTrigger value="focus" className="text-xs">Focus</TabsTrigger>
      </TabsList>

      <TabsContent value="distribution">
        <div className="mt-2">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Weekly Time Distribution</h4>
          {/* Minimalist heatmap showing when students work */}
          <TimeDistributionHeatmap
            data={timeDistributionData}
            height={140}
            dayLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
            hourLabels={['6am', '12pm', '6pm', '12am']}
            colorScale={['#F9F9F9', '#E2F0F9', '#C5E1F9', '#A8D1F9']}
            highlightPeakTimes={true} // Zeigarnik Effect - highlight peak times
          />
          <div className="mt-1 text-xs text-right text-muted-foreground">
            Based on {activityCount} activities
          </div>
        </div>
      </TabsContent>

      <TabsContent value="efficiency">
        <div className="mt-2">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Time vs. Performance</h4>
          {/* Minimalist scatter plot showing time efficiency */}
          <TimeEfficiencyChart
            data={timeEfficiencyData}
            height={140}
            xAxisLabel="Time (min)"
            yAxisLabel="Score (%)"
            showQuadrants={true} // Pareto Principle - highlight efficient quadrant
            showAverages={true}  // Anchoring - show class averages
            highlightOptimal={true}
          />
          <div className="mt-1 text-xs text-right text-muted-foreground">
            Each dot represents one activity completion
          </div>
        </div>
      </TabsContent>

      <TabsContent value="focus">
        <div className="mt-2">
          <h4 className="text-xs font-medium text-muted-foreground mb-1">Focus Duration Analysis</h4>
          {/* Minimalist line chart showing focus duration patterns */}
          <FocusDurationChart
            data={focusDurationData}
            height={140}
            xAxisLabel="Activity Duration"
            yAxisLabel="Focus Score"
            highlightFlowState={true} // Flow Theory - highlight optimal challenge zone
            showAverageLine={true}
          />
          <div className="mt-1 text-xs text-right text-muted-foreground">
            Optimal focus zone highlighted
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
```

### 3. Minimalist Activity Comparison Tool ✅

**Component:** `MinimalistActivityComparison` (Implemented)

**Purpose:** Allow teachers to quickly compare key metrics across activities with minimal cognitive load.

**Key Features with Psychological Principles:**
- **Limited Activity Selection**: Compare up to 3 activities at once
  - *Miller's Law*: Limit comparison to 7±2 items for optimal comprehension
  - *Choice Architecture*: Curate comparison options to reduce decision fatigue
- **Essential Metrics Only**: Focus on time spent, completion rate, and score
  - *Information Diet*: Present only the most relevant data
  - *Contrast Principle*: Use minimal visual elements to highlight meaningful differences
- **Visual Efficiency**: Use color and position to encode information
  - *Picture Superiority Effect*: Visual encoding is remembered better than text

**Implementation:**
```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-2">
    <CardTitle className="text-lg">Activity Comparison</CardTitle>
    <CardDescription className="text-xs">
      Compare essential metrics across activities
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {/* Simplified activity selection with presets */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Compare Activities</Label>
        <Select
          value={comparisonPreset}
          onValueChange={setComparisonPreset}
          className="w-40"
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="time-intensive">Most Time-Intensive</SelectItem>
            <SelectItem value="custom">Custom Selection</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Only show custom selection if custom preset is selected */}
      {comparisonPreset === 'custom' && (
        <div className="flex flex-wrap gap-2 mt-2">
          {recentActivities.slice(0, 6).map(activity => (
            <Badge
              key={activity.id}
              variant={selectedActivities.includes(activity.id) ? "default" : "outline"}
              className="cursor-pointer text-xs py-0 h-6"
              onClick={() => toggleActivitySelection(activity.id)}
            >
              {activity.title}
            </Badge>
          ))}
        </div>
      )}

      {/* Minimalist comparison visualization */}
      <div className="mt-4">
        <MinimalistComparisonGrid
          activities={selectedActivitiesData}
          metrics={[
            { key: 'timeSpent', label: 'Time', format: (v) => `${Math.round(v/60)}m` },
            { key: 'completionRate', label: 'Completion', format: (v) => `${v}%` },
            { key: 'averageScore', label: 'Score', format: (v) => `${v}%` }
          ]}
          height={180}
          colorScale={['#E2F0F9', '#E2F9EC', '#F9F0E2']}
          showDifferences={true} // Contrast Principle - highlight differences
          maxActivities={3} // Miller's Law - limit comparison items
        />
      </div>
    </div>
  </CardContent>
</Card>
```

### 4. Activity Timeline Analysis

**Component:** `ActivityTimelineAnalysis`

**Purpose:** Analyze how student engagement and performance change over time.

**Key Metrics:**
- **Engagement Over Time**: How student engagement changes throughout the term
- **Performance Trends**: How scores change over time
- **Time-to-Complete Trends**: Changes in time spent on activities
- **Peak Activity Times**: When students are most active in completing assignments

**Implementation:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Activity Timeline</CardTitle>
    <CardDescription>
      How engagement and performance change over time
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="engagement">
      <TabsList>
        <TabsTrigger value="engagement">Engagement</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="time">Time Spent</TabsTrigger>
      </TabsList>

      <TabsContent value="engagement">
        <div className="mt-4">
          <TimelineChart
            data={engagementTimelineData}
            metricKey="engagementRate"
            metricLabel="Engagement Rate"
            formatValue={(value) => `${value}%`}
            height={300}
          />
        </div>
      </TabsContent>

      <TabsContent value="performance">
        <div className="mt-4">
          <TimelineChart
            data={performanceTimelineData}
            metricKey="averageScore"
            metricLabel="Average Score"
            formatValue={(value) => `${value}%`}
            height={300}
          />
        </div>
      </TabsContent>

      <TabsContent value="time">
        <div className="mt-4">
          <TimelineChart
            data={timeSpentTimelineData}
            metricKey="averageTimeSpent"
            metricLabel="Avg. Time Spent"
            formatValue={(value) => `${Math.round(value / 60)} min`}
            height={300}
          />
        </div>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
```

## Leveraging Existing API Endpoints

The codebase already has most of the required API endpoints that we can leverage for our implementation:

### 1. Existing Activity Analytics Endpoints

```typescript
// Get activity analytics data - already implemented
api.analytics.getActivityAnalytics.useQuery(
  {
    activityId,
    includeTimeData: true // Add this parameter to include time tracking data
  },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);

// Get class activities analytics - already implemented
api.analytics.getClassActivitiesAnalytics.useQuery(
  {
    classId,
    timeframe: 'month', // 'week', 'month', 'term', 'all'
    includeTimeTracking: true // Add this parameter to include time tracking
  },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);
```

### 2. Time Tracking Analytics Extensions ✅

We've implemented the time tracking analytics endpoint:

```typescript
// Get time tracking analytics - implemented
api.analytics.getTimeTrackingAnalytics.useQuery(
  {
    classId,
    activityIds: selectedActivities, // Optional - filter to specific activities
    timeframe: 'month', // 'week', 'month', 'term', 'all'
    groupBy: 'day' // 'hour', 'day', 'week', 'activity'
  },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);
```

### 3. Activity Comparison Using Existing Endpoints

```typescript
// Use existing endpoints with activity IDs array
api.analytics.getActivitiesComparison.useQuery(
  {
    activityIds: selectedActivities,
    includeTimeData: true
  },
  {
    refetchOnWindowFocus: false,
    retry: 1,
  }
);
```

## Implementation Approach

1. **Minimalist UI Component Development**:
   - Create lightweight, visually focused components that apply psychological principles
   - Implement responsive visualizations that work well on mobile devices
   - Use subtle animations and transitions to enhance understanding without distraction

2. **Time Tracking Integration**:
   - Extend existing activity tracking to capture more detailed time metrics
   - Implement focus detection to measure sustained attention
   - Add time efficiency analysis to correlate time spent with outcomes

3. **Leveraging Existing Backend**:
   - Use existing API endpoints with minor extensions for time tracking
   - Implement client-side data transformations to minimize backend changes
   - Utilize existing caching mechanisms for performance

4. **Psychological Principles Implementation**:
   - Apply Miller's Law by limiting comparison items to 7±2
   - Implement Von Restorff Effect by highlighting important outliers
   - Use Goal Gradient Effect with visual progress indicators
   - Apply Zeigarnik Effect by highlighting incomplete activities
   - Implement Flow Theory principles in focus duration analysis

5. **Mobile-First Optimization**:
   - Design for smallest screens first with progressive enhancement
   - Implement touch-friendly interaction patterns
   - Use responsive typography and spacing

6. **Offline Support**:
   - Leverage existing IndexedDB implementation
   - Implement optimistic UI updates for offline actions
   - Prioritize critical analytics data for offline caching
