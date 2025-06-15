import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { CampusDetail } from "@/components/campus/CampusDetail";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Campus Details",
  description: "View and manage campus details",
};

interface CampusDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CampusDetailPage({ params }: CampusDetailPageProps) {
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
    where: { id: params.id },
    include: {
      institution: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      userAccess: {
        where: {
          status: 'ACTIVE',
        },
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
      _count: {
        select: {
          userAccess: true,
          facilities: true,
          programs: true,
        },
      },
      // Include campus features
      features: {
        select: {
          key: true,
          settings: true,
        },
      },
    },
  });

  if (!campus) {
    notFound();
  }

  // Transform the data to match the expected structure in the CampusDetail component
  const campusWithFeatures = {
    ...campus,
    features: {
      enableAttendance: false,
      enableGrading: false,
      enableAssignments: false,
      enableCourseRegistration: false,
      enableStudentPortal: false,
      enableTeacherPortal: false,
      enableParentPortal: false,
      enableLibrary: false,
      enableEvents: false,
    }
  };

  // Process the features from the database
  if (campus.features && campus.features.length > 0) {
    campus.features.forEach(feature => {
      if (feature.key === 'attendance' && feature.settings) {
        campusWithFeatures.features.enableAttendance = true;
      } else if (feature.key === 'grading' && feature.settings) {
        campusWithFeatures.features.enableGrading = true;
      } else if (feature.key === 'assignments' && feature.settings) {
        campusWithFeatures.features.enableAssignments = true;
      } else if (feature.key === 'courseRegistration' && feature.settings) {
        campusWithFeatures.features.enableCourseRegistration = true;
      } else if (feature.key === 'studentPortal' && feature.settings) {
        campusWithFeatures.features.enableStudentPortal = true;
      } else if (feature.key === 'teacherPortal' && feature.settings) {
        campusWithFeatures.features.enableTeacherPortal = true;
      } else if (feature.key === 'parentPortal' && feature.settings) {
        campusWithFeatures.features.enableParentPortal = true;
      } else if (feature.key === 'library' && feature.settings) {
        campusWithFeatures.features.enableLibrary = true;
      } else if (feature.key === 'events' && feature.settings) {
        campusWithFeatures.features.enableEvents = true;
      }
    });
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/system/campuses">
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={campus.name}
          description={`Campus details for ${campus.code}`}
        />
      </div>

      <CampusDetail campus={campusWithFeatures} />
    </div>
  );
}