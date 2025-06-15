import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { InstitutionList } from "@/components/institution/InstitutionList";

export const metadata: Metadata = {
  title: "Institution Management",
  description: "Manage institutions in the AIVY Learning Experience Platform",
};

export default async function InstitutionsPage() {
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

  // Get institutions with pagination
  const institutions = await prisma.institution.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          campuses: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Institution Management"
          description="Create and manage institutions in the system"
        />
        <Link href="/admin/system/institutions/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Institution
          </Button>
        </Link>
      </div>
      
      <InstitutionList institutions={institutions} />
    </div>
  );
} 