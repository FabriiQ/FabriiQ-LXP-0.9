'use client';

import { ReactNode } from 'react';

/**
 * Layout for dashboard/student/class/[classId] paths
 * 
 * This is a minimal layout that just passes through children
 * It's needed to make the folder structure work for redirects
 * 
 * Using a route group (student-routes) to isolate this route from conflicting with
 * the main student routes that use [id] instead of [classId]
 */
export default function ClassLayout({ children }: { children: ReactNode }) {
  return children;
}
