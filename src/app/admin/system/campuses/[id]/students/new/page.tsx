import { getSessionCache } from "@/utils/session-cache";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";
import { prisma } from "@/server/db";
import { AddStudentForm } from "./AddStudentForm";

interface AddStudentPageProps {
  params: {
    id: string;
  };
}

// This function fetches the data needed for the page
async function getPageData(campusId: string) {
  const session = await getSessionCache();

  if (!session?.user?.id) {
    return { redirect: "/login" };
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
    return { redirect: "/login" };
  }

  // Get campus details
  const campus = await prisma.campus.findUnique({
    where: { id: campusId },
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
    return { notFound: true };
  }

  // Get available programs for this campus
  const programCampuses = await prisma.programCampus.findMany({
    where: {
      campusId: campusId,
      status: 'ACTIVE',
    },
    include: {
      program: true,
    },
    orderBy: {
      program: {
        name: 'asc',
      },
    },
  });

  return { campus, programCampuses };
}

// This is the actual page component (not async)
export default function AddStudentPage({ params }: AddStudentPageProps) {
  const campusId = params.id;
  
  // Use React's suspense boundary to handle async data fetching
  const dataPromise = getPageData(campusId);
  
  // Handle redirects and not found cases
  if (dataPromise instanceof Promise) {
    dataPromise.then(result => {
      if (result.redirect) {
        redirect(result.redirect);
      }
      if (result.notFound) {
        notFound();
      }
    });
  }
  
  // Use the async/await pattern in a separate component
  return <AddStudentPageContent campusId={campusId} dataPromise={dataPromise} />;
}

// Async component to handle the data fetching
async function AddStudentPageContent({ 
  campusId, 
  dataPromise 
}: { 
  campusId: string, 
  dataPromise: Promise<any> 
}) {
  const data = await dataPromise;
  
  // If we have redirect or notFound, we've already handled it in the parent
  if (data.redirect || data.notFound) {
    return null;
  }
  
  const { campus, programCampuses } = data;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${campusId}/students`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Add Student - ${campus.name}`}
          description={`Add a student to ${campus.code} campus`}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Add Student</CardTitle>
          <CardDescription>
            Add an existing student or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddStudentForm 
            campusId={campusId}
            programCampuses={programCampuses}
          />
        </CardContent>
      </Card>
    </div>
  );
} 