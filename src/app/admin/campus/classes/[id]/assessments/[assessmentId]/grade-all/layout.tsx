import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bulk Grade Assessment',
  description: 'Grade multiple assessment submissions at once',
};

export default function GradeAllLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
