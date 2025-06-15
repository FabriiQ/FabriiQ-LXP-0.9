'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar, Download, Clock, BarChart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceAnalyticsDashboard } from "@/components/attendance/AttendanceAnalyticsDashboard";
import { CourseAttendanceAnalytics } from "@/components/attendance/CourseAttendanceAnalytics";
import { ClassAttendanceSelector } from "@/components/attendance/ClassAttendanceSelector";
import { StudentAttendanceSelector } from "@/components/attendance/StudentAttendanceSelector";
interface CampusAttendanceContentProps {
  campus: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  classes: {
    id: string;
    name: string;
    code: string;
    courseCampus?: {
      course?: {
        name: string;
      };
    };
  }[];
  searchParams?: {
    classId?: string;
    date?: string;
  };
  isCoordinator?: boolean;
}

export function CampusAttendanceContent({
  campus,
  isCoordinator = false
}: CampusAttendanceContentProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const basePath = isCoordinator ? '/admin/coordinator' : '/admin/campus';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
          <p className="text-muted-foreground">Manage attendance at {campus.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`${basePath}/attendance/export`}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Link>
          </Button>
          <Button asChild>
            <Link href={`${basePath}/attendance/take`}>
              <Clock className="mr-2 h-4 w-4" /> Take Attendance
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">By Class</TabsTrigger>
          <TabsTrigger value="students">By Student</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AttendanceAnalyticsDashboard campusId={campus.id} />

          <Card>
            <CardHeader>
              <CardTitle>Course Attendance</CardTitle>
              <CardDescription>Attendance statistics by course</CardDescription>
            </CardHeader>
            <CardContent>
              <CourseAttendanceAnalytics campusId={campus.id} period="month" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Attendance Records</CardTitle>
                <CardDescription>Latest attendance records across all classes</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search records..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Student</th>
                      <th className="py-3 px-4 text-left font-medium">Class</th>
                      <th className="py-3 px-4 text-left font-medium">Date</th>
                      <th className="py-3 px-4 text-left font-medium">Status</th>
                      <th className="py-3 px-4 text-left font-medium">Notes</th>
                      <th className="py-3 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* This would be populated with actual data in a real implementation */}
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted-foreground">
                        No attendance records found
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <ClassAttendanceSelector campusId={campus.id} />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <StudentAttendanceSelector campusId={campus.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
