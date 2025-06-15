import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/forms/select";
import { ArrowLeft, Download, FileDown } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/forms/checkbox";

export const metadata: Metadata = {
  title: "Export Attendance | Campus Admin",
  description: "Export attendance data for your campus",
};

export default async function ExportAttendancePage() {
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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

  // Get programs for this campus
  const programs = await prisma.program.findMany({
    where: {
      campusOfferings: {
        some: {
          campusId: user.primaryCampusId,
          status: 'ACTIVE'
        }
      }
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Get active classes for this campus
  const classes = await prisma.class.findMany({
    where: {
      programCampus: {
        campusId: user.primaryCampusId,
      },
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/campus/attendance">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Export Attendance</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Attendance Data</CardTitle>
          <CardDescription>Configure your export options</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input 
                    id="startDate" 
                    type="date" 
                    defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input 
                    id="endDate" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Filter Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program">Program (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Programs</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class (Optional)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name} ({classItem.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Attendance Status</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="status-present" defaultChecked />
                    <label htmlFor="status-present">Present</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="status-absent" defaultChecked />
                    <label htmlFor="status-absent">Absent</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="status-late" defaultChecked />
                    <label htmlFor="status-late">Late</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="status-excused" defaultChecked />
                    <label htmlFor="status-excused">Excused</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Export Format</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input type="radio" id="format-csv" name="format" value="csv" defaultChecked className="rounded-full" />
                  <label htmlFor="format-csv">CSV</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="format-excel" name="format" value="excel" className="rounded-full" />
                  <label htmlFor="format-excel">Excel</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="radio" id="format-pdf" name="format" value="pdf" className="rounded-full" />
                  <label htmlFor="format-pdf">PDF</label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="include-remarks" defaultChecked />
                <label htmlFor="include-remarks">Include remarks</label>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/admin/campus/attendance">Cancel</Link>
          </Button>
          <Button type="submit">
            <FileDown className="mr-2 h-4 w-4" /> Export Data
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 