import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { CampusList } from "@/components/campus/CampusList";

export const metadata: Metadata = {
  title: "Campus Management",
  description: "Manage campuses in the AIVY Learning Experience Platform",
};

export default async function CampusesPage() {
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

  // Get campuses with pagination and include institution data
  const campuses = await prisma.campus.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      institution: true,
      _count: {
        select: {
          userAccess: true,
          facilities: true,
          programs: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader
          title="Campus Management"
          description="Create and manage campuses in the system"
        />
        <Link href="/admin/system/campuses/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Campus
          </Button>
        </Link>
      </div>
      
      <CampusList campuses={campuses} />
    </div>
  );
} 