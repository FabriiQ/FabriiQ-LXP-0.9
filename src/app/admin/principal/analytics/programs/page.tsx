"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BarChart, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgramAnalyticsDashboard } from "@/components/coordinator/ProgramAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

/**
 * Program Analytics Page
 *
 * This page displays analytics for programs across the campus.
 * It reuses components from the coordinator portal.
 */
export default function ProgramAnalyticsPage() {
  const { toast } = useToast();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("year");
  const [isExporting, setIsExporting] = useState(false);

  // Mock data for initial development
  // In production, this would be fetched from the API
  const mockPrograms = [
    { id: "program1", name: "Computer Science" },
    { id: "program2", name: "Business Administration" },
    { id: "program3", name: "Engineering" }
  ];

  const mockCampuses = [
    { id: "campus1", name: "Main Campus", code: "MC" },
    { id: "campus2", name: "North Campus", code: "NC" },
    { id: "campus3", name: "South Campus", code: "SC" }
  ];

  // Handle export button click
  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Export successful",
        description: "Program analytics data has been exported to Excel.",
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
            <BreadcrumbLink href="/admin/principal/analytics/programs">
              <BarChart className="h-4 w-4 mr-1" />
              Program Analytics
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Program Analytics
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
          <Select value={selectedCampus} onValueChange={setSelectedCampus}>
            <SelectTrigger>
              <SelectValue placeholder="Select Campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Campuses</SelectItem>
              {mockCampuses.map((campus) => (
                <SelectItem key={campus.id} value={campus.id}>
                  {campus.name}
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
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="enrollment">
        <TabsList>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment">
          <Card>
            <CardHeader>
              <CardTitle>Program Enrollment</CardTitle>
              <CardDescription>
                Enrollment trends and statistics for programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProgramAnalyticsDashboard
                programId={selectedProgram || "all"}
                programName={selectedProgram ? mockPrograms.find(p => p.id === selectedProgram)?.name || "" : "All Programs"}
                selectedCampus={selectedCampus || undefined}
                campusName={selectedCampus ? mockCampuses.find(c => c.id === selectedCampus)?.name : undefined}
                campuses={mockCampuses}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Program Performance</CardTitle>
              <CardDescription>
                Performance metrics for selected programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would use a specialized program performance component */}
              <p className="text-muted-foreground">
                Program performance analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demographics">
          <Card>
            <CardHeader>
              <CardTitle>Demographics Analysis</CardTitle>
              <CardDescription>
                Demographic breakdown of program enrollment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would use a specialized demographics component */}
              <p className="text-muted-foreground">
                Program demographics analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Program Comparison</CardTitle>
              <CardDescription>
                Side-by-side comparison of programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would use a specialized program comparison component */}
              <p className="text-muted-foreground">
                Program comparison analytics will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
