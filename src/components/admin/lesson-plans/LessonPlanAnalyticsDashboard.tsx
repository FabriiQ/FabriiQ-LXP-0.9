'use client';

import React, { useState } from 'react';
import { api } from '@/trpc/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/core/skeleton';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { Download, Filter } from 'lucide-react';

interface LessonPlanAnalyticsDashboardProps {
  campusId?: string;
}

export default function LessonPlanAnalyticsDashboard({ campusId }: LessonPlanAnalyticsDashboardProps) {
  // State for filters
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState<Date | undefined>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // Fetch approval rate metrics
  const { data: approvalMetrics, isLoading: isLoadingApproval } = api.lessonPlan.getApprovalRateMetrics.useQuery({
    campusId,
    startDate,
    endDate
  }, {
    refetchOnWindowFocus: false
  });
  
  // Fetch metrics by teacher
  const { data: teacherMetrics, isLoading: isLoadingTeacher } = api.lessonPlan.getMetricsByTeacher.useQuery({
    campusId,
    startDate,
    endDate
  }, {
    refetchOnWindowFocus: false
  });
  
  // Fetch metrics by subject
  const { data: subjectMetrics, isLoading: isLoadingSubject } = api.lessonPlan.getMetricsBySubject.useQuery({
    campusId,
    startDate,
    endDate
  }, {
    refetchOnWindowFocus: false
  });
  
  // Fetch metrics by month
  const { data: monthlyMetrics, isLoading: isLoadingMonthly } = api.lessonPlan.getMetricsByMonth.useQuery({
    campusId,
    year
  }, {
    refetchOnWindowFocus: false
  });
  
  // Fetch metrics by plan type
  const { data: planTypeMetrics, isLoading: isLoadingPlanType } = api.lessonPlan.getMetricsByPlanType.useQuery({
    campusId,
    startDate,
    endDate
  }, {
    refetchOnWindowFocus: false
  });
  
  // Handle year change
  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
  };
  
  // Handle export to CSV
  const handleExportCSV = () => {
    // Implement CSV export logic
    const csvData = [];
    
    // Add headers
    csvData.push(['Metric', 'Value']);
    
    // Add approval metrics
    if (approvalMetrics) {
      csvData.push(['Total Lesson Plans', approvalMetrics.total]);
      csvData.push(['Draft', approvalMetrics.draft]);
      csvData.push(['Submitted', approvalMetrics.submitted]);
      csvData.push(['Coordinator Approved', approvalMetrics.coordinatorApproved]);
      csvData.push(['Approved', approvalMetrics.approved]);
      csvData.push(['Rejected', approvalMetrics.rejected]);
      csvData.push(['Approval Rate (%)', approvalMetrics.approvalRate.toFixed(2)]);
      csvData.push(['Rejection Rate (%)', approvalMetrics.rejectionRate.toFixed(2)]);
      csvData.push(['Average Time to Approval (hours)', approvalMetrics.averageTimeToApproval.toFixed(2)]);
    }
    
    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Create a blob and download it
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson-plan-analytics.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Prepare data for status distribution pie chart
  const statusDistributionData = approvalMetrics ? [
    { name: 'Draft', value: approvalMetrics.draft },
    { name: 'Submitted', value: approvalMetrics.submitted },
    { name: 'Coordinator Approved', value: approvalMetrics.coordinatorApproved },
    { name: 'Approved', value: approvalMetrics.approved },
    { name: 'Rejected', value: approvalMetrics.rejected }
  ] : [];
  
  // Prepare data for plan type distribution pie chart
  const planTypeDistributionData = planTypeMetrics ? [
    { name: 'Weekly', value: planTypeMetrics.weekly },
    { name: 'Monthly', value: planTypeMetrics.monthly }
  ] : [];
  
  // Prepare data for monthly trend chart
  const monthlyTrendData = monthlyMetrics || [];
  
  // Prepare data for teacher performance chart
  const teacherPerformanceData = teacherMetrics ? 
    teacherMetrics.sort((a, b) => b.total - a.total).slice(0, 10) : 
    [];
  
  // Prepare data for subject distribution chart
  const subjectDistributionData = subjectMetrics ? 
    subjectMetrics.sort((a, b) => b.total - a.total).slice(0, 10) : 
    [];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Lesson Plan Analytics</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Start Date"
          />
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="End Date"
          />
          <Select value={year.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingApproval ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {approvalMetrics?.approvalRate.toFixed(2)}%
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Lesson Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingApproval ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {approvalMetrics?.total || 0}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg. Approval Time</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingApproval ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="text-3xl font-bold">
                    {approvalMetrics?.averageTimeToApproval.toFixed(1) || 0} hrs
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Status Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lesson Plan Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingApproval ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Plan Type Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPlanType ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={planTypeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planTypeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="teachers" className="space-y-6">
          {/* Teacher Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Teachers by Lesson Plan Count</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTeacher ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={teacherPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total Lesson Plans" fill="#8884d8" />
                    <Bar dataKey="approved" name="Approved" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Teacher Approval Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Teacher Approval Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTeacher ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={teacherPerformanceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Approval Rate']} />
                    <Legend />
                    <Bar dataKey="approvalRate" name="Approval Rate (%)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subjects" className="space-y-6">
          {/* Subject Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Subjects by Lesson Plan Count</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSubject ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={subjectDistributionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total Lesson Plans" fill="#8884d8" />
                    <Bar dataKey="approved" name="Approved" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Subject Approval Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Approval Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSubject ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={subjectDistributionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Approval Rate']} />
                    <Legend />
                    <Bar dataKey="approvalRate" name="Approval Rate (%)" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Lesson Plan Trends ({year})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMonthly ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={monthlyTrendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Total" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="approved" name="Approved" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ff7300" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          {/* Monthly Approval Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Approval Rates ({year})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMonthly ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={monthlyTrendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Approval Rate']} />
                    <Legend />
                    <Line type="monotone" dataKey="approvalRate" name="Approval Rate (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
