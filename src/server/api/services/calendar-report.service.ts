import { PrismaClient, SystemStatus, AcademicEventType, HolidayType, AcademicCalendarEvent, Holiday, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { ServiceBase } from "./service-base";
import { HolidayService } from "./holiday.service";
import { AcademicCalendarService } from "./academic-calendar.service";
import { eachMonthOfInterval, format, startOfMonth, endOfMonth } from "date-fns";

interface CalendarReportServiceContext {
  prisma: PrismaClient;
}

// Define the exact types from the schema
type AcademicCalendarEventWithRelations = Prisma.AcademicCalendarEventGetPayload<{
  include: {
    academicCycle: true;
    campuses: true;
    users: true;
  }
}>;

type HolidayWithRelations = Prisma.HolidayGetPayload<{
  include: {
    users: true,
  }
}>;

export class CalendarReportService extends ServiceBase {
  private academicCalendarService: AcademicCalendarService;
  private holidayService: HolidayService;

  constructor(context: CalendarReportServiceContext) {
    super(context);
    this.academicCalendarService = new AcademicCalendarService(context);
    this.holidayService = new HolidayService(context);
  }

  private calculateWorkingDays(startDate: Date, endDate: Date, holidays: HolidayWithRelations[]): number {
    let workingDays = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      // Skip weekends
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        // Check if it's not a holiday
        const isHoliday = holidays.some(holiday => 
          current >= holiday.startDate && current <= holiday.endDate
        );
        if (!isHoliday) {
          workingDays++;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  }

  private formatEventForReport(event: AcademicCalendarEventWithRelations) {
    // Find the creator user from the users array
    const creator = event.users.find(user => user.id === event.createdBy) || { name: 'Unknown' };
    
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      type: event.type,
      academicCycle: event.academicCycle?.name,
      createdBy: creator.name
    };
  }

  private formatHolidayForReport(holiday: HolidayWithRelations) {
    // Find the creator user from the users array
    const creator = holiday.users.find(user => user.id === holiday.createdBy) || { name: 'Unknown' };
    
    return {
      id: holiday.id,
      name: holiday.name,
      description: holiday.description,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      type: holiday.type,
      affectsAll: holiday.affectsAll,
      createdBy: creator.name
    };
  }

  /**
   * Generates a monthly calendar report
   */
  async generateMonthlyReport(date: Date) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    // Get events and holidays for the month
    const [baseEvents, baseHolidays] = await Promise.all([
      this.academicCalendarService.getEventsInRange(start, end),
      this.holidayService.getHolidaysInRange(start, end)
    ]);

    // Add related information
    const events = await Promise.all(
      baseEvents.map(event => 
        this.prisma.academicCalendarEvent.findUnique({
          where: { id: event.id },
          include: {
            academicCycle: true,
            campuses: true,
            users: true,
          }
        })
      )
    ).then(events => events.filter((e): e is AcademicCalendarEventWithRelations => e !== null));

    const holidays = await Promise.all(
      baseHolidays.map(holiday => 
        this.prisma.holiday.findUnique({
          where: { id: holiday.id },
          include: {
            users: true,
          }
        })
      )
    ).then(holidays => holidays.filter((h): h is HolidayWithRelations => h !== null));

    // Group events by type
    const eventsByType = events.reduce<Record<AcademicEventType, AcademicCalendarEventWithRelations[]>>((acc, event) => {
      const type = event.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(event);
      return acc;
    }, {} as Record<AcademicEventType, AcademicCalendarEventWithRelations[]>);

    // Group holidays by type
    const holidaysByType = holidays.reduce<Record<HolidayType, HolidayWithRelations[]>>((acc, holiday) => {
      const type = holiday.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(holiday);
      return acc;
    }, {} as Record<HolidayType, HolidayWithRelations[]>);

    // Calculate statistics
    const totalEvents = events.length;
    const totalHolidays = holidays.length;
    const workingDays = this.calculateWorkingDays(start, end, holidays);

    return {
      period: {
        start,
        end,
        month: format(date, 'MMMM yyyy')
      },
      summary: {
        totalEvents,
        totalHolidays,
        workingDays,
        eventsByType: Object.entries(eventsByType).map(([type, events]) => ({
          type,
          count: events.length,
          events: events.map(event => this.formatEventForReport(event))
        })),
        holidaysByType: Object.entries(holidaysByType).map(([type, holidays]) => ({
          type,
          count: holidays.length,
          holidays: holidays.map(holiday => this.formatHolidayForReport(holiday))
        }))
      }
    };
  }

  /**
   * Generates an academic term calendar report
   */
  async generateTermReport(termId: string) {
    try {
      // Get term details
      const term = await this.prisma.term.findUnique({
        where: { id: termId },
        include: {
          academicCycle: true
        }
      });

      if (!term) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Term not found"
        });
      }

      // Get all events and holidays for the term
      const [baseEvents, baseHolidays] = await Promise.all([
        this.academicCalendarService.getEventsInRange(term.startDate, term.endDate),
        this.holidayService.getHolidaysInRange(term.startDate, term.endDate)
      ]);

      // Get full details for events and holidays
      const events = await Promise.all(
        baseEvents.map(event => 
          this.prisma.academicCalendarEvent.findUnique({
            where: { id: event.id },
            include: {
              academicCycle: true,
              campuses: true,
              users: true,
            }
          })
        )
      ).then(events => events.filter((e): e is AcademicCalendarEventWithRelations => e !== null));

      const holidays = await Promise.all(
        baseHolidays.map(holiday => 
          this.prisma.holiday.findUnique({
            where: { id: holiday.id },
            include: {
              users: true,
            }
          })
        )
      ).then(holidays => holidays.filter((h): h is HolidayWithRelations => h !== null));

      // Generate monthly breakdowns
      const months = eachMonthOfInterval({
        start: term.startDate,
        end: term.endDate
      });

      const monthlyBreakdowns = await Promise.all(
        months.map(month => this.generateMonthlyReport(month))
      );

      return {
        term: {
          id: term.id,
          name: term.name,
          academicCycle: term.academicCycle.name,
          startDate: term.startDate,
          endDate: term.endDate
        },
        summary: {
          totalEvents: events.length,
          totalHolidays: holidays.length,
          workingDays: this.calculateWorkingDays(term.startDate, term.endDate, holidays),
          events: events.map(this.formatEventForReport),
          holidays: holidays.map(this.formatHolidayForReport)
        },
        monthlyBreakdowns
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate term calendar report",
        cause: error
      });
    }
  }
} 