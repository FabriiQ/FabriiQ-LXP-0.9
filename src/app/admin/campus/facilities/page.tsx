import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Calendar, Users, MoreHorizontal, Building, Home } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Facility Management | Campus Admin",
  description: "Manage facilities at your campus",
};

interface FacilityWithDetails {
  id: string;
  name: string;
  code: string;
  type: string;
  capacity: number;
  status: string;
  building: string | null;
  floor: number | null;
  is_available: boolean;
}

export default async function CampusFacilitiesPage() {
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

  // Get facilities for this campus using Prisma queries
  const facilities = await prisma.facility.findMany({
    where: {
      campusId: user.primaryCampusId,
    },
    orderBy: [
      { name: 'asc' },
    ],
    take: 20,
  });

  // Transform the data to match the expected FacilityWithDetails interface
  const facilitiesWithDetails: FacilityWithDetails[] = facilities.map(facility => {
    // Extract building and floor from resources if available
    const resources = facility.resources as Record<string, any> | null;
    const building = resources?.building as string | null;
    const floor = resources?.floor as number | null;
    
    return {
      id: facility.id,
      name: facility.name,
      code: facility.code,
      type: facility.type.toString(),
      capacity: facility.capacity,
      status: facility.status,
      building: building,
      floor: floor,
      is_available: true, // Assuming all facilities are available by default
    };
  });

  // Group facilities by building
  const facilitiesByBuilding: Record<string, FacilityWithDetails[]> = {};
  
  facilitiesWithDetails.forEach(facility => {
    const buildingName = facility.building || 'Other';
    if (!facilitiesByBuilding[buildingName]) {
      facilitiesByBuilding[buildingName] = [];
    }
    facilitiesByBuilding[buildingName].push(facility);
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facility Management</h1>
          <p className="text-muted-foreground">Manage facilities at {campus.name}</p>
        </div>
        <Button asChild>
          <Link href="/admin/campus/facilities/new">
            <Plus className="mr-2 h-4 w-4" /> Add Facility
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search facilities..."
            className="w-full pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" /> Schedule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="classroom">Classrooms</TabsTrigger>
          <TabsTrigger value="lab">Labs</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          {Object.keys(facilitiesByBuilding).length > 0 ? (
            Object.entries(facilitiesByBuilding).map(([building, facilities]) => (
              <Card key={building} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                    <CardTitle>{building}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-left p-4 font-medium">Code</th>
                          <th className="text-left p-4 font-medium">Type</th>
                          <th className="text-left p-4 font-medium">
                            <div className="flex items-center">
                              <Users className="mr-2 h-4 w-4" />
                              <span>Capacity</span>
                            </div>
                          </th>
                          <th className="text-left p-4 font-medium">Floor</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-right p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {facilities.map((facility) => (
                          <tr key={facility.id} className="hover:bg-muted/50">
                            <td className="p-4 font-medium">{facility.name}</td>
                            <td className="p-4">{facility.code}</td>
                            <td className="p-4">{facility.type}</td>
                            <td className="p-4">{facility.capacity}</td>
                            <td className="p-4">{facility.floor || 'N/A'}</td>
                            <td className="p-4">
                              {facility.is_available ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 hover:text-red-700">
                                  In Use
                                </Badge>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/admin/campus/facilities/${facility.id}`}>
                                    View
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/admin/campus/facilities/${facility.id}/schedule`}>
                                    Schedule
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/admin/campus/facilities/${facility.id}/actions`}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No facilities found</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/admin/campus/facilities/new">Add Facility</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="classroom" className="space-y-4">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Filter by classroom type</p>
          </div>
        </TabsContent>
        
        <TabsContent value="lab" className="space-y-4">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Filter by lab type</p>
          </div>
        </TabsContent>
        
        <TabsContent value="other" className="space-y-4">
          <div className="text-center py-10">
            <p className="text-muted-foreground">Filter by other facility types</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 