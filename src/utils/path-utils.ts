/**
 * Utility functions for path detection and navigation
 */

/**
 * Check if the current path is a class-specific page
 * @param path The current path
 * @returns Boolean indicating if the path is class-specific
 */
export function isClassSpecificPage(path: string): boolean {
  // Match patterns like /student/class/[id]/* (new structure)
  // Specifically avoid matching /student/classes/ (the classes list page)
  return /^\/student\/class\/[^/]+/.test(path);
}

/**
 * Extract class ID from a class-specific path
 * @param path The current path
 * @returns The class ID or null if not found
 */
export function extractClassIdFromPath(path: string): string | null {
  // Match /student/class/[id]/* (new structure)
  const match = path.match(/^\/student\/class\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Get the current section of a class-specific page
 * @param path The current path
 * @returns The section name or null if not found
 */
export function getClassPageSection(path: string): string | null {
  // Match /student/class/[id]/[section]
  const match = path.match(/^\/student\/class\/[^/]+\/([^/]+)/);
  return match ? match[1] : 'dashboard';
}

/**
 * Generate breadcrumb items for a class-specific page
 * @param path The current path
 * @param className The name of the class (optional)
 * @returns Array of breadcrumb items
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

export function generateClassBreadcrumbs(path: string, className?: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/student/dashboard' },
    { label: 'Classes', href: '/student/classes' },
  ];

  const classId = extractClassIdFromPath(path);
  if (classId) {
    breadcrumbs.push({
      label: className || `Class ${classId}`,
      href: `/student/class/${classId}/dashboard`,
    });

    const section = getClassPageSection(path);
    if (section && section !== 'dashboard') {
      breadcrumbs.push({
        label: section.charAt(0).toUpperCase() + section.slice(1),
        href: path,
        isCurrent: true,
      });
    }
  }

  return breadcrumbs;
}

/**
 * Check if the current path is a deep navigation page (3+ levels deep)
 * @param path The current path
 * @returns Boolean indicating if the path is deep navigation
 */
export function isDeepNavigationPage(path: string): boolean {
  // Count path segments (excluding empty segments)
  const segments = path.split('/').filter(Boolean);
  return segments.length >= 3;
}
