'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Badge } from '@/components/ui/badge';
import { CalendarAction, hasCalendarPermission } from '@/lib/permissions/calendar-permissions';
import { UserType } from '@prisma/client';
import { Edit, Trash2 } from 'lucide-react';
import { HolidayForm } from './holiday-form';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/feedback/toast';
import { useRouter } from 'next/navigation';

interface Holiday {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: string;
  affectsAll: boolean;
  campuses: Array<{ id: string; name: string }>;
}

interface HolidayListProps {
  holidays: Holiday[];
  userType: UserType;
  campuses: Array<{ id: string; name: string }>;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holidayId: string) => void;
}

const holidayTypeColors = {
  NATIONAL: 'bg-blue-100 text-blue-800',
  RELIGIOUS: 'bg-purple-100 text-purple-800',
  INSTITUTIONAL: 'bg-green-100 text-green-800',
  ADMINISTRATIVE: 'bg-orange-100 text-orange-800',
  WEATHER: 'bg-red-100 text-red-800',
  OTHER: 'bg-gray-100 text-gray-800',
};

export function HolidayList({
  holidays,
  userType,
  campuses,
  onEdit,
  onDelete,
}: HolidayListProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  
  const canEdit = hasCalendarPermission(userType, CalendarAction.UPDATE_HOLIDAY);
  const canDelete = hasCalendarPermission(userType, CalendarAction.DELETE_HOLIDAY);

  const handleEdit = (holiday: Holiday) => {
    onEdit(holiday);
    // Navigate to edit page instead of using dialog
    router.push(`/calendar/holidays/edit/${holiday.id}`);
  };

  const handleDelete = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    // Navigate to delete confirmation page instead of using dialog
    router.push(`/calendar/holidays/delete/${holiday.id}`);
  };

  return (
    <div className="space-y-4">
      {holidays.map((holiday) => (
        <Card key={holiday.id}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{holiday.name}</h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(holiday.startDate), 'PPP')} - {format(new Date(holiday.endDate), 'PPP')}
                </p>
                {holiday.description && (
                  <p className="mt-2 text-sm">{holiday.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge>{holiday.type}</Badge>
                  {holiday.affectsAll ? (
                    <Badge variant="outline">All Campuses</Badge>
                  ) : (
                    holiday.campuses.map((campus) => (
                      <Badge key={campus.id} variant="outline">
                        {campus.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(holiday)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(holiday)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
