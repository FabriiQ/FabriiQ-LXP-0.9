import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { ArrowLeftIcon, PlusIcon, BuildingIcon, UsersIcon, HomeIcon } from "lucide-react";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { FacilityType } from "@prisma/client";

interface CampusFacilitiesPageProps {
  params: {
    id: string;
  };
}

export default async function CampusFacilitiesPage({ params }: CampusFacilitiesPageProps) {
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      userType: true,
    },
  });

  if (!user || user.userType !== 'SYSTEM_ADMIN') {
    redirect("/login");
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id: params.id },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  if (!campus) {
    notFound();
  }

  // Get facilities for this campus
  const facilities = await prisma.facility.findMany({
    where: {
      campusId: params.id,
      status: 'ACTIVE',
    },
    include: {
      _count: {
        select: {
          classes: true,
          schedules: true,
          timetablePeriods: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Group facilities by type
  const facilitiesByType: Record<string, typeof facilities> = {};
  
  facilities.forEach(facility => {
    if (!facilitiesByType[facility.type]) {
      facilitiesByType[facility.type] = [];
    }
    facilitiesByType[facility.type].push(facility);
  });

  // Get facility type labels
  const facilityTypeLabels: Record<FacilityType, string> = {
    CLASSROOM: "Classrooms",
    WORKSHOP: "Workshops",
    LABORATORY: "Laboratories",
    AUDITORIUM: "Auditoriums",
    LIBRARY: "Libraries",
    OTHER: "Other Facilities",
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${params.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Facilities - ${campus.name}`}
          description={`Manage facilities for ${campus.code} campus`}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Campus Facilities</h2>
        <Link href={`/admin/system/campuses/${params.id}/facilities/new`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Facility
          </Button>
        </Link>
      </div>
      
      {facilities.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(facilitiesByType).map(([type, typeFacilities]) => (
            <div key={type} className="space-y-4">
              <h3 className="text-lg font-medium">{facilityTypeLabels[type as FacilityType] || type}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeFacilities.map((facility) => (
                  <Card key={facility.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{facility.name}</CardTitle>
                        <Badge variant="secondary">{facility.code}</Badge>
                      </div>
                      <CardDescription>Capacity: {facility.capacity}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <HomeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Classes: {facility._count.classes}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Schedules: {facility._count.schedules}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between">
                      <Link href={`/admin/system/campuses/${params.id}/facilities/${facility.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      <Link href={`/admin/system/campuses/${params.id}/facilities/${facility.id}/edit`}>
                        <Button variant="secondary" size="sm">Edit</Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <BuildingIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No facilities added</h3>
          <p className="text-sm text-gray-500 mt-1">Add facilities to this campus to get started.</p>
          <Link href={`/admin/system/campuses/${params.id}/facilities/new`} className="mt-4">
            <Button>Add Facility</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 