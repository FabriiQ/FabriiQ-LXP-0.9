import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import Link from "next/link";
import { ClassGrid } from "@/components/admin/campus/ClassGrid";

export const metadata: Metadata = {
  title: "Class Management | Campus Admin",
  description: "Manage classes at your campus",
};

export default async function CampusClassesPage() {
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

  // Get classes for this campus
  const classes = await prisma.class.findMany({
    where: {
      programCampus: {
        campusId: user.primaryCampusId,
      }
    },
    include: {
      classTeacher: {
        include: {
          user: {
            select: {
              name: true,
            }
          }
        }
      },
      facility: true,
      term: true,
      courseCampus: {
        include: {
          course: true,
        }
      }
    },
    orderBy: {
      name: 'asc',
    },
    take: 20,
  });

  // Get teacher assignments for each class
  const teacherAssignments = await prisma.teacherAssignment.findMany({
    where: {
      classId: {
        in: classes.map(c => c.id)
      },
      status: 'ACTIVE',
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              name: true,
            }
          }
        }
      }
    }
  });

  // Group assignments by class ID
  const assignmentsByClass = teacherAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.classId]) {
      acc[assignment.classId] = [];
    }
    acc[assignment.classId].push(assignment);
    return acc;
  }, {} as Record<string, typeof teacherAssignments>);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">Manage classes at {campus.name}</p>
        </div>
        <Button asChild>
          <Link href="/admin/campus/classes/new">
            <Plus className="mr-2 h-4 w-4" /> Add Class
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search classes..."
            className="w-full pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="active">Active Classes</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <ClassGrid classes={classes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center py-6">
                <p className="text-muted-foreground">No upcoming classes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center py-6">
                <p className="text-muted-foreground">No completed classes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}