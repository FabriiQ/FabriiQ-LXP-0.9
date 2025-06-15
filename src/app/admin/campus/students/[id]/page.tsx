import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "@/components/ui/icons";
import { User as UserIcon, Mail, Calendar, MapPin } from "lucide-react";

// Custom Phone icon
const Phone = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
import { formatDate } from "@/lib/utils";
import { StudentProfile, User } from "@prisma/client";

// Define the type for formatted enrollments
interface FormattedEnrollment {
  id: string;
  className: string;
  courseName: string;
  termName: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

// Define the combined type for student profile with user
interface StudentProfileWithUser extends StudentProfile {
  user: User;
}

export default async function StudentProfilePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    // Await params to ensure it's properly resolved
    const resolvedParams = await params;
    const studentId = resolvedParams.id;

    if (!studentId) {
      console.warn("No student ID provided");
      notFound();
    }

    const session = await getServerSession(authOptions);

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

    if (!user || (user.userType !== 'CAMPUS_ADMIN' && user.userType !== 'SYSTEM_ADMIN')) {
      console.warn("Invalid user access", {
        userId: session.user.id,
        userType: user?.userType,
        hasPrimaryCampus: !!user?.primaryCampusId
      });
      redirect("/login");
    }

    // Try to find student by profile ID first
    let studentProfile: StudentProfileWithUser | null = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    }) as StudentProfileWithUser | null;

    // If not found by profile ID, try to find by user ID
    if (!studentProfile) {
      const studentUser = await prisma.user.findUnique({
        where: { id: studentId },
        include: {
          studentProfile: true,
          activeCampuses: {
            where: {
              campusId: user.primaryCampusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!studentUser) {
        console.warn("Student not found", { studentId });
        notFound();
      }

      if (!studentUser.studentProfile) {
        console.warn("User found but has no student profile", { userId: studentUser.id });
        notFound();
      }

      // Check campus access
      const hasAccess = studentUser.activeCampuses?.some(ac => ac.campusId === user.primaryCampusId);
      if (!hasAccess) {
        console.warn("Student not associated with admin's campus", {
          studentId,
          campusId: user.primaryCampusId,
          activeCampusCount: studentUser.activeCampuses?.length
        });
        notFound();
      }

      // We've already checked studentUser.studentProfile is not null above
      // Create a new object with the expected structure
      studentProfile = {
        ...studentUser.studentProfile!,
        user: studentUser
      } as StudentProfileWithUser;
    } else {
      // If found by profile ID, check user campus access
      const studentUser = await prisma.user.findUnique({
        where: { id: studentProfile.userId },
        include: {
          activeCampuses: {
            where: {
              campusId: user.primaryCampusId,
              status: 'ACTIVE'
            }
          }
        }
      });

      if (!studentUser || !studentUser.activeCampuses?.some(ac => ac.campusId === user.primaryCampusId)) {
        console.warn("Student not associated with admin's campus", {
          studentId: studentProfile.id,
          userId: studentProfile.userId,
          campusId: user.primaryCampusId
        });
        notFound();
      }
    }

    // Get enrollment data with the correct student profile ID
    const enrollmentData = await prisma.studentEnrollment.findMany({
      where: {
        studentId: studentProfile!.id,
        status: 'ACTIVE',
        class: {
          courseCampus: {
            campusId: user.primaryCampusId
          }
        }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            courseCampus: {
              include: {
                course: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            },
            term: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true
              }
            }
          }
        }
      }
    });

    // Format enrollment data
    const formattedEnrollments: FormattedEnrollment[] = enrollmentData.map(enrollment => ({
      id: enrollment.id,
      className: enrollment.class.name,
      courseName: enrollment.class.courseCampus.course.name,
      termName: enrollment.class.term.name,
      startDate: enrollment.class.term.startDate,
      endDate: enrollment.class.term.endDate
    }));

    // Safely type and parse profile data
    const profileData = (typeof studentProfile!.user.profileData === 'object' && studentProfile!.user.profileData !== null)
      ? studentProfile!.user.profileData as Record<string, any>
      : {};

    // Rest of your rendering code
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/admin/campus/students" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Students
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/admin/campus/students/${studentProfile!.id}/edit`}>
                Edit Profile
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/admin/campus/students/${studentProfile!.id}/transfer`}>
                Transfer Student
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/campus/students/${studentProfile!.id}/enroll`}>
                Enroll in Class
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Personal and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8">
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">{studentProfile!.user.name}</h2>
                  <p className="text-gray-500">{studentProfile!.enrollmentNumber || profileData.enrollmentNumber || "No Enrollment Number"}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Student
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      {studentProfile!.user.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </p>
                  <p className="font-medium">{studentProfile!.user.email || "Not provided"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone
                  </p>
                  <p className="font-medium">{studentProfile!.user.phoneNumber || profileData.phone || "Not provided"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date of Birth
                  </p>
                  <p className="font-medium">{profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : "Not provided"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Gender
                  </p>
                  <p className="font-medium">{profileData.gender || "Not specified"}</p>
                </div>
              </div>

              {profileData.address && (
                <div className="space-y-1 mt-6">
                  <p className="text-sm text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Address
                  </p>
                  <p className="font-medium">
                    {[
                      profileData.address,
                      profileData.city,
                      profileData.state,
                      profileData.postalCode,
                      profileData.country
                    ].filter(Boolean).join(", ") || "No address provided"}
                  </p>
                </div>
              )}

              {profileData.emergencyContact && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{profileData.emergencyContact.name || "Not provided"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profileData.emergencyContact.phone || "Not provided"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Relationship</p>
                      <p className="font-medium">{profileData.emergencyContact.relationship || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              )}

              {profileData.notes && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4">Notes</h3>
                  <p className="text-gray-700 whitespace-pre-line">{profileData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
              <CardDescription>Classes the student is enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {formattedEnrollments && formattedEnrollments.length > 0 ? (
                <div className="space-y-4">
                  {formattedEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className="border rounded-md p-4">
                      <h3 className="font-semibold">{enrollment.className}</h3>
                      <p className="text-sm text-gray-500">{enrollment.courseName}</p>
                      <p className="text-sm text-gray-500">{enrollment.termName}</p>
                      {enrollment.startDate && enrollment.endDate && (
                        <p className="text-sm text-gray-500">
                          {formatDate(enrollment.startDate)} - {formatDate(enrollment.endDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active enrollments found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );

  } catch (error) {
    console.error("Error in StudentProfilePage:", error);
    notFound();
  }
}
