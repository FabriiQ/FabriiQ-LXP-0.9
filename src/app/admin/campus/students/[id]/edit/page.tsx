import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { Card, CardContent } from "@/components/ui/data-display/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EditStudentForm } from "./EditStudentForm";

// Import a custom ArrowLeft icon component
const ArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
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
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

// Verify that the edit-student-form.tsx file exists in the same directory
// If the file exists but TypeScript can't find it, this might be a path issue or casing issue

export default async function EditStudentPage(props: { params: { id: string } | Promise<{ id: string }> }) {
  // Await params to ensure it's properly resolved
  const resolvedParams = await props.params;
  const studentId: string = resolvedParams.id;

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

  if (!user || user.userType !== 'CAMPUS_ADMIN' || !user.primaryCampusId) {
    redirect("/login");
  }

  console.log('Attempting to find student with ID:', studentId);

  // First, check if this is a student profile ID rather than a user ID
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: { user: true }
  });

  console.log('Student profile query result:', studentProfile ? 'Found' : 'Not Found');

  // If we found a student profile, use the associated user
  let student = null;
  const foundViaProfile = studentProfile !== null;
  console.log('Found via profile:', foundViaProfile);

  if (studentProfile) {
    student = studentProfile.user;
    console.log('Using user from student profile:', student.id);
  } else {
    // Otherwise, try to find the user directly
    student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: true,
      }
    });
    console.log('Direct user query result:', student ? 'Found' : 'Not Found');
  }

  // Try to find any student with this ID pattern to check if ID format is correct
  const anyStudent = await prisma.user.findFirst({
    where: {
      userType: 'CAMPUS_STUDENT',
    },
    take: 1
  });

  console.log('Sample student found:', anyStudent ? anyStudent.id : 'None found');
  console.log('ID format comparison - Current:', studentId, 'Sample:', anyStudent?.id);

  if (!student) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/campus/students${foundViaProfile && studentProfile ? `/${studentProfile.id}` : ''}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Student Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>The requested student profile could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract profile data
  const profileData = student.profileData as Record<string, any> || {};

  // Prepare student data for the form
  let enrollmentNumber = '';
  if (foundViaProfile && studentProfile) {
    // If we found via profile, use the enrollment number from there
    enrollmentNumber = studentProfile.enrollmentNumber;
    console.log('Using enrollment number from profile:', enrollmentNumber);
  } else {
    // Otherwise try to get it from the user's studentProfile or profileData
    enrollmentNumber = student.studentProfile?.enrollmentNumber || profileData.enrollmentNumber || '';
    console.log('Using enrollment number from user data:', enrollmentNumber);
  }

  const studentData = {
    id: student.id,
    name: student.name || "",
    email: student.email,
    phoneNumber: student.phoneNumber,
    firstName: profileData.firstName || student.name?.split(' ')[0] || '',
    lastName: profileData.lastName || student.name?.split(' ').slice(1).join(' ') || '',
    enrollmentNumber: enrollmentNumber,
    dateOfBirth: profileData.dateOfBirth || '',
    gender: profileData.gender || '',
    address: profileData.address || '',
    city: profileData.city || '',
    state: profileData.state || '',
    postalCode: profileData.postalCode || '',
    country: profileData.country || '',
    emergencyContactName: profileData.emergencyContact?.name || '',
    emergencyContactPhone: profileData.emergencyContact?.phone || '',
    emergencyContactRelationship: profileData.emergencyContact?.relationship || '',
    notes: profileData.notes || '',
  };

  console.log('Prepared student data:', { id: studentData.id, name: studentData.name, enrollmentNumber: studentData.enrollmentNumber });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/campus/students/${foundViaProfile && studentProfile ? studentProfile.id : studentId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Student Profile</h1>
        </div>
      </div>

      <EditStudentForm
        student={studentData}
        userId={user.id}
      />
    </div>
  );
}