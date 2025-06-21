'use client';

import React from "react";
import Link from "next/link";
import { Campus, Institution, SystemStatus, UserCampusAccess, UserType } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/button";
import { DeleteButton, LoadingButton } from "@/components/ui/loading-button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { BarChart } from "@/components/ui/charts/BarChart";
import {
  BuildingIcon,
  MapPinIcon,
  GlobeIcon,
  PhoneIcon,
  MailIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  BookOpenIcon,
  HomeIcon,
  SettingsIcon,
  RefreshCwIcon,
  Trophy,
  Clock,
  Activity
} from "lucide-react";
import { formatDate } from "@/utils/format";
import { format } from "date-fns";
import { useToast } from "@/components/ui/feedback/toast";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

// Type definitions for campus features - used in the campus model
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CampusFeatures {
  enableAttendance: boolean;
  enableGrading: boolean;
  enableAssignments: boolean;
  enableCourseRegistration: boolean;
  enableStudentPortal: boolean;
  enableTeacherPortal: boolean;
}

interface CampusDetailProps {
  campus: Campus & {
    institution: Institution;
    userAccess?: (UserCampusAccess & {
      user: {
        id: string;
        name: string | null;
        email: string | null;
      };
    })[];
    _count?: {
      userAccess: number;
      facilities: number;
      programs: number;
    };
    features?: {
      enableAttendance: boolean;
      enableGrading: boolean;
      enableAssignments: boolean;
      enableCourseRegistration: boolean;
      enableStudentPortal: boolean;
      enableTeacherPortal: boolean;
    };
  };
}

