import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import StudentActivityCalendar from "@/components/shared/entities/students/StudentActivityCalendar";

export const metadata: Metadata = {
  title: "Activity Calendar",
  description: "View your activities in a calendar format",
};

export default async function StudentActivityCalendarPage() {
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
      studentProfile: {
        select: {
          id: true,
          enrollmentNumber: true,
          enrollments: {
            where: { status: 'ACTIVE' },
            select: {
              id: true,
              class: {
                select: {
                  id: true,
                  name: true,
                  subject: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
  });

  if (!user || user.userType !== 'CAMPUS_STUDENT') {
    redirect("/login");
  }

  // Sample activities data
  // In a real application, this would come from the database
  const activities = [
    // Mathematics activities
    {
      id: '1',
      title: 'Algebra Quiz',
      subject: 'Mathematics',
      type: 'Quiz',
      dueDate: new Date(Date.now() - 1209600000), // 2 weeks ago
      status: 'completed',
      score: 85,
      totalScore: 100,
      chapter: 'Chapter 1: Algebra',
      classId: 'math-101',
      className: 'Mathematics 101'
    },
    {
      id: '2',
      title: 'Geometry Assignment',
      subject: 'Mathematics',
      type: 'Assignment',
      dueDate: new Date(Date.now() - 864000000), // 10 days ago
      status: 'completed',
      score: 90,
      totalScore: 100,
      chapter: 'Chapter 2: Geometry',
      classId: 'math-101',
      className: 'Mathematics 101'
    },
    {
      id: '3',
      title: 'Calculus Quiz',
      subject: 'Mathematics',
      type: 'Quiz',
      dueDate: new Date(Date.now() + 259200000), // 3 days from now
      status: 'upcoming',
      chapter: 'Chapter 3: Calculus',
      classId: 'math-101',
      className: 'Mathematics 101'
    },
    
    // Science activities
    {
      id: '4',
      title: 'Physics Lab Report',
      subject: 'Science',
      type: 'Lab',
      dueDate: new Date(Date.now() - 432000000), // 5 days ago
      status: 'completed',
      score: 75,
      totalScore: 100,
      chapter: 'Chapter 1: Mechanics',
      classId: 'sci-101',
      className: 'Science 101'
    },
    {
      id: '5',
      title: 'Chemistry Quiz',
      subject: 'Science',
      type: 'Quiz',
      dueDate: new Date(Date.now() - 172800000), // 2 days ago
      status: 'overdue',
      chapter: 'Chapter 2: Chemical Reactions',
      classId: 'sci-101',
      className: 'Science 101'
    },
    {
      id: '6',
      title: 'Biology Project',
      subject: 'Science',
      type: 'Project',
      dueDate: new Date(Date.now() + 432000000), // 5 days from now
      status: 'pending',
      chapter: 'Chapter 3: Cell Biology',
      classId: 'sci-101',
      className: 'Science 101'
    },
    
    // English activities
    {
      id: '7',
      title: 'Grammar Quiz',
      subject: 'English',
      type: 'Quiz',
      dueDate: new Date(Date.now() - 604800000), // 1 week ago
      status: 'completed',
      score: 95,
      totalScore: 100,
      chapter: 'Chapter 1: Grammar',
      classId: 'eng-101',
      className: 'English 101'
    },
    {
      id: '8',
      title: 'Essay Writing',
      subject: 'English',
      type: 'Assignment',
      dueDate: new Date(Date.now() + 86400000), // 1 day from now
      status: 'pending',
      chapter: 'Chapter 2: Writing',
      classId: 'eng-101',
      className: 'English 101'
    },
    {
      id: '9',
      title: 'Literature Analysis',
      subject: 'English',
      type: 'Essay',
      dueDate: new Date(Date.now() + 1209600000), // 2 weeks from now
      status: 'upcoming',
      chapter: 'Chapter 3: Literature',
      classId: 'eng-101',
      className: 'English 101'
    },
    
    // History activities
    {
      id: '10',
      title: 'Ancient Civilizations Quiz',
      subject: 'History',
      type: 'Quiz',
      dueDate: new Date(Date.now() - 345600000), // 4 days ago
      status: 'completed',
      score: 80,
      totalScore: 100,
      chapter: 'Chapter 1: Ancient Civilizations',
      classId: 'hist-101',
      className: 'History 101'
    },
    {
      id: '11',
      title: 'Medieval History Assignment',
      subject: 'History',
      type: 'Assignment',
      dueDate: new Date(Date.now() + 172800000), // 2 days from now
      status: 'pending',
      chapter: 'Chapter 2: Medieval History',
      classId: 'hist-101',
      className: 'History 101'
    },
    {
      id: '12',
      title: 'Modern History Project',
      subject: 'History',
      type: 'Project',
      dueDate: new Date(Date.now() + 864000000), // 10 days from now
      status: 'upcoming',
      chapter: 'Chapter 3: Modern History',
      classId: 'hist-101',
      className: 'History 101'
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <StudentActivityCalendar activities={activities} />
    </div>
  );
}
