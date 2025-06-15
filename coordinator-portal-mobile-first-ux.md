# Coordinator Portal Mobile-First Design and UX Psychology Implementation

## Mobile-First Design Principles

### 1. Progressive Enhancement

Start with the mobile design as the baseline and progressively enhance the experience for larger screens:

```tsx
// Example of progressive enhancement
function CoordinatorDashboard() {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Base layout for mobile */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Content adapts to screen size */}
        <MetricsCard />
        <ActivityCard />
        <PerformanceCard />
      </div>
      
      {/* Progressive disclosure of complex content */}
      <div className="mt-4 md:mt-6">
        <Accordion type="single" collapsible>
          <AccordionItem value="details">
            <AccordionTrigger>View Detailed Analytics</AccordionTrigger>
            <AccordionContent>
              <DetailedAnalytics />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
```

### 2. Responsive Layout Patterns

Implement these key responsive layout patterns:

1. **Stack to Multi-Column**
   - Stack elements vertically on mobile
   - Arrange in multiple columns on larger screens

2. **Priority Content First**
   - Place most important content at the top on mobile
   - Rearrange for optimal viewing on larger screens

3. **Responsive Navigation**
   - Bottom navigation on mobile
   - Sidebar navigation on desktop

4. **Touch-Friendly Interactions**
   - Larger touch targets (min 44x44px)
   - Appropriate spacing between interactive elements
   - Swipe gestures for common actions

### 3. Responsive Component Design

Design components to adapt to different screen sizes:

```tsx
// Example of a responsive component
function TeacherPerformanceCard({ teacher }) {
  const { isMobile } = useResponsive();
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Responsive layout that changes based on screen size */}
        <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
          <Avatar className={isMobile ? 'mx-auto' : ''}>
            <AvatarImage src={teacher.profileImage} alt={teacher.name} />
            <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
          </Avatar>
          
          <div className={`${isMobile ? 'text-center' : 'flex-1'}`}>
            <h3 className="font-medium">{teacher.name}</h3>
            <p className="text-sm text-muted-foreground">{teacher.subjects.join(', ')}</p>
          </div>
          
          {!isMobile && (
            <Button variant="ghost" size="sm">
              View Profile
            </Button>
          )}
        </div>
        
        {/* Performance metrics */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Activity Creation</span>
            <span className="font-medium">{teacher.activityCount}</span>
          </div>
          <Progress value={teacher.activityPercentage} />
          
          <div className="flex justify-between text-sm">
            <span>Student Improvement</span>
            <span className="font-medium">{teacher.improvementRate}%</span>
          </div>
          <Progress value={teacher.improvementRate} />
        </div>
        
        {/* Mobile-only action button */}
        {isMobile && (
          <Button className="w-full mt-4" variant="outline" size="sm">
            View Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4. Responsive Data Visualization

Adapt data visualizations for different screen sizes:

```tsx
// Example of responsive data visualization
function ResponsiveChart({ data }) {
  const { isMobile, isTablet } = useResponsive();
  
  // Adjust chart configuration based on screen size
  const chartConfig = {
    height: isMobile ? 200 : 300,
    legend: {
      position: isMobile ? 'bottom' : 'right',
      itemWidth: isMobile ? 80 : 120
    },
    margin: isMobile 
      ? { top: 20, right: 20, bottom: 50, left: 40 }
      : { top: 20, right: 120, bottom: 50, left: 60 },
    labelFormat: isMobile ? '.0%' : '.2%'
  };
  
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={chartConfig.height}>
        <BarChart data={data} margin={chartConfig.margin}>
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatPercentage} />
          <Tooltip formatter={formatTooltip} />
          <Legend layout="horizontal" position={chartConfig.legend.position} />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## UX Psychology Principles Implementation

### 1. Cognitive Load Reduction

Implement these techniques to reduce cognitive load:

1. **Progressive Disclosure**
   - Show only essential information initially
   - Provide details on demand through expandable sections

