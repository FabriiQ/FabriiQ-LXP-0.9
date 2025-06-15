"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import ScheduleManager from "@/components/teacher/schedule/ScheduleManager";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TeacherSchedulePage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/api/auth/signin");
    },
  });

  const teacherId = session?.user?.id;

  if (!teacherId) {
    return null;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Schedule Management"
          description="Manage your weekly teaching schedule"
        />
        <Link href="/teacher/dashboard">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <ScheduleManager teacherId={teacherId} />
    </div>
  );
} 