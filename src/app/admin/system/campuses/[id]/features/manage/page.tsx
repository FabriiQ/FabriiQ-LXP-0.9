import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { CampusFeaturesForm } from "./CampusFeaturesForm";

interface CampusFeaturesPageProps {
  params: {
    id: string;
  };
}

export default async function CampusFeaturesPage({ params }: CampusFeaturesPageProps) {
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

  // Get current feature settings - in a real app, you would fetch this from a database
  // For now, we'll use default values
  const features = {
    enableAttendance: false,
    enableGrading: false,
    enableAssignments: false,
    enableCourseRegistration: false,
    enableStudentPortal: false,
    enableTeacherPortal: false,
    enableParentPortal: false,
    enableLibrary: false,
    enableEvents: false,
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
          title={`Manage Features - ${campus.name}`}
          description={`Configure features for ${campus.code} campus`}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campus Features</CardTitle>
          <CardDescription>
            Enable or disable features for this campus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampusFeaturesForm 
            campusId={params.id}
            features={features}
          />
        </CardContent>
      </Card>
    </div>
  );
} 