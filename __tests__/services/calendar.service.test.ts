import { CalendarService } from '@/app/student/utils/calendar.service';
import { Activity } from '@/features/activities/types/activity-schema';
import { addDays } from 'date-fns';

describe('CalendarService', () => {
  const mockActivity: Activity = {
    id: '1',
    title: 'Math Quiz',
    subject: 'Mathematics',
    type: 'Quiz',
    dueDate: new Date('2023-06-15'),
    status: 'pending',
    classId: 'class-123',
    className: 'Math 101',
    chapter: 'Chapter 1: Algebra',
  };

  const mockActivities: Activity[] = [
    mockActivity,
    {
      id: '2',
      title: 'Science Project',
      subject: 'Science',
      type: 'Project',
      dueDate: new Date('2023-06-20'),
      status: 'pending',
      classId: 'class-123',
      className: 'Science 101',
      chapter: 'Chapter 2: Biology',
    },
  ];

  describe('getEstimatedTime', () => {
    it('returns the estimated time for a known activity type', () => {
      const time = CalendarService.getEstimatedTime(mockActivity);
      expect(time).toBe(15); // Quiz should be 15 minutes
    });

    it('returns default time for unknown activity type', () => {
      const unknownActivity = { ...mockActivity, type: 'Unknown' };
      const time = CalendarService.getEstimatedTime(unknownActivity);
      expect(time).toBe(30); // Default is 30 minutes
    });
  });

  describe('getActivitiesForDate', () => {
    it('returns activities for a specific date', () => {
      const date = new Date('2023-06-15');
      const result = CalendarService.getActivitiesForDate(mockActivities, date);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array when no activities match the date', () => {
      const date = new Date('2023-06-16');
      const result = CalendarService.getActivitiesForDate(mockActivities, date);
      expect(result).toHaveLength(0);
    });
  });

  describe('getActivityTypeColor', () => {
    it('returns the correct color for a known activity type', () => {
      const color = CalendarService.getActivityTypeColor('Quiz');
      expect(color).toBe('bg-primary/10 text-primary');
    });

    it('returns default color for unknown activity type', () => {
      const color = CalendarService.getActivityTypeColor('Unknown');
      expect(color).toBe('bg-gray-500/10 text-gray-500');
    });
  });

  describe('isFreshStartOpportunity', () => {
    it('identifies first day of month as fresh start', () => {
      const date = new Date('2023-06-01');
      const result = CalendarService.isFreshStartOpportunity(date);
      expect(result).toBe(true);
    });

    it('identifies first day of week (Monday) as fresh start', () => {
      // Create a date that is a Monday
      const monday = new Date('2023-06-05'); // This is a Monday
      const result = CalendarService.isFreshStartOpportunity(monday);
      expect(result).toBe(true);
    });

    it('returns false for regular days', () => {
      const date = new Date('2023-06-15');
      const result = CalendarService.isFreshStartOpportunity(date);
      expect(result).toBe(false);
    });
  });

  describe('getUrgencyLevel', () => {
    it('returns high urgency for activities due within 1 day', () => {
      const today = new Date();
      const activity = { ...mockActivity, dueDate: today };
      const urgency = CalendarService.getUrgencyLevel(activity);
      expect(urgency).toBe('high');
    });

    it('returns medium urgency for activities due within 3 days', () => {
      const threeDaysFromNow = addDays(new Date(), 3);
      const activity = { ...mockActivity, dueDate: threeDaysFromNow };
      const urgency = CalendarService.getUrgencyLevel(activity);
      expect(urgency).toBe('medium');
    });

    it('returns low urgency for activities due in more than 3 days', () => {
      const fiveDaysFromNow = addDays(new Date(), 5);
      const activity = { ...mockActivity, dueDate: fiveDaysFromNow };
      const urgency = CalendarService.getUrgencyLevel(activity);
      expect(urgency).toBe('low');
    });
  });

  describe('generateICSContent', () => {
    it('generates valid ICS content for an activity', () => {
      const icsContent = CalendarService.generateICSContent(mockActivity);
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('VERSION:2.0');
      expect(icsContent).toContain('SUMMARY:Math Quiz');
      expect(icsContent).toContain('DESCRIPTION:Quiz for Mathematics - Chapter 1: Algebra');
      expect(icsContent).toContain('END:VCALENDAR');
    });
  });

  describe('getOptimalStudySchedule', () => {
    it('returns empty array for activities already due', () => {
      const pastActivity = { ...mockActivity, dueDate: new Date('2023-01-01') };
      const schedule = CalendarService.getOptimalStudySchedule(pastActivity);
      expect(schedule).toHaveLength(0);
    });

    it('returns one date for activities due within 2 days', () => {
      const twoDaysFromNow = addDays(new Date(), 2);
      const activity = { ...mockActivity, dueDate: twoDaysFromNow };
      const schedule = CalendarService.getOptimalStudySchedule(activity);
      expect(schedule).toHaveLength(1);
    });

    it('returns multiple dates for activities due in more than a week', () => {
      const tenDaysFromNow = addDays(new Date(), 10);
      const activity = { ...mockActivity, dueDate: tenDaysFromNow };
      const schedule = CalendarService.getOptimalStudySchedule(activity);
      expect(schedule.length).toBeGreaterThan(1);
    });
  });
});
