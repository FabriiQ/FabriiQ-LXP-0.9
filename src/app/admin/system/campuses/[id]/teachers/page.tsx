import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { ArrowLeftIcon, PlusIcon, UserIcon, BookOpenIcon, MailIcon, PhoneIcon } from "lucide-react";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { UserType } from "@prisma/client";
import { TeacherSearchForm } from "./TeacherSearchForm";

interface CampusTeachersPageProps {
  params: {
    id: string;
  };
  searchParams: {
    search?: string;
  };
}

export default async function CampusTeachersPage({ params, searchParams }: CampusTeachersPageProps) {
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

  // Build where clause for teachers query
  const whereClause: any = {
    campusId: params.id,
    roleType: UserType.CAMPUS_TEACHER,
    status: 'ACTIVE',
  };

  // Add search filter if provided
  if (searchParams.search) {
    whereClause.user = {
      OR: [
        {
          name: {
            contains: searchParams.search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchParams.search,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  // Get teachers for this campus
  const teacherAccess = await prisma.userCampusAccess.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          userType: true,
          createdAt: true,
          updatedAt: true,
          teacherProfile: {
            include: {
              _count: {
                select: {
                  assignments: true,
                  subjectQualifications: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Map the data for display
  const teachers = teacherAccess.map(access => ({
    id: access.id,
    userId: access.userId,
    campusId: access.campusId,
    startDate: access.startDate,
    endDate: access.endDate,
    status: access.status,
    roleType: access.roleType,
    createdAt: access.createdAt,
    updatedAt: access.updatedAt,
    deletedAt: access.deletedAt,
    user: access.user
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${params.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Teachers - ${campus.name}`}
          description={`Manage teachers for ${campus.code} campus`}
        />
      </div>
      
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-muted/50 p-4 rounded-lg">
        <TeacherSearchForm 
          campusId={params.id} 
          currentSearch={searchParams.search || ''} 
        />
      </div>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Campus Teachers</h2>
        <Link href={`/admin/system/campuses/${params.id}/teachers/assign`}>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Assign Teacher
          </Button>
        </Link>
      </div>
      
      {teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((access) => (
            <Card key={access.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{access.user.name}</CardTitle>
                  <Badge variant="secondary">Teacher</Badge>
                </div>
                <CardDescription className="flex items-center">
                  <MailIcon className="h-3 w-3 mr-1" />
                  {access.user.email}
                </CardDescription>
                {access.user.phoneNumber && (
                  <CardDescription className="flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1" />
                    {access.user.phoneNumber}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  {access.user.teacherProfile && (
                    <>
                      <div className="flex items-center text-sm">
                        <BookOpenIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Assignments: {access.user.teacherProfile._count.assignments}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center text-sm">
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Since: {new Date(access.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Link href={`/admin/system/users/${access.user.id}`}>
                  <Button variant="outline" size="sm">View Profile</Button>
                </Link>
                <Link href={`/admin/system/campuses/${params.id}/teachers/${access.id}/remove`}>
                  <Button variant="destructive" size="sm">Remove</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <UserIcon className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No teachers found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {searchParams.search
              ? "Try adjusting your search to see more results."
              : "Assign teachers to this campus to see them here."}
          </p>
          <div className="mt-4 flex gap-2">
            {searchParams.search && (
              <Link href={`/admin/system/campuses/${params.id}/teachers`}>
                <Button variant="outline">Clear Search</Button>
              </Link>
            )}
            <Link href={`/admin/system/campuses/${params.id}/teachers/assign`}>
              <Button>Assign Teacher</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 