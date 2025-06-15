'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Activity {
  id: string;
  title: string;
  scheduledDate: Date | string;
  type: string;
  status: string;
}

interface UpcomingActivitiesProps {
  classId: string;
  activities: Activity[];
}

export function UpcomingActivities({ classId, activities }: UpcomingActivitiesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Upcoming Activities</CardTitle>
          <CardDescription>
            Learning activities scheduled for the next 14 days
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/campus/classes/${classId}/activities`}>
            <span className="mr-2">View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No upcoming activities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between p-3 border rounded-md">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <Link 
                      href={`/admin/campus/classes/${classId}/activities/${activity.id}`}
                      className="font-medium hover:underline"
                    >
                      {activity.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{activity.type}</Badge>
                      <Badge 
                        variant={activity.status === 'ACTIVE' ? 'default' : 'secondary'}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5 mr-1" />
                  {typeof activity.scheduledDate === 'string' 
                    ? activity.scheduledDate 
                    : format(new Date(activity.scheduledDate), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
