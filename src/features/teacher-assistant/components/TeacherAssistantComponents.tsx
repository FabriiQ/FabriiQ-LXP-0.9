'use client';

import { useSession } from 'next-auth/react';
import { TeacherAssistantButton } from './TeacherAssistantButton';
import { TeacherAssistantDialog } from './TeacherAssistantDialog';

/**
 * Teacher Assistant Components
 * 
 * This component renders the TeacherAssistantButton and TeacherAssistantDialog
 * components. It should be used outside of the TeacherAssistantProvider to
 * avoid circular dependency issues.
 */
export function TeacherAssistantComponents() {
  const { data: session } = useSession();

  // Only render if we have a valid user session
  if (!session?.user) {
    return null;
  }

  return (
    <>
      <TeacherAssistantButton />
      <TeacherAssistantDialog />
    </>
  );
}
