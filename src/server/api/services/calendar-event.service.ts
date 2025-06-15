import { AcademicCalendarEvent } from '@prisma/client';
import { ServiceBase, ServiceOptions } from './service-base';
import {
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarEventFilters,
  AcademicEventType,
  DATE_VALIDATION_RULES
} from '../types/academic-calendar';

export class CalendarEventService extends ServiceBase {
  constructor(options: ServiceOptions) {
    super(options);
  }

  async create(input: CreateCalendarEventInput): Promise<AcademicCalendarEvent> {
    // Implementation
    throw new Error("Not implemented");
  }

  async update(input: UpdateCalendarEventInput): Promise<AcademicCalendarEvent> {
    // Implementation
    throw new Error("Not implemented");
  }

  async list(filters: CalendarEventFilters): Promise<AcademicCalendarEvent[]> {
    // Implementation
    throw new Error("Not implemented");
  }
}