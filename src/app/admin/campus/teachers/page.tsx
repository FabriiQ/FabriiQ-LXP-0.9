import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/navigation/tabs";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Download, Upload, MoreHorizontal, Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Teacher Management | Campus Admin",
  description: "Manage teachers at your campus",
};

interface TeacherWithDetails {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  join_date: Date | null;
  class_count: number;
  specialization: string | null;
  subject_count: number;
  assignments: any[];
  subjectQualifications: any[];
}

export default async function CampusTeachersPage() {
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

  // Get teachers for this campus using Prisma queries instead of raw SQL
  const teacherProfiles = await prisma.teacherProfile.findMany({
    where: {
      user: {
        activeCampuses: {
          some: {
            campusId: user.primaryCampusId,
            status: 'ACTIVE',
          }
        }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        }
      },
      classesAsTeacher: {
        where: {
          status: 'ACTIVE',
        }
      },
      assignments: {
        where: {
          status: 'ACTIVE',
        },
        include: {
          class: true,
        }
      },
      subjectQualifications: {
        include: {
          subject: true,
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc',
      }
    },
    take: 20,
  });

  // Transform the data to match the expected TeacherWithDetails interface
  const teachersWithDetails: TeacherWithDetails[] = teacherProfiles.map(profile => ({
    id: profile.id,
    user_id: profile.userId,
    name: profile.user.name || '',
    email: profile.user.email || '',
    phone: profile.user.phoneNumber || null,
    status: 'ACTIVE', // Assuming active status since we filtered for active campus access
    join_date: profile.lastTraining,
    class_count: profile.classesAsTeacher.length + profile.assignments.length,
    specialization: profile.specialization,
    subject_count: profile.subjectQualifications.length,
    assignments: profile.assignments,
    subjectQualifications: profile.subjectQualifications,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="text-muted-foreground">Manage teachers at {campus.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/campus/teachers/import">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/campus/teachers/new?campusId=${user.primaryCampusId}`}>
              <Plus className="mr-2 h-4 w-4" /> Add Teacher
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search teachers..."
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
          <TabsTrigger value="active">Active Teachers</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachersWithDetails.map((teacher) => (
              <Card key={teacher.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${teacher.name}`} alt={teacher.name} />
                        <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{teacher.name}</CardTitle>
                        <CardDescription>{teacher.specialization || "General Teacher"}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{teacher.email}</span>
                    </div>
                    {teacher.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="flex flex-col text-sm">
                        <span className="text-muted-foreground">Classes</span>
                        <span className="font-medium">{teacher.class_count}</span>
                      </div>
                      <div className="flex flex-col text-sm">
                        <span className="text-muted-foreground">Subjects</span>
                        <span className="font-medium">{teacher.subject_count}</span>
                      </div>
                    </div>

                    {teacher.subjectQualifications.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Subject Qualifications</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjectQualifications.slice(0, 3).map((qual) => (
                            <Badge key={qual.id} variant="secondary" className="text-xs">
                              {qual.subject.name}
                            </Badge>
                          ))}
                          {teacher.subjectQualifications.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{teacher.subjectQualifications.length - 3} more</Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="p-4 pt-0 flex justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/campus/teachers/${teacher.id}`}>
                      View Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/campus/teachers/${teacher.id}`}>
                      Manage
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}

            {teachersWithDetails.length === 0 && (
              <div className="col-span-3 text-center py-10">
                <p className="text-muted-foreground">No active teachers found</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/admin/campus/teachers/new?campusId=${user.primaryCampusId}`}>
                    Add Teacher
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="text-center py-10">
            <p className="text-muted-foreground">No pending teachers</p>
          </div>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <div className="text-center py-10">
            <p className="text-muted-foreground">No inactive teachers</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}