# Teacher Leaderboard - Technical Implementation Details

## Overview

This document provides detailed technical information about the implementation of the Teacher Leaderboard system. It covers the database schema, API endpoints, frontend components, and integration points with other systems.

## Database Schema

### TeacherProfile Model Extension

The existing TeacherProfile model has been extended with a `totalPoints` field to track the total points earned by each teacher:

```prisma
model TeacherProfile {
  // Existing fields
  totalPoints     Int            @default(0)
  points          TeacherPoints[]
  pointsAggregates TeacherPointsAggregate[]
  achievements    TeacherAchievement[]
  performanceMetrics TeacherPerformanceMetrics[]
}
```

### TeacherPoints Model

The TeacherPoints model records individual point transactions:

```prisma
model TeacherPoints {
  id              String         @id @default(cuid())
  teacherId       String
  teacher         TeacherProfile @relation(fields: [teacherId], references: [id])
  amount          Int
  source          String         // e.g., "lesson_plan", "activity_creation", "feedback", "attendance", "class_performance"
  sourceId        String?        // ID of the source (lesson plan ID, activity ID, etc.)
  classId         String?
  class           Class?         @relation(fields: [classId], references: [id])
  subjectId       String?
  subject         Subject?       @relation(fields: [subjectId], references: [id])
  description     String?
  createdAt       DateTime       @default(now())
  status          SystemStatus   @default(ACTIVE)
  partitionKey    String?        // For database partitioning

  @@index([teacherId])
  @@index([classId])
  @@index([subjectId])
  @@index([source])
  @@index([createdAt])
  @@index([status])
  @@index([partitionKey])
  @@map("teacher_points")
}
```

### TeacherPointsAggregate Model

The TeacherPointsAggregate model stores pre-calculated aggregations for efficient leaderboard queries:

```prisma
model TeacherPointsAggregate {
  id              String         @id @default(cuid())
  teacherId       String
  teacher         TeacherProfile @relation(fields: [teacherId], references: [id])
  classId         String?
  class           Class?         @relation(fields: [classId], references: [id])
  subjectId       String?
  subject         Subject?       @relation(fields: [subjectId], references: [id])
  courseId        String?
  course          Course?        @relation(fields: [courseId], references: [id])
  programId       String?
  campusId        String?
  campus          Campus?        @relation(fields: [campusId], references: [id])
  date            DateTime
  dailyPoints     Int            @default(0)
  weeklyPoints    Int            @default(0)
  monthlyPoints   Int            @default(0)
  termPoints      Int            @default(0)
  totalPoints     Int            @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  status          SystemStatus   @default(ACTIVE)
  partitionKey    String?        // For database partitioning

  @@index([teacherId])
  @@index([classId])
  @@index([subjectId])
  @@index([courseId])
  @@index([programId])
  @@index([campusId])
  @@index([date])
  @@index([status])
  @@index([partitionKey])
  @@map("teacher_points_aggregate")
}
```

### TeacherAchievement Model

The TeacherAchievement model tracks progress toward achievements:

```prisma
model TeacherAchievement {
  id              String         @id @default(cuid())
  teacherId       String
  teacher         TeacherProfile @relation(fields: [teacherId], references: [id])
  type            String         // e.g., "content_creator", "feedback_champion", "perfect_attendance", "class_performance", "master_educator"
  level           String         // "bronze", "silver", "gold"
  title           String
  description     String
  icon            String?
  unlockedAt      DateTime?
  progress        Int            @default(0)
  target          Int
  unlocked        Boolean        @default(false)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  status          SystemStatus   @default(ACTIVE)
  partitionKey    String?        // For database partitioning

  @@index([teacherId])
  @@index([type])
  @@index([unlocked])
  @@index([status])
  @@index([partitionKey])
  @@map("teacher_achievements")
}
```

## API Implementation

### TeacherPointsService

The TeacherPointsService handles all operations related to teacher points:

