'use client';

import { StudentBottomNavTest } from '@/components/student/StudentBottomNavTest';
import { ThemeProvider } from '@/providers/theme-provider';

/**
 * Test page for StudentBottomNav component
 * 
 * This page wraps the StudentBottomNavTest component with necessary providers
 * to ensure it works correctly in isolation.
 */
export default function BottomNavTestPage() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <StudentBottomNavTest />
      </div>
    </ThemeProvider>
  );
}
