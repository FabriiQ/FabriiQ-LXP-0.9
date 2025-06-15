import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'View Transitions API Test',
  description: 'Test page for the View Transitions API implementation',
};

export default function ViewTransitionsTestLayout({
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
