// Approach 2: Icon-Focused Card with Visual Hierarchy
// This approach uses a clear visual hierarchy with icons to reduce cognitive load

function ActivityCard({ activity, classId, subjectId }) {
  // Determine activity status
  const status = activity.status;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';
  
  // Calculate learning points
  const pointsEarned = activity.score || 0;
  const pointsAvailable = activity.totalScore || 100;
  
  // Format due date to be more concise
  const formatDueDate = (date) => {
    if (!date) return '';
    const dueDate = new Date(date);
    const today = new Date();
    
    // If due today, show "Today"
    if (dueDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // If due tomorrow, show "Tomorrow"
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // If due within a week, show day name
    const withinWeek = new Date(today);
    withinWeek.setDate(withinWeek.getDate() + 7);
    if (dueDate < withinWeek) {
      return dueDate.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    // Otherwise show month/day
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Get appropriate icon for activity type
  const getActivityTypeIcon = () => {
    // This would be replaced with your actual icon mapping
    switch (activity.type.toLowerCase()) {
      case 'multiple-choice':
        return <ListChecks className="h-4 w-4" />;
      case 'flash-cards':
        return <Layers className="h-4 w-4" />;
      case 'quiz':
        return <FileQuestion className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  return (
    <Card className="overflow-hidden h-full relative group flex flex-col hover:border-primary-green/70 transition-all">
      {/* Visual status indicator - colored top border */}
      <div className={`h-1 w-full absolute top-0 left-0 ${
        isCompleted ? "bg-primary-green" : 
        isInProgress ? "bg-medium-teal" : 
        "bg-light-mint"
      }`} />
      
      {/* New badge - only show if activity is new */}
      {activity.isNew && (
        <div className="absolute top-1 right-1 z-10">
          <Badge variant="default" className="text-xs rounded-sm bg-blue-500 text-white px-1.5 py-0.5">
            NEW
          </Badge>
        </div>
      )}

      {/* Card Header - Title and activity type icon */}
      <CardHeader className="p-3 pb-1 pt-4 flex-shrink-0 flex items-start gap-2">
        <div className={`p-1.5 rounded-full ${
          isCompleted ? "bg-primary-green/10" : 
          isInProgress ? "bg-medium-teal/10" : 
          "bg-light-mint/30"
        }`}>
          {getActivityTypeIcon()}
        </div>
        
        <div className="flex-1">
          <CardTitle className="text-base group-hover:text-primary-green transition-colors line-clamp-2">
            {activity.title}
          </CardTitle>
          
          {/* Activity type as small text */}
          <CardDescription className="text-xs capitalize mt-0.5">
            {activity.type.replace(/-/g, ' ')}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Card Content - Essential info with icons */}
      <CardContent className="p-3 pt-0 flex-grow">
        <div className="flex flex-col gap-2 mt-2">
          {/* Due Date with icon */}
          <div className="flex items-center text-xs">
            <Clock className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" />
            <span>{formatDueDate(activity.dueDate)}</span>
          </div>
          
          {/* Status with icon */}
          <div className="flex items-center text-xs">
            {isCompleted ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1.5 text-primary-green flex-shrink-0" />
                <span className="text-primary-green font-medium">Completed</span>
              </>
            ) : isInProgress ? (
              <>
                <CircleHalf className="h-3 w-3 mr-1.5 text-medium-teal flex-shrink-0" />
                <span className="text-medium-teal font-medium">In Progress</span>
              </>
            ) : (
              <>
                <Circle className="h-3 w-3 mr-1.5 text-muted-foreground flex-shrink-0" />
                <span>Not Started</span>
              </>
            )}
          </div>
          
          {/* Learning Points with icon */}
          <div className="flex items-center text-xs mt-1">
            <Award className="h-3 w-3 mr-1.5 text-amber-500 flex-shrink-0" />
            {isCompleted ? (
              <span className="font-medium">{pointsEarned} of {pointsAvailable} points earned</span>
            ) : (
              <span>{pointsAvailable} points available</span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Card Footer - Action button */}
      <CardFooter className="p-3 pt-2 flex-shrink-0 border-t bg-card">
        <Button
          variant={isInProgress ? "default" : "outline"}
          size="sm"
          className="w-full text-xs h-8 transition-colors"
          asChild
        >
          <Link
            href={
              isCompleted
                ? `/student/class/${classId}/subjects/${subjectId}/activities/${activity.id}/results`
                : `/student/class/${classId}/subjects/${subjectId}/activities/${activity.id}`
            }
          >
            {isCompleted
              ? 'View Results'
              : isInProgress
                ? 'Continue'
                : 'Start Activity'}
            <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
