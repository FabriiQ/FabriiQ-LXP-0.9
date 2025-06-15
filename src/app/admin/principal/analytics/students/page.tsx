"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BarChart, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

/**
 * Student Analytics Page
 * 
 * This page displays analytics for students across the campus.
 * It provides insights into student performance, attendance, and demographics.
 */
export default function StudentAnalyticsPage() {
  const { toast } = useToast();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("term");
  const [isExporting, setIsExporting] = useState(false);

  // Mock data for initial development
  // In production, this would be fetched from the API
  const mockPrograms = [
    { id: "program1", name: "Computer Science" },
    { id: "program2", name: "Business Administration" },
    { id: "program3", name: "Engineering" }
  ];

  const mockCourses = [
    { id: "course1", name: "Introduction to Programming", programId: "program1" },
    { id: "course2", name: "Data Structures", programId: "program1" },
    { id: "course3", name: "Business Ethics", programId: "program2" },
    { id: "course4", name: "Marketing Principles", programId: "program2" },
    { id: "course5", name: "Mechanical Engineering Basics", programId: "program3" }
  ];

  const mockClasses = [
    { id: "class1", name: "CS101-A", courseId: "course1" },
    { id: "class2", name: "CS101-B", courseId: "course1" },
    { id: "class3", name: "DS201-A", courseId: "course2" },
    { id: "class4", name: "BE101-A", courseId: "course3" },
    { id: "class5", name: "MP201-A", courseId: "course4" },
    { id: "class6", name: "ME101-A", courseId: "course5" }
  ];

  // Filter courses based on selected program
  const filteredCourses = selectedProgram
    ? mockCourses.filter(course => course.programId === selectedProgram)
    : mockCourses;

  // Filter classes based on selected course
  const filteredClasses = selectedCourse
    ? mockClasses.filter(cls => cls.courseId === selectedCourse)
    : mockClasses;

  // Mock analytics data
  const mockGradeDistribution = [
    { grade: 'A', count: 320 },
    { grade: 'B', count: 480 },
    { grade: 'C', count: 280 },
    { grade: 'D', count: 120 },
    { grade: 'F', count: 50 }
  ];

  const mockAttendanceTrend = [
    { month: 'Jan', attendance: 92 },
    { month: 'Feb', attendance: 94 },
    { month: 'Mar', attendance: 91 },
    { month: 'Apr', attendance: 95 },
    { month: 'May', attendance: 93 }
  ];

  const mockPerformanceBySubject = [
    { subject: 'Mathematics', performance: 78 },
    { subject: 'Science', performance: 82 },
    { subject: 'English', performance: 85 },
    { subject: 'History', performance: 76 },
    { subject: 'Computer Science', performance: 88 }
  ];

  const mockCorrelationData = [
    { name: 'Student 1', attendance: 95, performance: 88, size: 100 },
    { name: 'Student 2', attendance: 85, performance: 75, size: 100 },
    { name: 'Student 3', attendance: 98, performance: 92, size: 100 },
    { name: 'Student 4', attendance: 90, performance: 85, size: 100 },
    { name: 'Student 5', attendance: 75, performance: 68, size: 100 },
    { name: 'Student 6', attendance: 80, performance: 72, size: 100 },
    { name: 'Student 7', attendance: 92, performance: 90, size: 100 },
    { name: 'Student 8', attendance: 88, performance: 82, size: 100 },
    { name: 'Student 9', attendance: 96, performance: 95, size: 100 },
    { name: 'Student 10', attendance: 78, performance: 70, size: 100 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Handle export button click
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Export successful",
        description: "Student analytics data has been exported to Excel.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal">
              <Home className="h-4 w-4 mr-1" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/principal/analytics/students">
              <BarChart className="h-4 w-4 mr-1" />
              Student Analytics
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Student Analytics
        </h1>
        
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="self-start md:self-auto"
        >
          {isExporting ? "Exporting..." : "Export to Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {mockPrograms.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select 
            value={selectedCourse} 
            onValueChange={setSelectedCourse}
            disabled={!selectedProgram}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {filteredCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select 
            value={selectedClass} 
            onValueChange={setSelectedClass}
            disabled={!selectedCourse}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Classes</SelectItem>
              {filteredClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger>
              <SelectValue placeholder="Select Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="grades">
        <TabsList>
          <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>
                Distribution of student grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={mockGradeDistribution}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Students" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>
                Student attendance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockAttendanceTrend}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" name="Attendance Rate (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>
                Student performance by subject
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={mockPerformanceBySubject}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="subject" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="performance" name="Average Performance" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation">
          <Card>
            <CardHeader>
              <CardTitle>Correlation Analysis</CardTitle>
              <CardDescription>
                Correlation between attendance and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid />
                    <XAxis type="number" dataKey="attendance" name="Attendance Rate" unit="%" domain={[70, 100]} />
                    <YAxis type="number" dataKey="performance" name="Performance Score" unit="" domain={[60, 100]} />
                    <ZAxis type="number" dataKey="size" range={[100, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    <Scatter name="Students" data={mockCorrelationData} fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
