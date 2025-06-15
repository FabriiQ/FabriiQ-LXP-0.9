"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TeacherResourcesPage() {
  const { data: session, status } = useSession({
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
          title="Teaching Resources"
          description="Manage and organize your teaching materials"
        />
        <Button variant="outline" asChild>
          <Link href="/teacher/dashboard">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your teaching resources will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}