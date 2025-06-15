'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BarChart, Download, FileText, PieChart, Search, Users } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/trpc/react';

interface Report {
  id: string;
  title: string;
  type: 'ATTENDANCE' | 'PERFORMANCE' | 'SUMMARY';
  createdAt: string;
  generatedBy: string;
}

export default function ClassReportsPage() {
  const params = useParams();
  const classId = params?.id as string;
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentTab, setCurrentTab] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState<string>('PERFORMANCE');
  const [reportPeriod, setReportPeriod] = useState<string>('TERM');
  
  // Use TRPC to fetch class data
  const { data: classData, isLoading: isClassLoading } = api.class.getById.useQuery({
    classId,
  });
  
  // Use TRPC to fetch reports
  const { data: reportsData, isLoading: isReportsLoading, refetch: refetchReports } = api.class.getReports.useQuery({
    classId,
  }, {
    onSuccess: (data) => {
      setReports(data.reports || []);
    },
    onError: (error) => {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports data',
        variant: 'error',
      });
    }
  });
  
  // Use TRPC mutation for generating a report
  const generateReportMutation = api.class.generateReport.useMutation({
    onSuccess: (data) => {
      // Add the new report to the list
      setReports(prev => [data.report, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Report generated successfully',
        variant: 'success',
      });
      
      // Refetch reports to ensure we have the latest data
      void refetchReports();
    },
    onError: (error) => {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'error',
      });
    },
    onSettled: () => {
      setIsGeneratingReport(false);
    }
  });
  
  // Update loading state when data is fetched
  useEffect(() => {
    if (!isClassLoading && !isReportsLoading) {
      setIsLoading(false);
    }
  }, [isClassLoading, isReportsLoading]);
  
  // Generate a new report
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      generateReportMutation.mutate({
        classId,
        type: reportType as any, // Using 'any' temporarily to handle the type casting
        period: reportPeriod as any, // Using 'any' temporarily to handle the type casting
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'error',
      });
      setIsGeneratingReport(false);
    }
  };
  
  // Handle report download using TRPC
  const handleDownloadReport = async (reportId: string) => {
    try {
      toast({
        title: 'Downloading',
        description: 'Your report is being prepared for download',
        variant: 'info',
      });
      
      // Use TRPC to get the download URL
      const downloadData = await api.class.downloadReport.fetchQuery({
        classId,
        reportId,
      });
      
      // Open the download URL in a new tab
      if (downloadData?.url) {
        window.open(downloadData.url, '_blank');
      } else {
        throw new Error('Download URL not provided');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'error',
      });
    }
  };
  
  // Filter reports based on current tab
  const filteredReports = reports.filter(report => {
    if (currentTab === 'all') return true;
    return report.type.toLowerCase() === currentTab;
  });
  
  // Get icon for report type
  const getReportIcon = (type: string) => {
    switch (type) {
      case 'ATTENDANCE':
        return <Users className="h-5 w-5" />;
      case 'PERFORMANCE':
        return <BarChart className="h-5 w-5" />;
      case 'SUMMARY':
        return <PieChart className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  // Get color for report badge
  const getReportBadgeVariant = (type: string) => {
    switch (type) {
      case 'ATTENDANCE':
        return 'default';
      case 'PERFORMANCE':
        return 'outline';
      case 'SUMMARY':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  if (isLoading) {
    return (
      <PageLayout
        title="Loading..."
        description="Loading class details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout
      title={`Reports: ${classData?.name || ''}`}
      description="View and generate reports for this class"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: classData?.name || 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Reports', href: '#' },
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href={`/admin/campus/classes/${classId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Generate Report</CardTitle>
              <CardDescription>Create a new report for this class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select
                    value={reportType}
                    onValueChange={setReportType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERFORMANCE">Performance Report</SelectItem>
                      <SelectItem value="ATTENDANCE">Attendance Report</SelectItem>
                      <SelectItem value="SUMMARY">Class Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <Select
                    value={reportPeriod}
                    onValueChange={setReportPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TERM">Entire Term</SelectItem>
                      <SelectItem value="MONTH">Last Month</SelectItem>
                      <SelectItem value="WEEK">Last Week</SelectItem>
                      <SelectItem value="CUSTOM">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {filteredReports.length > 0 ? (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        {getReportIcon(report.type)}
                        <div className="ml-4">
                          <p className="font-medium">{report.title}</p>
                          <div className="flex items-center mt-1 text-sm text-muted-foreground">
                            <Badge variant={getReportBadgeVariant(report.type) as any} className="mr-2">
                              {report.type}
                            </Badge>
                            <span>{format(new Date(report.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reports found</h3>
                  <p className="text-muted-foreground mb-6">
                    Generate your first report using the form on the left
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
} 