import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teacher Assistant Demo',
  description: 'Demo page for the Teacher Assistant feature',
};

export default function TeacherAssistantDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  );
}
