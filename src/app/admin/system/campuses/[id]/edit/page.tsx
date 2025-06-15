import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { CampusForm } from "@/components/campus/CampusForm";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Campus",
  description: "Edit campus details",
};

interface EditCampusPageProps {
  params: {
    id: string;
  };
}

export default async function EditCampusPage({ params }: EditCampusPageProps) {
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
  });

  if (!campus) {
    notFound();
  }

  // Get active institutions for the dropdown
  const institutions = await prisma.institution.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/campuses/${params.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Edit ${campus.name}`}
          description="Update campus details"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <CampusForm campus={campus} institutions={institutions} />
      </div>
    </div>
  );
} 