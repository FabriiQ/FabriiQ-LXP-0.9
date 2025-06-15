import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserSession } from "@/server/api/trpc";
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { prisma } from "@/server/db";

export const metadata: Metadata = {
  title: "Parent Dashboard",
  description: "Your AIVY LXP Parent Dashboard",
};

export default async function ParentDashboardPage() {
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

  if (!user || user.userType !== 'CAMPUS_PARENT') {
    redirect("/login");
  }

  // Custom metrics for parent
  const metrics = {
    children: { value: 2, description: "Enrolled children" },
    meetings: { value: 1, description: "Upcoming meetings" },
    reports: { value: 3, description: "New reports" },
    messages: { value: 4, description: "Unread messages" },
  };

  return (
    <RoleDashboard
      userName={user.name || "Parent"}
      userType={user.userType}
      metrics={metrics}
    />
  );
}