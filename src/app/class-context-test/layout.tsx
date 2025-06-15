import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Class Context Test',
  description: 'Test page for the Class Context implementation',
};

export default function ClassContextTestLayout({
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
