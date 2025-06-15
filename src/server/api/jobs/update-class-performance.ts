import { PrismaClient } from '@prisma/client';
import { ClassPerformanceService } from '../services/class-performance.service';
import { logger } from '../utils/logger';

/**
 * Background job to update class performance metrics
 * This job can be scheduled to run periodically to ensure class performance data is up-to-date
 */
export async function updateClassPerformanceMetrics() {
  const prisma = new PrismaClient();
  
  try {
    logger.info('Starting class performance metrics update job');
    
    // Get all active classes
    const classes = await prisma.class.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });
    
    logger.info(`Found ${classes.length} active classes to update`);
    
    // Create service instance
    const service = new ClassPerformanceService({ prisma });
    
    // Process classes in batches to avoid memory issues
    const batchSize = 50;
    for (let i = 0; i < classes.length; i += batchSize) {
      const batch = classes.slice(i, i + batchSize);
      const classIds = batch.map(c => c.id);
      
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(classes.length / batchSize)}`);
      
      // Update metrics for this batch
      await service.batchUpdateClassPerformance(classIds);
    }
    
    logger.info('Class performance metrics update job completed successfully');
  } catch (error) {
    logger.error('Error in class performance metrics update job', { error });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Background job to update class performance metrics for a specific class
 * This job can be triggered when relevant data for a class changes
 */
export async function updateClassPerformanceMetricsForClass(classId: string) {
  const prisma = new PrismaClient();
  
  try {
    logger.info(`Starting class performance metrics update for class ${classId}`);
    
    // Create service instance
    const service = new ClassPerformanceService({ prisma });
    
    // Update metrics for this class
    await service.calculateAndUpdateMetrics(classId);
    
    logger.info(`Class performance metrics update for class ${classId} completed successfully`);
  } catch (error) {
    logger.error(`Error updating class performance metrics for class ${classId}`, { error });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Register event listeners for automatic updates
 * This function should be called when the application starts
 */
export function registerClassPerformanceEventListeners(prisma: PrismaClient) {
  // These are examples of events that could trigger updates
  // The actual implementation would depend on the event system used in the application
  
  // Example: Listen for activity creation
  prisma.$use(async (params, next) => {
    const result = await next(params);
    
    // If an activity was created, update the class performance
    if (params.model === 'Activity' && params.action === 'create' && result.classId) {
      void updateClassPerformanceMetricsForClass(result.classId);
    }
    
    return result;
  });
  
  // Example: Listen for grade updates
  prisma.$use(async (params, next) => {
    const result = await next(params);
    
    // If a grade was updated, get the activity and update the class performance
    if (params.model === 'ActivityGrade' && 
        (params.action === 'create' || params.action === 'update') && 
        result.activityId) {
      try {
        const activity = await prisma.activity.findUnique({
          where: { id: result.activityId },
          select: { classId: true }
        });
        
        if (activity?.classId) {
          void updateClassPerformanceMetricsForClass(activity.classId);
        }
      } catch (error) {
        logger.error('Error getting activity for class performance update', { error });
      }
    }
    
    return result;
  });
  
  // Example: Listen for attendance updates
  prisma.$use(async (params, next) => {
    const result = await next(params);
    
    // If attendance was updated, update the class performance
    if (params.model === 'Attendance' && 
        (params.action === 'create' || params.action === 'update') && 
        result.classId) {
      void updateClassPerformanceMetricsForClass(result.classId);
    }
    
    return result;
  });
  
  logger.info('Class performance event listeners registered');
}
