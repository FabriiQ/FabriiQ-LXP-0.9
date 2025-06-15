import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import StudentGradeDetail from "@/components/shared/entities/students/StudentGradeDetail";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Grade Details",
  description: "View detailed grade information",
};

export default async function StudentGradeDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  if (!user || user.userType !== 'CAMPUS_STUDENT') {
    redirect("/login");
  }

  // Sample grades data
  // In a real application, this would come from the database
  const grades = [
    // Mathematics grades
    {
      id: '1',
      title: 'Algebra Mid-term Exam',
      subject: 'Mathematics',
      type: 'Exam',
      date: new Date(Date.now() - 1209600000), // 2 weeks ago
      score: 85,
      totalScore: 100,
      grade: 'B+',
      feedback: 'Good work on the algebraic equations. Need to improve on word problems.',
      classId: 'math-101',
      className: 'Mathematics 101',
      term: 'Spring 2023'
    },
    {
      id: '2',
      title: 'Geometry Quiz',
      subject: 'Mathematics',
      type: 'Quiz',
      date: new Date(Date.now() - 864000000), // 10 days ago
      score: 18,
      totalScore: 20,
      grade: 'A',
      classId: 'math-101',
      className: 'Mathematics 101',
      term: 'Spring 2023'
    },
    {
      id: '3',
      title: 'Calculus Assignment',
      subject: 'Mathematics',
      type: 'Assignment',
      date: new Date(Date.now() - 432000000), // 5 days ago
      score: 27,
      totalScore: 30,
      grade: 'A-',
      feedback: 'Excellent work on derivatives. Some minor errors in integration problems.',
      classId: 'math-101',
      className: 'Mathematics 101',
      term: 'Spring 2023'
    },

    // Science grades
    {
      id: '4',
      title: 'Physics Lab Report',
      subject: 'Science',
      type: 'Lab',
      date: new Date(Date.now() - 1036800000), // 12 days ago
      score: 38,
      totalScore: 50,
      grade: 'C+',
      feedback: 'Your data collection was good, but the analysis needs improvement. Please review the feedback on your calculations.',
      classId: 'sci-101',
      className: 'Science 101',
      term: 'Spring 2023'
    },
    {
      id: '5',
      title: 'Chemistry Final Exam',
      subject: 'Science',
      type: 'Exam',
      date: new Date(Date.now() - 2592000000), // 30 days ago
      score: 88,
      totalScore: 100,
      grade: 'B+',
      classId: 'sci-101',
      className: 'Science 101',
      term: 'Winter 2022'
    },
    {
      id: '6',
      title: 'Biology Project',
      subject: 'Science',
      type: 'Project',
      date: new Date(Date.now() - 1728000000), // 20 days ago
      score: 95,
      totalScore: 100,
      grade: 'A',
      feedback: 'Outstanding work on your ecosystem project. Your research and presentation were excellent.',
      classId: 'sci-101',
      className: 'Science 101',
      term: 'Spring 2023'
    },

    // English grades
    {
      id: '7',
      title: 'Grammar Quiz',
      subject: 'English',
      type: 'Quiz',
      date: new Date(Date.now() - 604800000), // 7 days ago
      score: 19,
      totalScore: 20,
      grade: 'A',
      classId: 'eng-101',
      className: 'English 101',
      term: 'Spring 2023'
    },
    {
      id: '8',
      title: 'Essay Writing Assignment',
      subject: 'English',
      type: 'Assignment',
      date: new Date(Date.now() - 1296000000), // 15 days ago
      score: 43,
      totalScore: 50,
      grade: 'B+',
      feedback: 'Your thesis was strong and well-supported. Work on improving transitions between paragraphs.',
      classId: 'eng-101',
      className: 'English 101',
      term: 'Spring 2023'
    },
    {
      id: '9',
      title: 'Literature Analysis Final',
      subject: 'English',
      type: 'Exam',
      date: new Date(Date.now() - 2592000000), // 30 days ago
      score: 92,
      totalScore: 100,
      grade: 'A-',
      classId: 'eng-101',
      className: 'English 101',
      term: 'Winter 2022'
    },

    // History grades
    {
      id: '10',
      title: 'Ancient Civilizations Test',
      subject: 'History',
      type: 'Exam',
      date: new Date(Date.now() - 1555200000), // 18 days ago
      score: 78,
      totalScore: 100,
      grade: 'C+',
      feedback: 'You demonstrated good knowledge of Greek civilization but need to improve on Roman history.',
      classId: 'hist-101',
      className: 'History 101',
      term: 'Spring 2023'
    },
    {
      id: '11',
      title: 'Medieval History Research Paper',
      subject: 'History',
      type: 'Assignment',
      date: new Date(Date.now() - 2160000000), // 25 days ago
      score: 45,
      totalScore: 50,
      grade: 'A-',
      classId: 'hist-101',
      className: 'History 101',
      term: 'Spring 2023'
    },
    {
      id: '12',
      title: 'Modern History Presentation',
      subject: 'History',
      type: 'Project',
      date: new Date(Date.now() - 3456000000), // 40 days ago
      score: 28,
      totalScore: 30,
      grade: 'A',
      feedback: 'Excellent presentation on World War II. Your research was thorough and your delivery was engaging.',
      classId: 'hist-101',
      className: 'History 101',
      term: 'Winter 2022'
    }
  ];

  // Find the grade by ID
  const grade = grades.find(g => g.id === params.id);

  if (!grade) {
    notFound();
  }

  // Sample questions for the grade
  const questions = [
    {
      id: '1',
      question: 'What is the formula for the area of a circle?',
      type: 'multiple-choice' as const,
      userAnswer: 'πr²',
      correctAnswer: 'πr²',
      score: 5,
      maxScore: 5,
      isCorrect: true
    },
    {
      id: '2',
      question: 'Solve for x: 2x + 5 = 15',
      type: 'short-answer' as const,
      userAnswer: 'x = 5',
      correctAnswer: 'x = 5',
      score: 5,
      maxScore: 5,
      isCorrect: true
    },
    {
      id: '3',
      question: 'The Pythagorean theorem applies to all triangles.',
      type: 'true-false' as const,
      userAnswer: 'True',
      correctAnswer: 'False',
      score: 0,
      maxScore: 5,
      feedback: 'The Pythagorean theorem only applies to right triangles.',
      isCorrect: false
    },
    {
      id: '4',
      question: 'Explain the concept of a function in mathematics.',
      type: 'essay' as const,
      userAnswer: 'A function is a relation between a set of inputs and a set of outputs, where each input is related to exactly one output. Functions can be represented in various ways, including equations, graphs, tables, and mappings.',
      correctAnswer: 'A function is a relation between a set of inputs and a set of outputs, where each input is related to exactly one output.',
      score: 8,
      maxScore: 10,
      feedback: 'Good explanation of the basic concept. Could have included more examples or applications.',
      isCorrect: false
    },
    {
      id: '5',
      question: 'Match the following terms with their definitions: Derivative, Integral, Limit, Function',
      type: 'matching' as const,
      userAnswer: 'Derivative - Rate of change, Integral - Area under curve, Limit - Value a function approaches, Function - Input-output relation',
      correctAnswer: 'Derivative - Rate of change, Integral - Area under curve, Limit - Value a function approaches, Function - Input-output relation',
      score: 10,
      maxScore: 10,
      isCorrect: true
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <StudentGradeDetail
        grade={grade}
        questions={questions}
      />
    </div>
  );
}
