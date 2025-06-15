import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { PageHeader } from "@/components/ui/atoms/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { InstitutionDetail } from "@/components/institution/InstitutionDetail";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Institution Details",
  description: "View and manage institution details",
};

interface InstitutionDetailPageProps {
  params: {
    id: string;
  };
}

export default async function InstitutionDetailPage({ params }: InstitutionDetailPageProps) {
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

  // Get institution details
  const institution = await prisma.institution.findUnique({
    where: { id: params.id },
    include: {
      campuses: {
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          campuses: true,
        },
      },
    },
  });

  if (!institution) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/admin/system/institutions">
            <Button variant="outline" size="icon">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader
            title={institution.name}
            description={`Institution Code: ${institution.code}`}
          />
        </div>
        <Link href={`/admin/system/institutions/${params.id}/edit`}>
          <Button>
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Institution
          </Button>
        </Link>
      </div>

      <InstitutionDetail institution={institution} />
    </div>
  );
}