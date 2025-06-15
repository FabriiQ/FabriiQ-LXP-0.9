"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentLeaderboardView } from "@/components/coordinator/leaderboard/StudentLeaderboardView";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Trophy, Home, School } from "lucide-react";

export default function StudentLeaderboardPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/coordinator/dashboard">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/coordinator">
              <School className="h-4 w-4 mr-1" />
              Coordinator Portal
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Trophy className="h-4 w-4 mr-1" />
            Student Leaderboard
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold">Student Leaderboard</CardTitle>
            <CardDescription>
              View and analyze student performance across courses and classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentLeaderboardView />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
