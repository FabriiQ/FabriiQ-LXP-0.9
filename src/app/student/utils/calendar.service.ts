import { Activity } from '@/components/shared/entities/students/StudentActivityGridClient';
import { isSameDay, addDays } from 'date-fns';
import { differenceInDays } from '@/app/student/utils/date-utils';

/**
 * Study Location interface for Method of Loci implementation
 */
export interface StudyLocation {
  id: string;
  name: string;
  description?: string;
  isPreferred: boolean;
}

/**
 * Study Streak interface for tracking consistent engagement
 */
export interface StudyStreak {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  streakDates: Date[];
}

/**
 * Calendar Service
 *
 * Provides helper functions for calendar-related operations
 * including optimal study scheduling, activity categorization,
 * and calendar data processing.
 */
export class CalendarService {
  /**
   * Get estimated completion time for an activity
   * @param activity The activity to estimate time for
   * @returns Estimated time in minutes
   */
  static getEstimatedTime(activity: Activity): number {
    // This would ideally come from the activity data
    // For now, we'll use a simple mapping based on activity type
    const timeMap: Record<string, number> = {
      'Quiz': 15,
      'Assignment': 45,
      'Exam': 90,
      'Reading': 30,
      'Discussion': 20,
      'Project': 120,
      'Video': 25,
      'Practice': 30,
      'MULTIPLE_CHOICE': 15,
      'MULTIPLE_RESPONSE': 20,
      'TRUE_FALSE': 10,
      'FILL_IN_THE_BLANKS': 25,
      'MATCHING': 20,
      'SEQUENCE': 25,
      'NUMERIC': 15,
      'OPEN_ENDED': 30,
    };

    return timeMap[activity.type] || 30; // Default to 30 minutes
  }

  /**
   * Get activities for a specific date
   * @param activities List of all activities
   * @param date The date to filter by
   * @returns Activities due on the specified date
   */
  static getActivitiesForDate(activities: Activity[], date: Date): Activity[] {
    return activities.filter(activity => {
      const activityDate = new Date(activity.dueDate);
      return isSameDay(activityDate, date);
    });
  }

  /**
   * Get activity type color
   * @param type Activity type
   * @returns CSS class string for the activity type
   */
  static getActivityTypeColor(type: string): string {
    const typeMap: Record<string, string> = {
      'Quiz': 'bg-primary/10 text-primary',
      'Assignment': 'bg-amber-500/10 text-amber-500',
      'Exam': 'bg-red-500/10 text-red-500',
      'Reading': 'bg-blue-500/10 text-blue-500',
      'Discussion': 'bg-purple-500/10 text-purple-500',
      'Project': 'bg-emerald-500/10 text-emerald-500',
      'Video': 'bg-pink-500/10 text-pink-500',
      'Practice': 'bg-indigo-500/10 text-indigo-500',
      'MULTIPLE_CHOICE': 'bg-primary/10 text-primary',
      'MULTIPLE_RESPONSE': 'bg-amber-500/10 text-amber-500',
      'TRUE_FALSE': 'bg-blue-500/10 text-blue-500',
      'FILL_IN_THE_BLANKS': 'bg-purple-500/10 text-purple-500',
      'MATCHING': 'bg-emerald-500/10 text-emerald-500',
      'SEQUENCE': 'bg-pink-500/10 text-pink-500',
      'NUMERIC': 'bg-indigo-500/10 text-indigo-500',
      'OPEN_ENDED': 'bg-red-500/10 text-red-500',
    };

    return typeMap[type] || 'bg-gray-500/10 text-gray-500';
  }

  /**
   * Get optimal study schedule for an activity
   * @param activity The activity to schedule for
   * @returns Array of recommended study dates
   */
  static getOptimalStudySchedule(activity: Activity): Date[] {
    const dueDate = new Date(activity.dueDate);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);

    // If already due or due today, return empty array
    if (daysUntilDue <= 0) {
      return [];
    }

    const studyDates: Date[] = [];

