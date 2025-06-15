/**
 * Background Jobs Admin Page
 * 
 * This page provides an interface for system administrators to manage background jobs.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { BackgroundJobsManager } from "@/components/admin/system/BackgroundJobsManager";
import { UserType } from "@prisma/client";

export const metadata = {
  title: "Background Jobs | Admin",
  description: "Manage background jobs for the system",
};

export default async function BackgroundJobsPage() {
  // Get the user session
  const session = await getServerSession(authOptions);
  
  // Check if the user is authenticated
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin/system/background-jobs");
  }
  
  // Check if the user is a system admin
  if (session.user.userType !== UserType.SYSTEM_ADMIN && session.user.userType !== UserType.SYSTEM_MANAGER) {
    redirect("/dashboard");
  }
  
  return (
    <div className="container mx-auto py-6">
      <BackgroundJobsManager />
    </div>
  );
}