```typescript
export class TeacherPointsService {
  private prisma: PrismaClient;

  constructor({ prisma }: TeacherPointsServiceContext) {
    this.prisma = prisma;
  }

  // Award points to a teacher
  async awardPoints(data: AwardTeacherPointsInput): Promise<any> {
    // Implementation details
  }

  // Update points aggregates for leaderboards
  private async updatePointsAggregates(
    teacherId: string,
    amount: number,
    classId?: string,
    subjectId?: string
  ): Promise<void> {
    // Implementation details
  }

  // Get teacher points history
  async getTeacherPointsHistory(params: {
    teacherId: string;
    classId?: string;
    subjectId?: string;
    source?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    history: any[];
    total: number;
  }> {
    // Implementation details
  }

  // Get teacher leaderboard
  async getTeacherLeaderboard(params: {
    courseId?: string;
    classId?: string;
    programId?: string;
    campusId?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'term' | 'all';
    limit?: number;
    offset?: number;
    sortBy?: 'points' | 'activityCreation' | 'studentPerformance' | 'attendance' | 'feedback';
  }): Promise<{
    leaderboard: any[];
    total: number;
  }> {
    // Implementation details
  }
}
```

### API Endpoints

#### Teacher Leaderboard Router

```typescript
export const teacherLeaderboardRouter = createTRPCRouter({
  // Get teacher leaderboard
  getTeacherLeaderboard: protectedProcedure
    .input(
      z.object({
        courseId: z.string().optional(),
        classId: z.string().optional(),
        programId: z.string().optional(),
        campusId: z.string().optional(),
        timeframe: z.enum(["daily", "weekly", "monthly", "term", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
        sortBy: z.enum([
          "points",
          "activityCreation",
          "studentPerformance",
          "attendance",
          "feedback"
        ]).default("points"),
      })
    )
    .query(async ({ ctx, input }) => {
      // Implementation details
    }),

  // Get teacher achievements
  getTeacherAchievements: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        classId: z.string().optional(),
        type: z.string().optional(),
        includeUnlocked: z.boolean().default(true),
        includeLocked: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      // Implementation details
    }),

  // Get teacher points history
  getTeacherPointsHistory: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        source: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      // Implementation details
    }),
});
```

#### Teacher Points Router

```typescript
export const teacherPointsRouter = createTRPCRouter({
  // Award points to a teacher
  awardPoints: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        amount: z.number().min(1).max(100),
        source: z.string(),
        sourceId: z.string().optional(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Implementation details
    }),

  // Get teacher points history
  getTeacherPointsHistory: protectedProcedure
    .input(
      z.object({
        teacherId: z.string(),
        classId: z.string().optional(),
        subjectId: z.string().optional(),
        source: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Implementation details
    }),
});
```

## Frontend Implementation

### TeacherLeaderboardView Component

The TeacherLeaderboardView component displays the teacher leaderboard with filtering, sorting, and transparency features:

```tsx
export function TeacherLeaderboardView({
  courseId,
  classId,
  programId,
  campusId
}: TeacherLeaderboardViewProps) {
  // State management
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "term" | "all">("all");
  const [sortBy, setSortBy] = useState<"points" | "activityCreation" | "studentPerformance" | "attendance" | "feedback">("points");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTransparency, setShowTransparency] = useState(false);

  // API integration
  const { data, isLoading, refetch } = api.teacherLeaderboard.getTeacherLeaderboard.useQuery({
    courseId,
    classId,
    programId,
    campusId,
    timeframe,
    limit,
    offset: (page - 1) * limit,
    sortBy,
  });

  // Component rendering
  return (
    <Card className="w-full overflow-hidden">
      {/* Header with title and action buttons */}
      {/* Filters section */}
      {/* Transparency section */}
      {/* Leaderboard content */}
      {/* Pagination */}
    </Card>
  );
}
```

### Transparency Section

The transparency section explains how points are calculated:

