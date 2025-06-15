import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, BarChart, PieChart, LineChart, FileText } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reports | Campus Admin",
  description: "View and generate reports for your campus",
};

export default async function CampusReportsPage() {
  const session = await getSessionCache();

  // Only redirect if there's definitely no session
  if (!session) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
    select: {
      id: true,
      name: true,
      userType: true,
      primaryCampusId: true,
    },
  });

  if (!user || user.userType !== 'CAMPUS_ADMIN' || !user.primaryCampusId) {
    redirect("/login");
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id: user.primaryCampusId },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    },
  });

  if (!campus) {
    redirect("/login");
  }

  // Define report types
  const reportTypes = [
    {
      id: "attendance",
      name: "Attendance Reports",
      description: "Track student attendance patterns and identify trends",
      icon: <BarChart className="h-8 w-8 text-primary" />,
      reports: [
        { id: "daily", name: "Daily Attendance", format: "PDF/Excel" },
        { id: "weekly", name: "Weekly Summary", format: "PDF/Excel" },
        { id: "monthly", name: "Monthly Analysis", format: "PDF/Excel" },
      ]
    },
    {
      id: "academic",
      name: "Academic Performance",
      description: "Analyze student grades and academic progress",
      icon: <LineChart className="h-8 w-8 text-primary" />,
      reports: [
        { id: "class-grades", name: "Class Grades", format: "PDF/Excel" },
        { id: "student-progress", name: "Student Progress", format: "PDF/Excel" },
        { id: "program-performance", name: "Program Performance", format: "PDF/Excel" },
      ]
    },
    {
      id: "enrollment",
      name: "Enrollment Reports",
      description: "Review enrollment statistics and trends",
      icon: <PieChart className="h-8 w-8 text-primary" />,
      reports: [
        { id: "current", name: "Current Enrollment", format: "PDF/Excel" },
        { id: "historical", name: "Historical Trends", format: "PDF/Excel" },
        { id: "demographic", name: "Demographic Analysis", format: "PDF/Excel" },
      ]
    },
    {
      id: "administrative",
      name: "Administrative Reports",
      description: "Access operational and administrative data",
      icon: <FileText className="h-8 w-8 text-primary" />,
      reports: [
        { id: "teacher-load", name: "Teacher Workload", format: "PDF/Excel" },
        { id: "facility-usage", name: "Facility Usage", format: "PDF/Excel" },
        { id: "resource-allocation", name: "Resource Allocation", format: "PDF/Excel" },
      ]
    }
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">View and generate reports for {campus.name}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/campus/reports/scheduled">
            <Download className="mr-2 h-4 w-4" /> Scheduled Reports
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search reports..."
            className="w-full pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="administrative">Administrative</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6 mt-6">
          {reportTypes.map((type) => (
            <Card key={type.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-3 rounded-md">
                    {type.icon}
                  </div>
                  <div>
                    <CardTitle>{type.name}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {type.reports.map((report) => (
                    <Card key={report.id} className="overflow-hidden">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">{report.name}</CardTitle>
                        <CardDescription className="text-xs">Format: {report.format}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/campus/reports/generate/${type.id}/${report.id}`}>
                              Generate
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/campus/reports/view/${type.id}/${report.id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {reportTypes.map((type) => (
          <TabsContent key={type.id} value={type.id} className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {type.reports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle>{report.name}</CardTitle>
                    <CardDescription>Format: {report.format}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate detailed {report.name.toLowerCase()} reports for your campus.
                    </p>
                    <div className="flex justify-between">
                      <Button variant="outline" asChild>
                        <Link href={`/admin/campus/reports/generate/${type.id}/${report.id}`}>
                          Generate
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild>
                        <Link href={`/admin/campus/reports/view/${type.id}/${report.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 