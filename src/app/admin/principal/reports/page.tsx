"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FileText, Home, Download, Calendar, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/form/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

/**
 * Reports Page
 *
 * This page allows principals to generate and download various reports.
 * It provides options for customizing report parameters and formats.
 */
export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedReportType, setSelectedReportType] = useState<string>("academic");
  const [selectedFormat, setSelectedFormat] = useState<string>("excel");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("term");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<any[]>([
    {
      id: "report1",
      name: "Academic Performance Report - Term 1",
      type: "academic",
      date: "2023-05-15",
      format: "excel",
      size: "2.4 MB"
    },
    {
      id: "report2",
      name: "Teacher Attendance Report - April 2023",
      type: "attendance",
      date: "2023-05-01",
      format: "pdf",
      size: "1.8 MB"
    },
    {
      id: "report3",
      name: "Student Enrollment Report - 2023",
      type: "enrollment",
      date: "2023-04-20",
      format: "excel",
      size: "3.2 MB"
    }
  ]);

  // Report type options
  const reportTypes = [
    { id: "academic", name: "Academic Performance" },
    { id: "attendance", name: "Attendance" },
    { id: "enrollment", name: "Enrollment" },
    { id: "teacher", name: "Teacher Performance" },
    { id: "financial", name: "Financial" }
  ];

  // Export format options
  const exportFormats = [
    { id: "excel", name: "Excel (.xlsx)" },
    { id: "pdf", name: "PDF (.pdf)" },
    { id: "csv", name: "CSV (.csv)" }
  ];

  // Timeframe options
  const timeframes = [
    { id: "week", name: "Weekly" },
    { id: "month", name: "Monthly" },
    { id: "term", name: "Term" },
    { id: "year", name: "Yearly" },
    { id: "custom", name: "Custom Date Range" }
  ];

  // Handle generate report button click
  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add the new report to the list
      const newReport = {
        id: `report${generatedReports.length + 1}`,
        name: `${reportTypes.find(r => r.id === selectedReportType)?.name} Report - ${new Date().toLocaleDateString()}`,
        type: selectedReportType,
        date: new Date().toISOString().split('T')[0],
        format: selectedFormat,
        size: `${(Math.random() * 5 + 1).toFixed(1)} MB`
      };

      setGeneratedReports([newReport, ...generatedReports]);

      toast({
        title: "Report generated successfully",
        description: "Your report is now available for download.",
      });
    } catch (error) {
      toast({
        title: "Report generation failed",
        description: "There was an error generating the report. Please try again.",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle download report button click
  const handleDownloadReport = (reportId: string) => {
    toast({
      title: "Download started",
      description: "Your report is being downloaded.",
    });
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
            <BreadcrumbLink href="/admin/principal/reports">
              <FileText className="h-4 w-4 mr-1" />
              Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Reports
      </h1>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Report</CardTitle>
              <CardDescription>
                Select parameters to generate a custom report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger id="export-format">
                      <SelectValue placeholder="Select Export Format" />
                    </SelectTrigger>
                    <SelectContent>
                      {exportFormats.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          {format.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger id="timeframe">
                      <SelectValue placeholder="Select Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeframes.map((timeframe) => (
                        <SelectItem key={timeframe.id} value={timeframe.id}>
                          {timeframe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTimeframe === "custom" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <DatePicker
                          selected={startDate}
                          onSelect={setStartDate}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <DatePicker
                          selected={endDate}
                          onSelect={setEndDate}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Include Sections</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="summary" defaultChecked />
                    <Label htmlFor="summary">Summary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="details" defaultChecked />
                    <Label htmlFor="details">Detailed Data</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="charts" defaultChecked />
                    <Label htmlFor="charts">Charts & Graphs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="trends" defaultChecked />
                    <Label htmlFor="trends">Trend Analysis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="recommendations" />
                    <Label htmlFor="recommendations">Recommendations</Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <span className="mr-2">Generating...</span>
                    <Progress value={45} className="h-2 w-20" />
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                Previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Generated</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reportTypes.find(r => r.id === report.type)?.name || report.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>{report.format.toUpperCase()}</TableCell>
                      <TableCell>{report.size}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Automatically generated reports on a schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No scheduled reports configured. Use the "Generate Report" tab to create and schedule reports.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
