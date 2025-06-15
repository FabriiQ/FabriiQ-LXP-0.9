import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { InstitutionForm } from "@/components/institution/InstitutionForm";

export const metadata: Metadata = {
  title: "Create Institution",
  description: "Create a new institution in the system",
};

export default async function CreateInstitutionPage() {
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/admin/system/institutions">
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Create Institution"
          description="Add a new institution to the system"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <InstitutionForm />
      </div>
    </div>
  );
} 