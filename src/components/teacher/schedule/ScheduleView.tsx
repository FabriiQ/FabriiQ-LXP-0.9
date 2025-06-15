"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { DayOfWeek } from "@prisma/client";

interface ClassPeriod {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  class: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
    };
  };
}

interface TeacherSchedule {
  id: string;
  periods: ClassPeriod[];
}

interface Term {
  id: string;
  name: string;
}

interface ScheduleViewProps {
  schedule: TeacherSchedule;
  terms: Term[];
  currentTermId: string;
}

const dayOrder: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

export default function ScheduleView({
  schedule,
  terms,
  currentTermId,
}: ScheduleViewProps) {
  const [selectedTermId, setSelectedTermId] = useState<string>(currentTermId);

  // Group periods by day
  const periodsByDay = dayOrder.reduce((acc, day) => {
    acc[day] = schedule.periods.filter((period) => period.dayOfWeek === day);
    return acc;
  }, {} as Record<DayOfWeek, ClassPeriod[]>);

  // Sort periods by start time
  Object.keys(periodsByDay).forEach((day) => {
    periodsByDay[day as DayOfWeek].sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
  });

  const handleTermChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTermId(e.target.value);
    // In a real implementation, this would fetch the schedule for the selected term
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Weekly Schedule</h3>
        <select
          value={selectedTermId}
          onChange={handleTermChange}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        >
          {terms.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {dayOrder.map((day) => (
          <Card key={day} className="p-4">
            <h4 className="font-medium text-center border-b pb-2 mb-3">
              {day.charAt(0) + day.slice(1).toLowerCase()}
            </h4>
            <div className="space-y-3">
              {periodsByDay[day]?.length > 0 ? (
                periodsByDay[day].map((period) => (
                  <div
                    key={period.id}
                    className="bg-primary-50 p-3 rounded border border-primary-100"
                  >
                    <p className="text-sm font-medium">
                      {period.class.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {period.class.subject.name}
                    </p>
                    <p className="text-xs mt-2 text-primary-700">
                      {formatTime(period.startTime)} - {formatTime(period.endTime)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  No classes
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 