```tsx
{showTransparency && (
  <div className="px-4 py-3 bg-muted/30 border-b">
    <h3 className="font-medium text-sm mb-2 flex items-center">
      <Info className="h-4 w-4 mr-1 text-blue-500" />
      How Teacher Points Work
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h4 className="font-medium mb-1">Point Sources</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-blue-500" />
            <span>Lesson Plan Creation: 10-50 points</span>
          </li>
          {/* Other point sources */}
        </ul>
      </div>
      <div>
        <h4 className="font-medium mb-1">Leaderboard Calculation</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Points are calculated based on the selected timeframe</li>
          {/* Other calculation details */}
        </ul>
      </div>
    </div>
  </div>
)}
```

### CoordinatorAwardPointsDialog Component

The CoordinatorAwardPointsDialog component allows coordinators to award points to teachers:

```tsx
export function CoordinatorAwardPointsDialog({
  teachers,
  classId,
  onPointsAwarded
}: CoordinatorAwardPointsDialogProps) {
  // State management
  const [open, setOpen] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [pointCategory, setPointCategory] = useState<string>("lesson_plan");
  const [pointAmount, setPointAmount] = useState<number>(10);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API integration
  const awardPoints = api.teacherPoints.awardPoints.useMutation({
    onSuccess: () => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  });

  // Component rendering
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-8">
          <Award className="h-4 w-4 mr-1" />
          Award Points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {/* Dialog content */}
      </DialogContent>
    </Dialog>
  );
}
```

## Integration Points

### Activity System Integration

Points are awarded when teachers create activities:

```typescript
// In ActivityService.ts
async createActivity(data: CreateActivityInput): Promise<Activity> {
  const activity = await this.prisma.activity.create({
    data: {
      // Activity data
    }
  });

  // Award points to the teacher
  const teacherPointsService = new TeacherPointsService({ prisma: this.prisma });
  await teacherPointsService.awardPoints({
    teacherId: data.teacherId,
    amount: this.getPointsForActivityType(data.type),
    source: "activity_creation",
    sourceId: activity.id,
    classId: data.classId,
    description: `Created a new ${data.type} activity: ${data.title}`,
  });

  return activity;
}
```

### Feedback System Integration

Points are awarded for timely feedback:

```typescript
// In FeedbackService.ts
async provideFeedback(data: ProvideFeedbackInput): Promise<Feedback> {
  const feedback = await this.prisma.feedback.create({
    data: {
      // Feedback data
    }
  });

  // Calculate response time
  const submission = await this.prisma.submission.findUnique({
    where: { id: data.submissionId }
  });
  
  const responseTime = this.calculateResponseTime(submission!.submittedAt, new Date());
  
  // Award points based on response time
  const teacherPointsService = new TeacherPointsService({ prisma: this.prisma });
  await teacherPointsService.awardPoints({
    teacherId: data.teacherId,
    amount: this.getPointsForResponseTime(responseTime),
    source: "feedback",
    sourceId: feedback.id,
    classId: submission!.classId,
    description: `Provided feedback within ${responseTime} hours`,
  });

  return feedback;
}
```

## Performance Considerations

1. **Aggregation Tables**: Pre-calculated aggregations in the TeacherPointsAggregate model improve leaderboard query performance.

2. **Indexing Strategy**: Strategic indexes on frequently queried fields optimize database performance.

3. **Pagination**: All leaderboard queries use pagination to limit result sets and improve response times.

4. **Caching**: Future implementation will include caching of leaderboard results with appropriate invalidation strategies.

## Security Considerations

1. **Permission Checks**: Only coordinators and administrators can award points to teachers.

2. **Audit Trail**: All point transactions include the user who awarded the points and a reason.

3. **Input Validation**: Strict validation of point amounts and categories prevents abuse.

4. **Rate Limiting**: Future implementation will include rate limiting to prevent abuse of the award points API.

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket connections for real-time leaderboard updates.

2. **Advanced Analytics**: Add detailed analytics on teacher performance and point distribution.

3. **Gamification Elements**: Add badges, levels, and other gamification elements to increase engagement.

4. **Team Competitions**: Implement team-based leaderboards for department or subject competitions.
