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
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Institution",
  description: "Edit institution details",
};

interface EditInstitutionPageProps {
  params: {
    id: string;
  };
}

export default async function EditInstitutionPage({ params }: EditInstitutionPageProps) {
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

  // Get institution details
  const institution = await prisma.institution.findUnique({
    where: { id: params.id },
  });

  if (!institution) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/admin/system/institutions/${params.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Edit ${institution.name}`}
          description="Update institution details"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <InstitutionForm institution={institution} />
      </div>
    </div>
  );
} 