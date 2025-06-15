import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Teacher Dashboard",
  description: "Overview of your classes, assessments, and activities",
};

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}