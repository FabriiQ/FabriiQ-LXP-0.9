/**
 * Utility functions for admin navigation URL construction
 * 
 * This helps prevent the duplicate "admin" issue in URLs by properly
 * detecting system admin vs institution-specific admin routes.
 */

/**
 * Determines if the current path is a system admin route
 * @param pathname - The current pathname (e.g., from window.location.pathname)
 * @returns true if this is a system admin route (/admin/system/...)
 */
export function isSystemAdminRoute(pathname: string): boolean {
  const pathParts = pathname.split('/');
  return pathParts[1] === 'admin' && pathParts[2] === 'system';
}

/**
 * Gets the institution ID from the current path
 * @param pathname - The current pathname
 * @returns the institution ID or null if this is a system admin route
 */
export function getInstitutionFromPath(pathname: string): string | null {
  if (isSystemAdminRoute(pathname)) {
    return null;
  }
  
  const pathParts = pathname.split('/');
  return pathParts[1] || null;
}

/**
 * Constructs a proper admin URL based on the current context
 * @param basePath - The base path (e.g., '/admin/subjects/123')
 * @param currentPathname - The current pathname to determine context
 * @returns the properly constructed URL
 */
export function constructAdminUrl(basePath: string, currentPathname: string): string {
  if (isSystemAdminRoute(currentPathname)) {
    // For system admin routes, prepend /admin/system
    return `/admin/system${basePath}`;
  } else {
    // For institution routes, prepend the institution ID
    const institution = getInstitutionFromPath(currentPathname);
    if (institution) {
      return `/${institution}${basePath}`;
    }
    // Fallback to system admin if we can't determine institution
    return `/admin/system${basePath}`;
  }
}

/**
 * Constructs a subject URL based on current context
 * @param subjectId - The subject ID
 * @param currentPathname - The current pathname to determine context
 * @returns the properly constructed subject URL
 */
export function constructSubjectUrl(subjectId: string, currentPathname: string): string {
  return constructAdminUrl(`/subjects/${subjectId}`, currentPathname);
}

/**
 * Constructs a topic URL based on current context
 * @param subjectId - The subject ID
 * @param topicId - The topic ID
 * @param currentPathname - The current pathname to determine context
 * @returns the properly constructed topic URL
 */
export function constructTopicUrl(subjectId: string, topicId: string, currentPathname: string): string {
  return constructAdminUrl(`/subjects/${subjectId}/topics/${topicId}`, currentPathname);
}

/**
 * Constructs a learning outcomes URL based on current context
 * @param subjectId - The subject ID
 * @param topicId - The topic ID
 * @param currentPathname - The current pathname to determine context
 * @returns the properly constructed learning outcomes URL
 */
export function constructLearningOutcomesUrl(subjectId: string, topicId: string, currentPathname: string): string {
  return constructAdminUrl(`/subjects/${subjectId}/topics/${topicId}/learning-outcomes`, currentPathname);
}
