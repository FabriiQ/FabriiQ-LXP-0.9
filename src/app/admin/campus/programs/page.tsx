import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, BookOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Program Management | Campus Admin",
  description: "Manage programs at your campus",
};

export default async function CampusProgramsPage() {
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

  // Get programs for this campus
  const programCampuses = await prisma.programCampus.findMany({
    where: {
      campusId: user.primaryCampusId,
    },
    include: {
      program: true,
      classes: {
        where: {
          status: 'ACTIVE',
        }
      }
    },
    orderBy: {
      program: {
        name: 'asc',
      }
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Program Management</h1>
          <p className="text-muted-foreground">Manage programs at {campus.name}</p>
        </div>
        <Button asChild>
          <Link href="/admin/campus/programs/new">
            <Plus className="mr-2 h-4 w-4" /> Add Program
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search programs..."
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
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">All Programs</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programCampuses.map((pc) => (
              <Card key={pc.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{pc.program.name}</CardTitle>
                        <CardDescription>{pc.program.type}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-muted-foreground">Code:</span>
                      <span className="font-medium">{pc.program.code}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{pc.program.duration} months</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium">{pc.program.level}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Active Classes:</span>
                      <span className="font-medium">{pc.classes.length}</span>
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 pt-0 flex justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/campus/programs/${pc.program.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/campus/programs/${pc.program.id}/classes`}>
                      Manage Classes
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}

            {programCampuses.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">No programs found</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/admin/campus/programs/new">Add Program</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programCampuses
              .filter(pc => pc.status === 'ACTIVE')
              .map((pc) => (
                <Card key={pc.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{pc.program.name}</CardTitle>
                          <CardDescription>{pc.program.type}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-muted-foreground">Code:</span>
                        <span className="font-medium">{pc.program.code}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{pc.program.duration} months</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Level:</span>
                        <span className="font-medium">{pc.program.level}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Classes:</span>
                        <span className="font-medium">{pc.classes.length}</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex justify-between">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/programs/${pc.program.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/programs/${pc.program.id}/classes`}>
                        Manage Classes
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}

            {programCampuses.filter(pc => pc.status === 'ACTIVE').length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">No active programs found</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/admin/campus/programs/new">Add Program</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programCampuses
              .filter(pc => pc.status === 'INACTIVE')
              .map((pc) => (
                <Card key={pc.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{pc.program.name}</CardTitle>
                          <CardDescription>{pc.program.type}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700">
                        Inactive
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-muted-foreground">Code:</span>
                        <span className="font-medium">{pc.program.code}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{pc.program.duration} months</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Level:</span>
                        <span className="font-medium">{pc.program.level}</span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex justify-between">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/programs/${pc.program.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/campus/programs/${pc.program.id}/classes`}>
                        Manage Classes
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}

            {programCampuses.filter(pc => pc.status === 'INACTIVE').length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">No inactive programs found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}