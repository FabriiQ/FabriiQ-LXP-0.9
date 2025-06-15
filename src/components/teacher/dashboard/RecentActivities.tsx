"use client";

import { Card } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface RecentActivitiesProps {
  teacherId: string;
}

interface Activity {
  id: string;
  title: string;
  type: string;
  classId: string;
  createdAt: string | Date;
  class: {
    name: string;
  };
}

export default function RecentActivities({ teacherId }: RecentActivitiesProps) {
  const { data: activities, isLoading } = api.activity.getTeacherActivities.useQuery({ 
    teacherId,
    limit: 5 
  });

  if (isLoading) {
    return <ActivitiesSkeleton />;
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
      
      {!activities || activities.length === 0 ? (
        <p className="text-gray-500">No recent activities.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity: Activity) => (
            <div key={activity.id} className="border-b pb-3 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.type} • {activity.class.name}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-2">
                <Link 
                  href={`/teacher/classes/${activity.classId}/activities/${activity.id}`}
                  className="text-sm text-primary-600 hover:underline"
                >
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ActivitiesSkeleton() {
  return (
    <Card className="p-4">
      <Skeleton className="h-6 w-40 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b pb-3 last:border-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <Skeleton className="h-5 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
      ))}
    </Card>
  );
} 