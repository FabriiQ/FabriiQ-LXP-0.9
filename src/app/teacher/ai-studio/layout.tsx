import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Content Studio',
  description: 'Create AI-powered learning activities and assessments',
};

export default function AIStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
