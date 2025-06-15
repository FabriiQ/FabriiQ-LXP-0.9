import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { logger } from "@/server/api/utils/logger";

export const metadata: Metadata = {
  title: "Activity",
  description: "View and complete activity",
};

export default async function StudentActivityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Get the activity ID from params - make sure to await params in NextJS dynamic routes
  const id = params.id;

  // Log the params for debugging
  logger.debug('Activity ID - redirecting to class-specific page', { activityId: id });
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
      primaryCampusId: true,
    },
  });

  // Check if user is a student (either CAMPUS_STUDENT or STUDENT)
  const isStudent = user?.userType === 'CAMPUS_STUDENT' || user?.userType === 'STUDENT';

  if (!user || !isStudent) {
    redirect("/login");
  }

  // Get student profile to get the student ID
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!studentProfile) {
    notFound();
  }

  // Get the activity from the database
  const activityData = await prisma.activity.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      classId: true,
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!activityData) {
    notFound();
  }

  // Redirect to the class-specific activity page
  if (activityData.classId) {
    logger.debug('Redirecting to class-specific activity page', {
      activityId: id,
      classId: activityData.classId,
      className: activityData.class?.name
    });

    return redirect(`/student/class/${activityData.classId}/activities/${id}`);
  }

  // If we get here, it means the activity doesn't have a class ID
  // Redirect to the activities page
  logger.debug('Activity has no class ID, redirecting to activities page', {
    activityId: id
  });

  return redirect('/student/classes');
}
