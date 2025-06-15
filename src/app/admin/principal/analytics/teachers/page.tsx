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
  Cell
} from 'recharts';

/**
 * Teacher Analytics Page
 * 
 * This page displays analytics for teachers across the campus.
 * It provides insights into teacher performance, attendance, and student outcomes.
 */
export default function TeacherAnalyticsPage() {
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("month");
  const [isExporting, setIsExporting] = useState(false);

  // Mock data for initial development
  // In production, this would be fetched from the API
  const mockDepartments = [
    { id: "dept1", name: "Science Department" },
    { id: "dept2", name: "Humanities Department" },
    { id: "dept3", name: "Mathematics Department" }
  ];

  const mockPrograms = [
    { id: "program1", name: "Computer Science", departmentId: "dept1" },
    { id: "program2", name: "Physics", departmentId: "dept1" },
    { id: "program3", name: "Literature", departmentId: "dept2" },
    { id: "program4", name: "History", departmentId: "dept2" },
    { id: "program5", name: "Applied Mathematics", departmentId: "dept3" }
  ];

  // Filter programs based on selected department
  const filteredPrograms = selectedDepartment
    ? mockPrograms.filter(program => program.departmentId === selectedDepartment)
    : mockPrograms;

  // Mock analytics data
  const mockPerformanceData = [
    { name: 'John Smith', performance: 92, attendance: 98, studentSatisfaction: 4.8 },
    { name: 'Mary Johnson', performance: 88, attendance: 95, studentSatisfaction: 4.6 },
    { name: 'Robert Davis', performance: 85, attendance: 92, studentSatisfaction: 4.5 },
    { name: 'Sarah Wilson', performance: 90, attendance: 97, studentSatisfaction: 4.7 },
    { name: 'Michael Brown', performance: 82, attendance: 90, studentSatisfaction: 4.3 }
  ];

  const mockAttendanceData = [
    { month: 'Jan', attendance: 97 },
    { month: 'Feb', attendance: 96 },
    { month: 'Mar', attendance: 95 },
    { month: 'Apr', attendance: 98 },
    { month: 'May', attendance: 97 }
  ];

  const mockSatisfactionData = [
    { name: 'Very Satisfied', value: 65 },
    { name: 'Satisfied', value: 25 },
    { name: 'Neutral', value: 7 },
    { name: 'Dissatisfied', value: 2 },
    { name: 'Very Dissatisfied', value: 1 }
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
        description: "Teacher analytics data has been exported to Excel.",
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
            <BreadcrumbLink href="/admin/principal/analytics/teachers">
              <BarChart className="h-4 w-4 mr-1" />
              Teacher Analytics
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Teacher Analytics
        </h1>
        
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="self-start md:self-auto"
        >
          {isExporting ? "Exporting..." : "Export to Excel"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {mockDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select 
            value={selectedProgram} 
            onValueChange={setSelectedProgram}
            disabled={!selectedDepartment}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {filteredPrograms.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
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

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="satisfaction">Student Satisfaction</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Performance</CardTitle>
              <CardDescription>
                Performance metrics for teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={mockPerformanceData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="performance" name="Performance Score" fill="#8884d8" />
                    <Bar dataKey="attendance" name="Attendance Rate" fill="#82ca9d" />
                    <Bar dataKey="studentSatisfaction" name="Student Satisfaction (x20)" fill="#ffc658" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Attendance</CardTitle>
              <CardDescription>
                Attendance trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mockAttendanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="attendance" name="Attendance Rate (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction">
          <Card>
            <CardHeader>
              <CardTitle>Student Satisfaction</CardTitle>
              <CardDescription>
                Student satisfaction with teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockSatisfactionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {mockSatisfactionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of teachers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Teacher comparison analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
