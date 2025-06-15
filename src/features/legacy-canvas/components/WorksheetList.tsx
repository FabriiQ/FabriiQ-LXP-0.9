"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { api } from "@/utils/api";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function WorksheetList() {
  const { data: session } = useSession();
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Get the teacher ID from the session
  useEffect(() => {
    const fetchTeacherId = async () => {
      if (session?.user?.id) {
        try {
          const teacherData = await api.teacher.getTeacherByUserId.query({
            userId: session.user.id
          });
          if (teacherData?.id) {
            setTeacherId(teacherData.id);
          }
        } catch (error) {
          console.error("Error fetching teacher profile:", error);
        }
      }
    };

    fetchTeacherId();
  }, [session]);

  // Fetch worksheets for the teacher
  const { data: worksheets, isLoading } = api.worksheet.listByTeacher.useQuery(
    { teacherId: teacherId || "" },
    { enabled: !!teacherId }
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="p-4">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!worksheets || worksheets.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            You haven't created any worksheets yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {worksheets.map((worksheet) => (
        <Link href={`/worksheets/${worksheet.id}`} key={worksheet.id}>
          <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{worksheet.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-sm text-muted-foreground">
                {worksheet.subject?.name || "No subject"}
                {worksheet.topic && ` • ${worksheet.topic.title}`}
              </div>
              <div className="text-sm mt-2">
                Created: {new Date(worksheet.createdAt).toLocaleDateString()}
              </div>
              <div className="text-sm mt-1">
                Status: {worksheet.status}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