    // Apply spacing effect based on activity type and time until due
    if (daysUntilDue <= 2) {
      // If due within 2 days, study today
      studyDates.push(today);
    } else if (daysUntilDue <= 7) {
      // If due within a week, study today and halfway to due date
      studyDates.push(today);
      studyDates.push(addDays(today, Math.floor(daysUntilDue / 2)));
    } else {
      // If due in more than a week, apply spaced repetition
      // First session today
      studyDates.push(today);

      // Second session after 1-2 days
      studyDates.push(addDays(today, 2));

      // Third session at about 40% of the way to due date
      studyDates.push(addDays(today, Math.floor(daysUntilDue * 0.4)));

      // Final review 1-2 days before due date
      studyDates.push(addDays(dueDate, -2));
    }

    return studyDates;
  }

  /**
   * Check if a date is a "fresh start" opportunity
   * @param date The date to check
   * @returns Boolean indicating if the date is a fresh start
   */
  static isFreshStartOpportunity(date: Date): boolean {
    // First day of month
    if (date.getDate() === 1) {
      return true;
    }

    // First day of week (Monday)
    if (date.getDay() === 1) {
      return true;
    }

    // First day after a holiday (would need holiday calendar)

    return false;
  }

  /**
   * Get urgency level for an activity
   * @param activity The activity to check
   * @returns Urgency level (high, medium, low)
   */
  static getUrgencyLevel(activity: Activity): 'high' | 'medium' | 'low' {
    const dueDate = new Date(activity.dueDate);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);

    if (daysUntilDue <= 1) {
      return 'high';
    } else if (daysUntilDue <= 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate ICS file content for an activity (for calendar export)
   * @param activity The activity to export
   * @returns String containing ICS file content
   */
  static generateICSContent(activity: Activity): string {
    const dueDate = new Date(activity.dueDate);
    const estimatedTime = this.getEstimatedTime(activity);
    const endTime = new Date(dueDate.getTime() + estimatedTime * 60000);

    // Format date for ICS file
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    };

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Aivy LXP//Class Calendar//EN
BEGIN:VEVENT
UID:${activity.id}@aivy-lxp
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(dueDate)}
DTEND:${formatICSDate(endTime)}
SUMMARY:${activity.title}
DESCRIPTION:${activity.type} for ${activity.subject}${activity.chapter ? ` - ${activity.chapter}` : ''}
LOCATION:${activity.className}
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Get study streak information
   * @param studentId The student ID to get streak for
   * @returns Promise with streak information
   */
  static async getStudyStreak(studentId: string): Promise<StudyStreak> {
    try {
      // Try to get streak from IndexedDB first (for offline support)
      const cachedStreak = await this.getStudyStreakFromCache(studentId);
      if (cachedStreak) {
        return cachedStreak;
      }

      // If not in cache or online, fetch from API
      if (typeof window !== 'undefined' && navigator.onLine) {
        // This would be replaced with an actual API call
        // For now, we'll return mock data
        const mockStreak: StudyStreak = {
          currentStreak: 5,
          longestStreak: 14,
          lastStudyDate: new Date(),
          streakDates: [
            new Date(),
            new Date(Date.now() - 86400000),
            new Date(Date.now() - 86400000 * 2),
            new Date(Date.now() - 86400000 * 3),
            new Date(Date.now() - 86400000 * 4),
          ]
        };

        // Cache the streak data
        await this.saveStudyStreakToCache(studentId, mockStreak);
        return mockStreak;
      }

      // Default empty streak if offline and no cache
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakDates: []
      };
    } catch (error) {
      console.error('Error getting study streak:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakDates: []
      };
    }
  }

  /**
   * Get study streak from IndexedDB cache
   * @param studentId The student ID
   * @returns Promise with streak information or null
   */
  private static async getStudyStreakFromCache(studentId: string): Promise<StudyStreak | null> {
    try {
      // This would use the actual IndexedDB implementation
      // For now, we'll check localStorage as a simple alternative
      const streakData = localStorage.getItem(`study-streak-${studentId}`);
      if (streakData) {
        const streak = JSON.parse(streakData);
        // Convert date strings back to Date objects
        if (streak.lastStudyDate) {
          streak.lastStudyDate = new Date(streak.lastStudyDate);
        }
        if (streak.streakDates) {
          streak.streakDates = streak.streakDates.map((d: string) => new Date(d));
        }
        return streak;
      }
      return null;
    } catch (error) {
      console.error('Error getting study streak from cache:', error);
      return null;
    }
  }

  /**
   * Save study streak to IndexedDB cache
   * @param studentId The student ID
   * @param streak The streak data to save
   */
  private static async saveStudyStreakToCache(studentId: string, streak: StudyStreak): Promise<void> {
    try {
      // This would use the actual IndexedDB implementation
      // For now, we'll use localStorage as a simple alternative
      localStorage.setItem(`study-streak-${studentId}`, JSON.stringify(streak));
    } catch (error) {
      console.error('Error saving study streak to cache:', error);
    }
  }

  /**
   * Get study locations for Method of Loci implementation
   * @param studentId The student ID
   * @returns Promise with array of study locations
   */
  static async getStudyLocations(studentId: string): Promise<StudyLocation[]> {
    try {
      // Try to get locations from IndexedDB first (for offline support)
      const cachedLocations = await this.getStudyLocationsFromCache(studentId);
      if (cachedLocations && cachedLocations.length > 0) {
        return cachedLocations;
      }

      // If not in cache or online, fetch from API
      if (typeof window !== 'undefined' && navigator.onLine) {
        // This would be replaced with an actual API call
        // For now, we'll return mock data
        const mockLocations: StudyLocation[] = [
          { id: '1', name: 'Library', description: 'Quiet environment with resources', isPreferred: true },
          { id: '2', name: 'Home Desk', description: 'Familiar environment', isPreferred: true },
          { id: '3', name: 'Campus Study Room', description: 'Collaborative space', isPreferred: false },
          { id: '4', name: 'Coffee Shop', description: 'Ambient noise', isPreferred: false },
        ];

        // Cache the locations data
        await this.saveStudyLocationsToCache(studentId, mockLocations);
        return mockLocations;
      }

      // Default empty array if offline and no cache
      return [];
    } catch (error) {
      console.error('Error getting study locations:', error);
      return [];
    }
  }

  /**
   * Get study locations from IndexedDB cache
   * @param studentId The student ID
   * @returns Promise with array of study locations or null
   */
  private static async getStudyLocationsFromCache(studentId: string): Promise<StudyLocation[] | null> {
    try {
      // This would use the actual IndexedDB implementation
      // For now, we'll check localStorage as a simple alternative
      const locationsData = localStorage.getItem(`study-locations-${studentId}`);
      if (locationsData) {
        return JSON.parse(locationsData);
      }
      return null;
    } catch (error) {
      console.error('Error getting study locations from cache:', error);
      return null;
    }
  }

  /**
   * Save study locations to IndexedDB cache
   * @param studentId The student ID
   * @param locations The locations data to save
   */
  private static async saveStudyLocationsToCache(studentId: string, locations: StudyLocation[]): Promise<void> {
    try {
      // This would use the actual IndexedDB implementation
      // For now, we'll use localStorage as a simple alternative
      localStorage.setItem(`study-locations-${studentId}`, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving study locations to cache:', error);
    }
  }

  /**
   * Associate a study location with an activity (Method of Loci)
   * @param activityId The activity ID
   * @param locationId The location ID
   * @param studentId The student ID
   */
  static async associateLocationWithActivity(
    activityId: string,
    locationId: string,
    studentId: string
  ): Promise<void> {
    try {
      // This would use the actual IndexedDB implementation
      // For now, we'll use localStorage as a simple alternative
      const key = `activity-location-${activityId}`;
      localStorage.setItem(key, locationId);

      // Also store in a student-specific mapping for quick lookup
      const mappingsKey = `student-activity-locations-${studentId}`;
      const existingMappings = localStorage.getItem(mappingsKey);
      const mappings = existingMappings ? JSON.parse(existingMappings) : {};
      mappings[activityId] = locationId;
      localStorage.setItem(mappingsKey, JSON.stringify(mappings));
    } catch (error) {
      console.error('Error associating location with activity:', error);
    }
  }

  /**
   * Get location associated with an activity
   * @param activityId The activity ID
   * @returns Promise with location ID or null
   */
  static async getActivityLocation(activityId: string): Promise<string | null> {
    try {
      // This would use the actual IndexedDB implementation
      // For now, we'll check localStorage as a simple alternative
      const locationId = localStorage.getItem(`activity-location-${activityId}`);
      return locationId;
    } catch (error) {
      console.error('Error getting activity location:', error);
      return null;
    }
  }
}
