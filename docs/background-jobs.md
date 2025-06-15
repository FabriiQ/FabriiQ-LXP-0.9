# Background Jobs System

The background jobs system provides a centralized way to manage and execute background tasks in the application. It supports various types of jobs, including leaderboard calculation, achievement checking, point aggregation, and data archiving.

## Architecture

The background jobs system consists of the following components:

1. **Background Job System**: The core system that manages job registration, scheduling, execution, and monitoring.
2. **Job Managers**: Specialized managers for different types of jobs (e.g., reward jobs, system jobs).
3. **Job Definitions**: Individual job definitions with handlers, schedules, and configurations.
4. **API Router**: A tRPC router for managing jobs through the API.
5. **Admin UI**: A user interface for administrators to manage and monitor jobs.
6. **Monitoring System**: Real-time monitoring of system resources and job performance.
7. **Alerting System**: Notifications for job failures and other important events.
8. **Scaling System**: Configuration for distributed job processing and high-volume workloads.
9. **Job Management**: Tools for adding, configuring, and managing background jobs.

## Job Types

### Reward Jobs

- **Leaderboard Calculation**: Creates snapshots of leaderboards for classes, subjects, and campuses.
- **Achievement Checking**: Checks for new achievements based on student activity.
- **Point Aggregation**: Aggregates student points for faster leaderboard queries.
- **Data Archiving**: Archives old leaderboard snapshots and point records.

### System Jobs

- **Cache Cleanup**: Cleans up expired cache entries.
- **Session Cleanup**: Cleans up expired sessions from the database.
- **Database Maintenance**: Performs database maintenance tasks.
- **Activity Archiving**: Archives old activity grades.

## Configuration

Background jobs can be enabled or disabled using the `ENABLE_BACKGROUND_JOBS` environment variable:

```
ENABLE_BACKGROUND_JOBS="true"
```

By default, background jobs are enabled in production and disabled in development. Set this variable to `"true"` to enable them in development.

## API Endpoints

The background jobs system exposes the following API endpoints through the `backgroundJobs` tRPC router:

- `getAllJobs`: Get all registered jobs.
- `getJobDetails`: Get detailed information about a specific job.
- `runJob`: Run a specific job immediately.
- `setJobEnabled`: Enable or disable a specific job.
- `runAllRewardJobs`: Run all reward jobs immediately.
- `runAllSystemJobs`: Run all system jobs immediately.
- `getRunningJobs`: Get all currently running jobs.

## Admin UI

The background jobs system includes an admin UI for managing and monitoring jobs. The UI is available at `/admin/system/background-jobs` and provides the following features:

- View all registered jobs.
- View job details, including configuration, status, and history.
- Run jobs manually.
- Enable or disable jobs.
- Monitor running jobs.
- View system resource usage and job performance metrics.
- Configure alerting for job failures.
- Configure scaling options for high-volume workloads.
- Add and configure new background jobs.

### Monitoring

The monitoring system provides real-time visibility into system resources and job performance:

- **System Load**: Current CPU usage of the system.
- **Memory Usage**: Current memory usage of the system.
- **Job Performance**: Execution time for each job.
- **Performance Trends**: Historical performance data for jobs.

### Alerting

The alerting system notifies administrators of job failures and other important events:

- **Job Failure Alerts**: Notifications when jobs fail to complete successfully.
- **Alert Severity Levels**: Low, medium, and high severity alerts.
- **Alert History**: Record of past alerts for troubleshooting.
- **Alert Configuration**: Customizable alert thresholds and notification settings.

### Scaling

The scaling system provides options for handling high-volume workloads:

- **Worker Count**: Number of worker processes to handle jobs.
- **Max Concurrent Jobs**: Maximum number of jobs that can run simultaneously.
- **Distribution Strategy**: How jobs are distributed across workers (round-robin, least-busy, job-type).
- **Performance Optimization**: Configuration options for optimizing job performance.

## Job Frequency

Jobs can be scheduled with different frequencies:

- **Minutely**: Runs every minute.
- **Hourly**: Runs every hour.
- **Daily**: Runs every day.
- **Weekly**: Runs every week.
- **Monthly**: Runs every month.
- **Custom**: Runs at a custom interval.

## Job Priority

Jobs have a priority level from 1 (lowest) to 10 (highest). Higher priority jobs are executed first when multiple jobs are scheduled to run at the same time.

## Error Handling

Jobs include error handling and retry mechanisms. If a job fails, it can be configured to retry a specified number of times with a specified delay between retries.

