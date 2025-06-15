// Approach 1: Tag-Based Minimalist Card
// This approach uses visual tags and icons to convey information at a glance

function ActivityCard({ activity, classId, subjectId }) {
  // Determine if the activity is completed, in progress, or pending
  const status = activity.status;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in-progress';
  
  // Calculate learning points earned vs. available
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
  
  // Get appropriate status color
  const getStatusColor = () => {
    if (isCompleted) return 'bg-primary-green text-white';
    if (isInProgress) return 'bg-medium-teal text-white';
    return 'bg-light-mint text-primary-green';
  };
  
  return (
    <Card className="overflow-hidden h-full relative group flex flex-col hover:border-primary-green/70 transition-all">
      {/* Status and Type Tags (top-right corner) */}
      <div className="absolute top-0 right-0 flex gap-1 p-1 z-10">
        {/* Activity Type Tag */}
        <Badge variant="outline" className="text-xs capitalize rounded-sm">
          <ActivityTypeIcon type={activity.type} className="h-3 w-3 mr-1" />
          {activity.type.replace(/-/g, ' ')}
        </Badge>
        
        {/* Status Tag */}
        <Badge className={`text-xs capitalize rounded-sm ${getStatusColor()}`}>
          {status}
        </Badge>
        
        {/* New Tag - only show if activity is new */}
        {activity.isNew && (
          <Badge variant="default" className="text-xs rounded-sm bg-blue-500 text-white">
            NEW
          </Badge>
        )}
      </div>

      {/* Card Header - Just the title */}
      <CardHeader className="p-3 pb-1 flex-shrink-0">
        <CardTitle className="text-base group-hover:text-primary-green transition-colors line-clamp-2">
          {activity.title}
        </CardTitle>
      </CardHeader>

      {/* Card Content - Minimal essential info */}
      <CardContent className="p-3 pt-0 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          {/* Due Date - Simple icon + date */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
            <span>Due: {formatDueDate(activity.dueDate)}</span>
          </div>
          
          {/* Chapter info - Only if available */}
          {activity.chapter && (
            <div className="flex items-center text-xs text-muted-foreground">
              <BookMarked className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{activity.chapter}</span>
            </div>
          )}
        </div>
        
        {/* Learning Points - Visual indicator */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium">Learning Points:</span>
          <div className="flex items-center">
            {isCompleted ? (
              <span className="text-sm font-bold text-primary-green">{pointsEarned}/{pointsAvailable}</span>
            ) : (
              <span className="text-sm font-bold text-amber-600">{pointsAvailable} available</span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Card Footer - Action button */}
      <CardFooter className="p-3 pt-2 flex-shrink-0 border-t bg-card">
        <Button
          variant="outline"
          size="sm"
          className={`w-full text-xs h-8 transition-colors ${
            isInProgress ? "border-primary-green text-primary-green" : ""
          } group-hover:bg-primary-green/10`}
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
                : 'Start'}
            <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
