# Class Overview Analytics Enhancement

## Current Analytics Implementation

The current class overview page includes the following analytics:

1. **Basic Metrics**
   - Student Count: Total number of students enrolled in the class
   - Attendance Rate: Percentage of students present in recent classes
   - Activity Count: Number of activities assigned to the class
   - Average Score: Average score across all graded activities

2. **Performance Summary**
   - Average Score: Displayed as a percentage
   - Link to detailed reports

3. **Recent Activities**
   - List of recently assigned activities
   - No detailed analytics on these activities

4. **Upcoming Assessments**
   - List of upcoming assessments
   - No analytics on past assessment performance

## Enhanced Analytics Implementation

### 1. Student Engagement Dashboard

**Component:** `StudentEngagementDashboard`

**Metrics to display:**
- **Participation Rate**: Percentage of students who have engaged with at least one activity in the past week
- **Completion Rate**: Percentage of assigned activities that have been completed by students
- **Engagement Trend**: Week-over-week change in student engagement (with sparkline chart)
- **Active vs. Inactive Students**: Visual breakdown showing active vs. inactive students

**Implementation:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Student Engagement</CardTitle>
    <CardDescription>
      Student participation and activity completion metrics
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Participation Rate</h4>
        <div className="flex items-center mt-1">
          <div className="text-2xl font-bold">{participationRate}%</div>
          <TrendIndicator value={participationTrend} className="ml-2" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
      </div>
      <div>
        <h4 className="text-sm font-medium text-muted-foreground">Completion Rate</h4>
        <div className="flex items-center mt-1">
          <div className="text-2xl font-bold">{completionRate}%</div>
          <TrendIndicator value={completionTrend} className="ml-2" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Assigned activities</p>
      </div>
    </div>
    
    <div className="mt-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Engagement Trend</h4>
      <EngagementSparkline data={weeklyEngagementData} height={60} />
    </div>
    
    <div className="mt-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Student Activity Status</h4>
      <StudentActivityPieChart 
        active={activeStudentCount} 
        inactive={inactiveStudentCount} 
        height={120} 
      />
    </div>
  </CardContent>
</Card>
```

### 2. Performance Distribution

**Component:** `PerformanceDistributionCard`

**Metrics to display:**
- **Score Distribution**: Histogram showing distribution of student scores
- **Mastery Levels**: Breakdown of students by mastery level
- **Improvement Indicators**: Students with most improvement and those needing support

**Implementation:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Performance Distribution</CardTitle>
    <CardDescription>
      Score distribution and mastery levels
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="mb-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Score Distribution</h4>
      <ScoreDistributionChart data={scoreDistributionData} height={120} />
    </div>
    
    <div className="mt-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-2">Mastery Levels</h4>
      <MasteryLevelBreakdown 
        beginner={beginnerCount} 
        intermediate={intermediateCount} 
        advanced={advancedCount} 
        height={100} 
      />
    </div>
    
    <div className="mt-6 space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">Students Needing Support</h4>
      {strugglingStudents.length > 0 ? (
        <div className="space-y-2">
          {strugglingStudents.map(student => (
            <StudentProgressCard 
              key={student.id}
              student={student}
              showSupportButton
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No students currently flagged for support</p>
      )}
    </div>
  </CardContent>
</Card>
```

### 3. Activity Analytics Summary

**Component:** `ActivityAnalyticsSummary`

**Metrics to display:**
- **Most Attempted Activities**: Top activities by attempt count
- **Most Challenging Activities**: Activities with lowest completion rates
- **Time-to-Complete**: Average time spent on activities
- **Deadline Adherence**: Percentage of on-time submissions

**Implementation:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Activity Analytics</CardTitle>
    <CardDescription>
      Insights on student interaction with activities
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Most Attempted Activities</h4>
        <TopActivitiesList 
          activities={mostAttemptedActivities} 
          metricName="attempts"
          limit={3}
        />
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Most Challenging Activities</h4>
        <TopActivitiesList 
          activities={mostChallengingActivities} 
          metricName="avg. score"
          limit={3}
          lowIsBetter
        />
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Time to Complete</h4>
        <TimeToCompleteChart data={timeToCompleteData} height={100} />
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Deadline Adherence</h4>
        <DeadlineAdherenceGauge value={deadlineAdherenceRate} height={80} />
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <Button 
      variant="outline" 
      className="w-full"
      onClick={() => router.push(`/teacher/classes/${classId}/analytics`)}
    >
      View Detailed Analytics
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  </CardFooter>
</Card>
```

## API Requirements

To support these enhanced analytics, we need to extend the existing API endpoints:

1. **Enhanced Class Metrics Endpoint**
   ```typescript
   // Extended getClassMetrics endpoint
   api.teacher.getEnhancedClassMetrics.useQuery(
     { classId },
     {
       refetchOnWindowFocus: false,
       retry: 1,
     }
   );
   ```

2. **Student Engagement Endpoint**
   ```typescript
   // New endpoint for student engagement data
   api.analytics.getStudentEngagement.useQuery(
     { classId, timeframe: 'week' },
     {
       refetchOnWindowFocus: false,
       retry: 1,
     }
   );
   ```

3. **Performance Distribution Endpoint**
   ```typescript
   // New endpoint for performance distribution
   api.analytics.getPerformanceDistribution.useQuery(
     { classId },
     {
       refetchOnWindowFocus: false,
       retry: 1,
     }
   );
   ```

4. **Activity Analytics Endpoint**
   ```typescript
   // New endpoint for activity analytics summary
   api.analytics.getActivityAnalyticsSummary.useQuery(
     { classId, limit: 5 },
     {
       refetchOnWindowFocus: false,
       retry: 1,
     }
   );
   ```

## Implementation Approach

1. Create the new API endpoints in the analytics router
2. Implement the data aggregation logic in the analytics service
3. Create the new UI components for displaying the enhanced analytics
4. Update the ClassOverview component to include the new analytics components
5. Ensure all components are responsive and follow the mobile-first approach
6. Implement offline support using IndexedDB caching
