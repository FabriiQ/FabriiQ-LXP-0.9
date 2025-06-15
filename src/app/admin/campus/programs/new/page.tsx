import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeftIcon } from "lucide-react";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { ProgramAssignmentForm } from "@/components/campus/ProgramAssignmentForm";

export default async function NewCampusProgramPage() {
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
      institutionId: true,
    },
  });

  if (!campus) {
    redirect("/login");
  }

  // Get available programs that can be added to this campus
  const availablePrograms = await prisma.program.findMany({
    where: {
      institutionId: campus.institutionId,
      status: 'ACTIVE',
      // Exclude programs already associated with this campus
      NOT: {
        campusOfferings: {
          some: {
            campusId: campus.id,
            status: 'ACTIVE',
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/campus/programs">
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Assign Program - ${campus.name}`}
          description={`Assign a program to ${campus.code} campus`}
        />
      </div>
      
      <div className="max-w-2xl mx-auto">
        <ProgramAssignmentForm 
          campusId={campus.id}
          availablePrograms={availablePrograms}
          returnUrl="/admin/campus/programs"
        />
      </div>
    </div>
  );
}
