'use client';

import { MainLayout } from '@/components/layouts/main-layout';

export function ProfileLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
} 