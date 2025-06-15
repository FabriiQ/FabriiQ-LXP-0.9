import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ClassCalendar from '@/components/student/ClassCalendar';
import { Activity } from '@/features/activities/types/activity-schema';
import { format } from 'date-fns';

// Mock the calendar service
jest.mock('@/services/calendar.service', () => ({
  CalendarService: {
    getActivityTypeColor: jest.fn().mockReturnValue('bg-primary/10 text-primary'),
    getEstimatedTime: jest.fn().mockReturnValue(30),
    getActivitiesForDate: jest.fn().mockImplementation((activities, date) => {
      return activities.filter(activity =>
        format(new Date(activity.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
    }),
    isFreshStartOpportunity: jest.fn().mockImplementation(date => date.getDate() === 1),
    getUrgencyLevel: jest.fn().mockReturnValue('medium'),
    generateICSContent: jest.fn().mockReturnValue('BEGIN:VCALENDAR\nEND:VCALENDAR'),
  }
}));

// Mock IndexedDB functions
jest.mock('@/features/activities/offline/db', () => ({
  saveActivity: jest.fn(),
  getActivities: jest.fn(),
}));

// Mock isOnline function
jest.mock('@/utils/offline-storage', () => ({
  isOnline: jest.fn().mockReturnValue(true),
}));

describe('ClassCalendar Component', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      title: 'Math Quiz',
      subject: 'Mathematics',
      type: 'Quiz',
      dueDate: new Date('2023-06-15'),
      status: 'pending',
      classId: 'class-123',
      className: 'Math 101',
      chapter: 'Chapter 1: Algebra',
    },
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

  it('renders the calendar component', () => {
    render(<ClassCalendar activities={mockActivities} classId="class-123" />);

    // Check if the calendar title is rendered
    expect(screen.getByText(/Calendar/i)).toBeInTheDocument();

    // Check if view options are available
    expect(screen.getByRole('tab', { name: /Month/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Week/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Day/i })).toBeInTheDocument();
  });

  it('switches between different views', () => {
    render(<ClassCalendar activities={mockActivities} classId="class-123" />);

    // Default view should be month
    expect(screen.getByRole('tab', { name: /Month/i })).toHaveAttribute('aria-selected', 'true');

    // Switch to week view
    fireEvent.click(screen.getByRole('tab', { name: /Week/i }));
    expect(screen.getByRole('tab', { name: /Week/i })).toHaveAttribute('aria-selected', 'true');

    // Switch to day view
    fireEvent.click(screen.getByRole('tab', { name: /Day/i }));
    expect(screen.getByRole('tab', { name: /Day/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('displays loading state', () => {
    render(<ClassCalendar activities={[]} classId="class-123" isLoading={true} />);

    // Check if loading skeleton is displayed
    expect(screen.getAllByTestId('skeleton')).toHaveLength(1);
  });

  it('displays error state', () => {
    render(<ClassCalendar activities={[]} classId="class-123" error="Failed to load calendar data" />);

    // Check if error message is displayed
    expect(screen.getByText(/Failed to load calendar data/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });

  it('navigates between months', () => {
    render(<ClassCalendar activities={mockActivities} classId="class-123" />);

    // Get the current month display
    const currentMonth = screen.getByText(format(new Date(), 'MMMM yyyy'));
    expect(currentMonth).toBeInTheDocument();

    // Navigate to next month
    fireEvent.click(screen.getByLabelText(/Next month/i));

    // Navigate to previous month
    fireEvent.click(screen.getByLabelText(/Previous month/i));

    // Go to today
    fireEvent.click(screen.getByRole('button', { name: /Today/i }));
    expect(screen.getByText(format(new Date(), 'MMMM yyyy'))).toBeInTheDocument();
  });

  it('changes density option', () => {
    render(<ClassCalendar activities={mockActivities} classId="class-123" />);

    // Open density dropdown
    fireEvent.click(screen.getByRole('combobox'));

    // Select compact view
    fireEvent.click(screen.getByRole('option', { name: /Compact/i }));

    // Open density dropdown again
    fireEvent.click(screen.getByRole('combobox'));

    // Select spacious view
    fireEvent.click(screen.getByRole('option', { name: /Spacious/i }));
  });
});
