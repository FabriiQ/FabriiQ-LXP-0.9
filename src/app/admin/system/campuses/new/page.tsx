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

export const metadata: Metadata = {
  title: "Create Campus",
  description: "Create a new campus in the system",
};

export default async function CreateCampusPage() {
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
        <Link href="/admin/system/campuses">
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Create Campus"
          description="Add a new campus to the system"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <CampusForm institutions={institutions} />
      </div>
    </div>
  );
}