## Logging

All job activities are logged using the application's logging system. Logs include information about job registration, scheduling, execution, completion, and errors.

## Implementation Details

### Background Job System

The background job system is implemented in `src/server/jobs/background-job-system.ts`. It provides the following features:

- Job registration and unregistration
- Job scheduling based on frequency
- Job execution with timeout and retry
- Job status tracking
- Job history tracking

### Job Managers

Job managers are implemented in `src/server/jobs/reward-job-manager.ts` and `src/server/jobs/system-job-manager.ts`. They provide specialized job definitions for different types of jobs.

### API Router

The API router is implemented in `src/server/api/routers/background-jobs.ts`. It provides API endpoints for managing jobs through the tRPC API.

### Admin UI

The admin UI is implemented in `src/components/admin/system/BackgroundJobsManager.tsx` and `src/app/admin/system/background-jobs/page.tsx`. It provides a user interface for administrators to manage and monitor jobs.

## Initialization

The background jobs system is initialized when the server starts. The initialization process is implemented in `src/server/init/background-jobs.ts` and triggered from `src/server/db.ts`.

## Shutdown

The background jobs system is shut down gracefully when the server stops. The shutdown process is implemented in `src/server/jobs/index.ts` and triggered from `src/server/init/background-jobs.ts`.

## Adding New Jobs

There are two ways to add new jobs:

### Through the Admin UI

1. Navigate to the Background Jobs Manager at `/admin/system/background-jobs`.
2. Click the "Add Job" button.
3. Fill in the job details:
   - **Job Name**: A descriptive name for the job.
   - **Job Type**: The type of job (reward, system, or custom).
   - **Frequency**: How often the job should run.
4. Click "Add Job" to create the job.

### Through Code

1. Define the job in the appropriate job manager (e.g., `reward-job-manager.ts` or `system-job-manager.ts`).
2. Register the job in the job manager's `registerJobs` method.
3. Implement the job handler function.
4. Test the job through the admin UI.

Example job definition:

```typescript
const myNewJob: JobDefinition = {
  id: 'my-new-job',
  name: 'My New Job',
  description: 'Description of my new job',
  frequency: JobFrequency.DAILY,
  handler: async () => {
    // Job implementation
    return { success: true };
  },
  priority: 5,
  timeout: 10 * 60 * 1000, // 10 minutes
  retryCount: 3,
  retryDelay: 5 * 60 * 1000, // 5 minutes
  enabled: true
};
```

## Performance Optimization

To optimize the performance of background jobs, consider the following strategies:

### 1. Job Batching

Process items in batches rather than individually to reduce overhead:

```typescript
// Process students in batches
const batchSize = 50;
for (let i = 0; i < students.length; i += batchSize) {
  const batch = students.slice(i, i + batchSize);
  await Promise.all(batch.map(student => processStudent(student)));
}
```

### 2. Distributed Processing

Use multiple workers to process jobs in parallel:

1. Configure the worker count in the scaling options.
2. Choose an appropriate distribution strategy.
3. Monitor performance to find the optimal configuration.

### 3. Database Optimization

Optimize database queries used in background jobs:

1. Use indexes for frequently queried fields.
2. Use efficient query patterns (e.g., batch queries, pagination).
3. Consider using raw SQL for performance-critical operations.

### 4. Caching

Implement caching for frequently accessed data:

1. Use in-memory caching for short-lived data.
2. Consider using Redis for distributed caching.
3. Implement cache invalidation strategies.

## Alerting and Monitoring

To effectively monitor and respond to job failures:

### 1. Configure Alert Thresholds

Set appropriate thresholds for alerts based on job importance:

1. High severity for critical jobs.
2. Medium severity for important but non-critical jobs.
3. Low severity for routine jobs.

### 2. Set Up Notification Channels

Configure notification channels for alerts:

1. Email notifications for high-severity alerts.
2. Dashboard notifications for all alerts.
3. Consider integrating with external monitoring systems.

### 3. Monitor System Resources

Keep an eye on system resources to prevent performance issues:

1. Monitor CPU usage and add capacity when needed.
2. Monitor memory usage to prevent out-of-memory errors.
3. Monitor disk space for log files and temporary data.

### 4. Analyze Job Performance

Regularly analyze job performance to identify optimization opportunities:

1. Look for jobs with increasing execution times.
2. Identify jobs that frequently fail.
3. Optimize high-impact jobs first.
