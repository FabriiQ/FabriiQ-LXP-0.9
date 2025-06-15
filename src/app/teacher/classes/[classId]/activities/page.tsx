import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { TeacherSubjectActivitiesClient } from "@/components/teacher/activities/TeacherSubjectActivitiesClient";

export const metadata: Metadata = {
  title: "Class Activities",
  description: "View and manage activities for your class",
};

export default async function ClassActivitiesPage({
  params,
}: {
  params: { classId: string };
}) {
  const { classId } = params;
  const session = await getSessionCache();

  if (!session?.user?.id) {
    return redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      userType: true,
      teacherProfile: {
        select: {
          id: true
        }
      }
    }
  });

  if (!user || (user.userType !== 'CAMPUS_TEACHER' && user.userType !== 'TEACHER') || !user.teacherProfile) {
    return redirect("/login");
  }

  // Check if the teacher is assigned to this class
  const teacherAssignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: user.teacherProfile.id,
      classId: classId
    }
  });

  if (!teacherAssignment) {
    return redirect("/teacher/classes");
  }

  // Get class details
  const classDetails = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      courseCampus: {
        include: {
          course: {
            include: {
              subjects: {
                where: {
                  status: 'ACTIVE'
                },
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!classDetails) {
    return redirect("/teacher/classes");
  }

  return (
    <div className="container mx-auto py-6">
      <TeacherSubjectActivitiesClient
        classId={classId}
        className={classDetails.name}
        subjects={classDetails.courseCampus?.course?.subjects || []}
      />
    </div>
  );
}