export function CampusDetail({ campus }: CampusDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Parse JSON data
  const address = typeof campus.address === 'object' && campus.address !== null
    ? campus.address as unknown as { street?: string; city: string; state: string; postalCode: string; country: string; }
    : { city: 'Unknown', state: 'Unknown', country: 'Unknown', postalCode: 'Unknown' };

  const contact = typeof campus.contact === 'object' && campus.contact !== null
    ? campus.contact as unknown as { phone: string; email: string; website?: string; }
    : { phone: 'Unknown', email: 'Unknown' };

  // Filter administrators (only CAMPUS_ADMIN and CAMPUS_COORDINATOR) - used in the original tabs implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const administrators = campus.userAccess?.filter(access =>
    access.roleType === 'CAMPUS_ADMIN' || access.roleType === 'CAMPUS_COORDINATOR'
  ) || [];

  // Create a mutation for deleting a campus
  // Note: This is a mock mutation as the actual endpoint is not implemented yet
  const deleteCampus = {
    isLoading: false,
    mutate: (id: string) => {
      toast({
        title: "Not implemented",
        description: "Campus deletion is not implemented yet",
        variant: "warning",
      });
    }
  };


  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this campus? This action cannot be undone.")) {
      deleteCampus.mutate(campus.id);
    }
  };

  const getStatusBadgeVariant = (status: SystemStatus) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "secondary";
      case "ARCHIVED":
        return "warning";
      default:
        return "secondary";
    }
  };

  // Function to get badge variant based on role - used in the original tabs implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getRoleBadgeVariant = (role: UserType) => {
    switch (role) {
      case "CAMPUS_ADMIN":
        return "secondary";
      case "CAMPUS_COORDINATOR":
        return "secondary";
      case "CAMPUS_TEACHER":
        return "success";
      default:
        return "secondary";
    }
  };

  // Navigation items are now implemented as buttons at the bottom of the page
  /* const navigationItems = [
    {
      id: "administrators",
      label: (
        <div className="flex items-center">
          <UsersIcon className="h-4 w-4 mr-2" />
          Administrators
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Campus Administrators</h3>
            <Link href={`/admin/system/campuses/${campus.id}/administrators/assign`}>
              <Button size="sm">
                <UsersIcon className="h-4 w-4 mr-2" />
                Assign Administrator
              </Button>
            </Link>
          </div>

          {administrators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {administrators.map((access) => (
                <Card key={access.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{access.user.name}</CardTitle>
                      <Badge variant={getRoleBadgeVariant(access.roleType)}>
                        {access.roleType.replace('CAMPUS_', '')}
                      </Badge>
                    </div>
                    <CardDescription>{access.user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-xs text-muted-foreground">
                      <div>Start Date: {formatDate(access.startDate)}</div>
                      {access.endDate && <div>End Date: {formatDate(access.endDate)}</div>}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex justify-end w-full">
                      <Link href={`/admin/system/users/${access.user.id}`}>
                        <Button variant="outline" size="sm">View Profile</Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <UsersIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No administrators assigned</h3>
              <p className="text-sm text-gray-500 mt-1">Assign administrators to manage this campus.</p>
              <Link href={`/admin/system/campuses/${campus.id}/administrators/assign`} className="mt-4">
                <Button>Assign Administrator</Button>
              </Link>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "features",
      label: (
        <div className="flex items-center">
          <SettingsIcon className="h-4 w-4 mr-2" />
          Features
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Campus Features</h3>
            <Link href={`/admin/system/campuses/${campus.id}/features/manage`}>
              <Button size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Manage Features
              </Button>
            </Link>
          </div>

          {campus.features ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Attendance Tracking</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <Badge variant={campus.features.enableAttendance ? "success" : "secondary"}>
                    {campus.features.enableAttendance ? "Enabled" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Grading System</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <Badge variant={campus.features.enableGrading ? "success" : "secondary"}>
                    {campus.features.enableGrading ? "Enabled" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Assignments</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <Badge variant={campus.features.enableAssignments ? "success" : "secondary"}>
                    {campus.features.enableAssignments ? "Enabled" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Course Registration</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <Badge variant={campus.features.enableCourseRegistration ? "success" : "secondary"}>
                    {campus.features.enableCourseRegistration ? "Enabled" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Student Portal</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <Badge variant={campus.features.enableStudentPortal ? "success" : "secondary"}>
                    {campus.features.enableStudentPortal ? "Enabled" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Teacher Portal</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <Badge variant={campus.features.enableTeacherPortal ? "success" : "secondary"}>
                    {campus.features.enableTeacherPortal ? "Enabled" : "Disabled"}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <SettingsIcon className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Feature management</h3>
              <p className="text-sm text-gray-500 mt-1">Configure and manage campus features.</p>
              <Link href={`/admin/system/campuses/${campus.id}/features/manage`} className="mt-4">
                <Button>Manage Features</Button>
              </Link>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "programs",
      label: (
        <div className="flex items-center">
          <BookOpenIcon className="h-4 w-4 mr-2" />
          Programs
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Campus Programs</h3>
            <Link href={`/admin/system/campuses/${campus.id}/programs`}>
              <Button size="sm">
                <BookOpenIcon className="h-4 w-4 mr-2" />
                View All Programs
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Program management</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage academic programs for this campus.</p>
            <Link href={`/admin/system/campuses/${campus.id}/programs`} className="mt-4">
              <Button>View Programs</Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "classes",
      label: (
        <div className="flex items-center">
          <HomeIcon className="h-4 w-4 mr-2" />
          Classes
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Campus Classes</h3>
            <Link href={`/admin/system/campuses/${campus.id}/classes`}>
              <Button size="sm">
                <HomeIcon className="h-4 w-4 mr-2" />
                View All Classes
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <HomeIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Class management</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage classes for this campus.</p>
            <Link href={`/admin/system/campuses/${campus.id}/classes`} className="mt-4">
              <Button>View Classes</Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "facilities",
      label: (
        <div className="flex items-center">
          <BuildingIcon className="h-4 w-4 mr-2" />
          Facilities
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Campus Facilities</h3>
            <Link href={`/admin/system/campuses/${campus.id}/facilities`}>
              <Button size="sm">
                <BuildingIcon className="h-4 w-4 mr-2" />
                View All Facilities
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <BuildingIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Facility management</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage facilities for this campus.</p>
            <Link href={`/admin/system/campuses/${campus.id}/facilities`} className="mt-4">
              <Button>View Facilities</Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "students",
      label: (
        <div className="flex items-center">
          <UsersIcon className="h-4 w-4 mr-2" />
          Students
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Campus Students</h3>
            <Link href={`/admin/system/campuses/${campus.id}/students`}>
              <Button size="sm">
                <UsersIcon className="h-4 w-4 mr-2" />
                View All Students
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <UsersIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Student management</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage students for this campus.</p>
            <Link href={`/admin/system/campuses/${campus.id}/students`} className="mt-4">
              <Button>View Students</Button>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "teachers",
      label: (
        <div className="flex items-center">
          <UsersIcon className="h-4 w-4 mr-2" />
          Teachers
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Campus Teachers</h3>
            <Link href={`/admin/system/campuses/${campus.id}/teachers`}>
              <Button size="sm">
                <UsersIcon className="h-4 w-4 mr-2" />
                View All Teachers
              </Button>
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <UsersIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Teacher management</h3>
            <p className="text-sm text-gray-500 mt-1">View and manage teachers for this campus.</p>
            <Link href={`/admin/system/campuses/${campus.id}/teachers`} className="mt-4">
              <Button>View Teachers</Button>
            </Link>
          </div>
        </div>
      ),
    },
  ]; */

  // Fetch campus performance data
  const {
    data: performanceData,
    isLoading: isLoadingPerformance,
    refetch: refetchPerformance
  } = api.campusAnalytics.getCampusPerformance.useQuery(
    { campusId: campus.id },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching campus performance:', error);
        toast({
          title: 'Error',
          description: 'Failed to load campus performance data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch campus overview data
  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    refetch: refetchOverview
  } = api.campusAnalytics.getCampusOverview.useQuery(
    { campusId: campus.id },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching campus overview:', error);
        toast({
          title: 'Error',
          description: 'Failed to load campus overview data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch recent enrollments
  const {
    data: enrollmentsData,
    isLoading: isLoadingEnrollments,
    refetch: refetchEnrollments
  } = api.campusAnalytics.getRecentEnrollments.useQuery(
    { campusId: campus.id, days: 30 },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching recent enrollments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load enrollment data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch active classes
  const {
    data: classesData,
    isLoading: isLoadingClasses,
    refetch: refetchClasses
  } = api.campusAnalytics.getActiveClasses.useQuery(
    { campusId: campus.id },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching active classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load class data',
          variant: 'error',
        });
      }
    }
  );

  // Fetch program statistics
  const {
    data: programStatsData,
    isLoading: isLoadingProgramStats,
    refetch: refetchProgramStats
  } = api.campusAnalytics.getProgramStatistics.useQuery(
    { campusId: campus.id },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching program statistics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load program statistics',
          variant: 'error',
        });
      }
    }
  );

  // Function to refresh all data
  const refreshAllData = async () => {
    try {
      await Promise.all([
        refetchPerformance(),
        refetchOverview(),
        refetchEnrollments(),
        refetchClasses(),
        refetchProgramStats()
      ]);
      toast({
        title: 'Data refreshed',
        description: 'Campus analytics data has been updated',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'error',
      });
    }
  };

  // Prepare data for charts
  const programChartData = programStatsData ? programStatsData.map((program: any) => ({
    name: program.name,
    students: program.studentCount,
    classes: program.classCount
  })) : [];

  return (
    <div className="space-y-6">
      {/* Campus Header Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{campus.name}</CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center text-sm">
                  <BuildingIcon className="h-4 w-4 mr-1" />
                  <Link href={`/admin/system/institutions/${campus.institutionId}`} className="hover:underline">
                    {campus.institution.name}
                  </Link>
                </div>
                <div className="flex items-center text-sm mt-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {address.street && `${address.street}, `}
                  {address.city}, {address.state}, {address.postalCode}, {address.country}
                </div>
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Badge variant={getStatusBadgeVariant(campus.status)}>
                {campus.status}
              </Badge>
              <Badge variant="outline">{campus.code}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
                <div className="flex items-center">
                  <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{contact.email}</span>
                </div>
                {contact.website && (
                  <div className="flex items-center">
                    <GlobeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Campus Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{campus._count?.userAccess || 0} Staff Members</span>
                </div>
                <div className="flex items-center">
                  <BookOpenIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{campus._count?.programs || 0} Programs</span>
                </div>
                <div className="flex items-center">
                  <HomeIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{campus._count?.facilities || 0} Facilities</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-24">Created:</span>
                  <span>{formatDate(campus.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-24">Last Updated:</span>
                  <span>{formatDate(campus.updatedAt)}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground w-24">ID:</span>
                  <span className="text-xs font-mono">{campus.id}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-between w-full">
            <LoadingButton
              variant="outline"
              size="sm"
              onClick={refreshAllData}
              loading={isLoadingPerformance || isLoadingOverview || isLoadingEnrollments || isLoadingClasses || isLoadingProgramStats}
              loadingText="Refreshing..."
              icon={<RefreshCwIcon className="h-4 w-4" />}
            >
              Refresh Data
            </LoadingButton>
            <div className="flex space-x-2">
              <DeleteButton
                variant="outline"
                size="sm"
                onClick={handleDelete}
                loading={deleteCampus.isLoading}
                icon={<TrashIcon className="h-4 w-4" />}
              >
                Delete Campus
              </DeleteButton>
              <Link href={`/admin/system/campuses/${campus.id}/edit`}>
                <Button
                  size="sm"
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Campus
                </Button>
              </Link>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Campus Performance Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{overviewData?.students || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{overviewData?.teachers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{overviewData?.classes || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Programs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOverview ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{overviewData?.programs || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Active programs</p>
          </CardContent>
        </Card>
      </div>

      {/* Campus Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campus Attendance</CardTitle>
            <CardDescription>Attendance statistics and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {isLoadingPerformance ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-full mt-4" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Overall Attendance Rate</span>
                      <span className="text-sm font-medium">{performanceData?.studentAttendance || 0}%</span>
                    </div>
                    <Progress value={performanceData?.studentAttendance || 0} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-2 bg-muted/20 rounded-md">
                      <div className="text-lg font-bold text-green-600">Present</div>
                      <div className="text-sm">85%</div>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-md">
                      <div className="text-lg font-bold text-amber-600">Late</div>
                      <div className="text-sm">10%</div>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-md">
                      <div className="text-lg font-bold text-red-600">Absent</div>
                      <div className="text-sm">5%</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Date:</span>
                      <span className="font-medium">{format(new Date(), 'MMM dd, yyyy')}</span>
                    </div>
                    <Link href={`/admin/system/campuses/${campus.id}/attendance`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="w-full">
                        <Clock className="h-4 w-4 mr-2" />
                        View Full Attendance
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest actions in your campus</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">New student enrollment</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">Teacher assigned to Class 10-A</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">New assessment created</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <Link href={`/admin/system/campuses/${campus.id}/activity`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  View All Activity
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Program Statistics</CardTitle>
          <CardDescription>Student distribution across programs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProgramStats ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-[250px] w-full" />
            </div>
          ) : programChartData.length > 0 ? (
            <div className="h-[300px]">
              <BarChart
                data={programChartData}
                xAxisKey="name"
                bars={[
                  { dataKey: "students", name: "Students", color: "#1F504B" },
                  { dataKey: "classes", name: "Classes", color: "#5A8A84" }
                ]}
                height={300}
              />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">No program data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/admin/system/campuses/${campus.id}/programs`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <BookOpenIcon className="h-4 w-4 mr-2" />
            Programs
          </Button>
        </Link>
        <Link href={`/admin/system/campuses/${campus.id}/classes`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <HomeIcon className="h-4 w-4 mr-2" />
            Classes
          </Button>
        </Link>
        <Link href={`/admin/system/campuses/${campus.id}/students`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <UsersIcon className="h-4 w-4 mr-2" />
            Students
          </Button>
        </Link>
        <Link href={`/admin/system/campuses/${campus.id}/teachers`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <UsersIcon className="h-4 w-4 mr-2" />
            Teachers
          </Button>
        </Link>
        <Link href={`/admin/system/campuses/${campus.id}/administrators/assign`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <UsersIcon className="h-4 w-4 mr-2" />
            Administrators
          </Button>
        </Link>
        <Link href={`/admin/system/campuses/${campus.id}/facilities`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <BuildingIcon className="h-4 w-4 mr-2" />
            Facilities
          </Button>
        </Link>
        <Link href={`/admin/system/campuses/${campus.id}/features/manage`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Features
          </Button>
        </Link>
        <Link href={`/admin/system/campuses/${campus.id}/leaderboard`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full" variant="outline">
            <Trophy className="h-4 w-4 mr-2" />
            Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}