```tsx
// Progressive disclosure example
function TeacherAnalytics({ teacherId }) {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Performance</CardTitle>
        <CardDescription>Key metrics for teacher performance</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Essential information shown first */}
        <div className="space-y-4">
          <MetricItem label="Activities Created" value="24" />
          <MetricItem label="Student Improvement" value="12%" />
          <MetricItem label="Feedback Rate" value="92%" />
        </div>
        
        {/* Details available on demand */}
        <Button 
          variant="ghost" 
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t">
            <DetailedTeacherMetrics teacherId={teacherId} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

2. **Chunking Information**
   - Group related information together
   - Use visual separation between different chunks

3. **Visual Hierarchy**
   - Use size, color, and spacing to guide attention
   - Highlight the most important information

### 2. Attention & Focus

Implement these techniques to guide user attention:

1. **Attention Bias**
   - Use visual cues to direct focus to important elements
   - Implement subtle animations for state changes

2. **Pattern Recognition**
   - Maintain consistent patterns across the interface
   - Use familiar UI patterns for common actions

```tsx
// Attention guidance example
function PerformanceAlert({ metric, threshold, value }) {
  const isBelow = value < threshold;
  
  return (
    <Alert variant={isBelow ? "destructive" : "default"}>
      <AlertCircle className={isBelow ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
      <AlertTitle>{metric}</AlertTitle>
      <AlertDescription>
        Current value: {value}
        {isBelow && (
          <span className="font-medium"> (below target of {threshold})</span>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### 3. Motivation & Engagement

Implement these techniques to increase motivation:

1. **Goal Gradient Effect**
   - Show progress toward goals
   - Increase visual feedback as users approach goals

2. **Recognition**
   - Highlight achievements and improvements
   - Provide positive reinforcement for progress

```tsx
// Goal gradient effect example
function TeacherGoalProgress({ current, target }) {
  const percentage = Math.min(100, Math.round((current / target) * 100));
  const isNearGoal = percentage >= 80;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Progress toward goal</span>
        <span className={isNearGoal ? "font-medium text-primary" : ""}>
          {current}/{target}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={isNearGoal ? "animate-pulse" : ""}
      />
      {isNearGoal && (
        <p className="text-sm text-primary">Almost there! Just {target - current} more to go.</p>
      )}
    </div>
  );
}
```

### 4. Decision Making

Implement these techniques to improve decision making:

1. **Framing**
   - Present choices in a positive context
   - Use language that encourages beneficial actions

2. **Default Bias**
   - Set helpful default options
   - Pre-select the most beneficial choices

3. **Anchoring**
   - Provide reference points for comparison
   - Show benchmarks alongside metrics

```tsx
// Framing and anchoring example
function TeacherPerformanceComparison({ teacherValue, averageValue, topValue }) {
  const isAboveAverage = teacherValue > averageValue;
  
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Student Improvement Rate</h3>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{teacherValue}%</span>
        <span className={`text-sm ${isAboveAverage ? 'text-green-600' : 'text-amber-600'}`}>
          {isAboveAverage ? '+' : ''}{((teacherValue - averageValue) / averageValue * 100).toFixed(1)}%
        </span>
      </div>
      <div className="text-sm text-muted-foreground">
        {isAboveAverage 
          ? `Great job! You're performing above the average of ${averageValue}%` 
          : `There's room for improvement. The average is ${averageValue}%`}
      </div>
      <div className="mt-1 text-xs">
        <span className="text-primary">Top performers: {topValue}%</span>
      </div>
    </div>
  );
}
```

### 5. Visual Processing

Implement these techniques to enhance visual processing:

1. **Picture Superiority Effect**
   - Use visualizations instead of text when possible
   - Implement icons to represent concepts

2. **Gestalt Principles**
   - Group related elements visually
   - Use proximity, similarity, and continuity

```tsx
// Visual processing example
function TeacherActivityBreakdown({ activities }) {
  // Group activities by type
  const activityGroups = groupBy(activities, 'type');
  
  // Create data for visualization
  const data = Object.entries(activityGroups).map(([type, items]) => ({
    name: type,
    value: items.length,
    color: getColorForType(type)
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} activities`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
              <span className="text-muted-foreground ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Implementation Checklist

### Mobile-First Design

- [ ] Update all layout components with mobile-first approach
- [ ] Implement responsive navigation (bottom nav for mobile, sidebar for desktop)
- [ ] Create responsive data tables with appropriate mobile views
- [ ] Optimize all forms for mobile input
- [ ] Implement touch-friendly interactive elements
- [ ] Create responsive data visualizations

### UX Psychology

- [ ] Implement progressive disclosure for complex information
- [ ] Add chunking of information into logical groups
- [ ] Create clear visual hierarchy for all pages
- [ ] Implement goal tracking with visual feedback
- [ ] Add comparative metrics with appropriate framing
- [ ] Use visualizations instead of text where appropriate
- [ ] Implement consistent patterns across the interface
