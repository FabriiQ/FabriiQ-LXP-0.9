import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "~/server/api/trpc";
import { prisma } from "~/server/db";

export const metadata: Metadata = {
  title: "Create User",
  description: "Create a new user in the system",
};

export default async function CreateUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return <>{children}</>;
} 