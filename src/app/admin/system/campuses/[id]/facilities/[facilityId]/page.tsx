import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { ArrowLeftIcon, PencilIcon, HomeIcon, UsersIcon, CalendarIcon } from "lucide-react";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { formatDate } from "@/utils/format";

interface FacilityDetailPageProps {
  params: {
    id: string;
    facilityId: string;
  };
}

export default async function FacilityDetailPage({ params }: FacilityDetailPageProps) {
  // Ensure params is fully resolved
  const resolvedParams = await Promise.resolve(params);
  const { id, facilityId } = resolvedParams;
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
    },
  });

  if (!user || user.userType !== 'SYSTEM_ADMIN') {
    redirect("/login");
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id },
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

  // Get facility details
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      _count: {
        select: {
          classes: true,
          schedules: true,
          timetablePeriods: true,
        },
      },
    },
  });

  if (!facility || facility.campusId !== id) {
    notFound();
  }

  // Get classes using this facility
  const classes = await prisma.class.findMany({
    where: {
      facilityId,
      status: 'ACTIVE',
    },
    include: {
      courseCampus: {
        include: {
          course: true,
        },
      },
      term: true,
      classTeacher: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      programCampus: {
        include: {
          program: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: [
      {
        term: {
          startDate: 'desc',
        },
      },
      {
        name: 'asc',
      },
    ],
    take: 10, // Limit to recent classes
  });

  // Get facility type label
  const facilityTypeLabels: Record<string, string> = {
    CLASSROOM: "Classroom",
    LABORATORY: "Laboratory",
    AUDITORIUM: "Auditorium",
    LIBRARY: "Library",
    CAFETERIA: "Cafeteria",
    OFFICE: "Office",
    SPORTS: "Sports Facility",
    OTHER: "Other",
  };

  // Parse resources JSON
  const resources = facility.resources ? (typeof facility.resources === 'object' ? facility.resources : {}) : {};

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${params.id}/facilities`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Facility - ${facility.name}`}
          description={`View details for ${facility.code} facility at ${campus.name} campus`}
        />
      </div>

      {/* Facility Info Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{facility.name}</CardTitle>
              <CardDescription>{facility.code}</CardDescription>
            </div>
            <Badge variant="secondary">{facilityTypeLabels[facility.type] || facility.type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Capacity</div>
                <div className="text-2xl font-bold">{facility.capacity}</div>
              </div>
            </div>
            <div className="flex items-center">
              <HomeIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Classes</div>
                <div className="text-2xl font-bold">{facility._count.classes}</div>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Created</div>
                <div className="text-lg font-medium">{formatDate(facility.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="mt-6 space-y-4">
            {/* Resources */}
            {Object.keys(resources).length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Resources</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(resources).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Badge variant="outline">{key}</Badge>
                      <span className="text-sm">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Link href={`/admin/system/campuses/${params.id}/facilities/${params.facilityId}/edit`}>
            <Button>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Facility
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Classes Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Classes Using This Facility</h2>
        <Link href={`/admin/system/campuses/${params.id}/classes?facilityId=${params.facilityId}`}>
          <Button variant="outline">
            View All Classes
          </Button>
        </Link>
      </div>

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{cls.name}</CardTitle>
                  <Badge variant="outline">{cls.code}</Badge>
                </div>
                <CardDescription>
                  {cls.courseCampus.course.name} ({cls.courseCampus.course.code})
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{cls.term.name}</span>
                  </div>
                  {cls.classTeacher && (
                    <div className="flex items-center text-sm">
                      <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Teacher: {cls.classTeacher.user.name}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Students: {cls._count.students}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Link href={`/admin/system/classes/${cls.id}`} className="w-full">
                  <Button variant="outline" className="w-full">View Class</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <HomeIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No classes found</h3>
          <p className="text-sm text-gray-500 mt-1">
            This facility is not currently being used by any classes.
          </p>
        </div>
      )}
    </div>
  );
}
