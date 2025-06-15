'use client';

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Users, BookOpen, GraduationCap } from "lucide-react";

export default function CoordinatorAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not a coordinator
    if (user && user.userType !== 'COORDINATOR' && user.userType !== 'CAMPUS_COORDINATOR') {
      router.push('/login');
      return;
    }
  }, [user, router]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View performance analytics for classes, including attendance, assessment results, and more.
            </p>
            <Button
              onClick={() => router.push('/admin/coordinator/analytics/class')}
              className="w-full"
            >
              View Class Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Teacher Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View performance analytics for teachers, including class management, assessment creation, and more.
            </p>
            <Button
              onClick={() => router.push('/admin/coordinator/analytics/teacher')}
              className="w-full"
            >
              View Teacher Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="mr-2 h-5 w-5" />
              Student Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View performance analytics for students, including attendance, assessment results, and more.
            </p>
            <Button
              onClick={() => router.push('/admin/coordinator/analytics/student')}
              className="w-full"
            >
              View Student Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Program Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              View performance analytics for programs, including enrollment, completion rates, and more.
            </p>
            <Button
              onClick={() => router.push('/admin/coordinator/analytics/program')}
              className="w-full"
            >
              View Program Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
