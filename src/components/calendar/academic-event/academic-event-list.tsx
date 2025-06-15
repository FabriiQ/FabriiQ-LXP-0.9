'use client';

import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import { CalendarAction, hasCalendarPermission } from '@/lib/permissions/calendar-permissions';
import { Edit, Trash2 } from 'lucide-react';
import { UserType } from '@prisma/client';

interface AcademicEvent {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: string;
  academicCycle?: { id: string; name: string };
  campus?: { id: string; name: string };
  classes: Array<{ id: string; name: string }>;
}

interface AcademicEventListProps {
  events: AcademicEvent[];
  userType: string;
  onEdit: (event: AcademicEvent) => void;
  onDelete: (eventId: string) => void;
}

const eventTypeColors = {
  REGISTRATION: 'bg-blue-100 text-blue-800',
  ADD_DROP: 'bg-purple-100 text-purple-800',
  WITHDRAWAL: 'bg-red-100 text-red-800',
  EXAMINATION: 'bg-yellow-100 text-yellow-800',
  GRADING: 'bg-green-100 text-green-800',
  ORIENTATION: 'bg-orange-100 text-orange-800',
  GRADUATION: 'bg-pink-100 text-pink-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export function AcademicEventList({
  events,
  userType,
  onEdit,
  onDelete,
}: AcademicEventListProps) {
  const canEditEvents = hasCalendarPermission(userType as UserType, CalendarAction.UPDATE_ACADEMIC_EVENT);
  const canDeleteEvents = hasCalendarPermission(userType as UserType, CalendarAction.DELETE_ACADEMIC_EVENT);

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">{event.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={eventTypeColors[event.type as keyof typeof eventTypeColors]}>
                {event.type}
              </Badge>
              {canEditEvents && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(event)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDeleteEvents && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(event.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.description && (
                <p className="text-sm text-gray-500">{event.description}</p>
              )}
              <div className="flex flex-col space-y-1 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Duration:</span>
                  <span>
                    {format(event.startDate, 'MMM d, yyyy')} -{' '}
                    {format(event.endDate, 'MMM d, yyyy')}
                  </span>
                </div>
                {event.academicCycle && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Academic Cycle:</span>
                    <Badge variant="outline">{event.academicCycle.name}</Badge>
                  </div>
                )}
                {event.campus && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Campus:</span>
                    <Badge variant="outline">{event.campus.name}</Badge>
                  </div>
                )}
                {event.classes.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Classes:</span>
                    <div className="flex flex-wrap gap-1">
                      {event.classes.map((classItem) => (
                        <Badge key={classItem.id} variant="outline">
                          {classItem.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 