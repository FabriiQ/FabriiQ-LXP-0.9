'use client';


import { NavigationLink, NavigationButton, NavigationLinkProps } from './navigation-link';
import { useInstitution } from '@/providers/institution-provider';

export interface InstitutionNavigationLinkProps extends NavigationLinkProps {
  preserveInstitution?: boolean;
}

/**
 * InstitutionNavigationLink - A navigation link that automatically includes institution context
 *
 * This component extends NavigationLink to automatically prepend the current institution ID
 * to the href if it's a relative URL and doesn't already include the institution ID.
 */
export function InstitutionNavigationLink({
  href,
  children,
  preserveInstitution = true,
  ...props
}: InstitutionNavigationLinkProps) {
  // Safely get institutionId with error handling
  let institutionId = '';
  try {
    const context = useInstitution();
    if (context && typeof context === 'object' && 'institutionId' in context) {
      institutionId = context.institutionId;
    }
  } catch (error) {
    console.error('Error getting institution context:', error);
  }

  // Only modify href if it's a relative URL and preserveInstitution is true
  // Don't modify student URLs
  const isStudentUrl = href.startsWith('/student');
  const finalHref = preserveInstitution && href.startsWith('/') && !href.startsWith(`/${institutionId}`) && !isStudentUrl
    ? `/${institutionId}${href}`
    : href;

  return (
    <NavigationLink
      href={finalHref}
      {...props}
    >
      {children}
    </NavigationLink>
  );
}

/**
 * InstitutionNavigationButton - A button that navigates with institution context
 *
 * This component extends NavigationButton to automatically prepend the current institution ID
 * to the href if it's a relative URL and doesn't already include the institution ID.
 */
export function InstitutionNavigationButton({
  href,
  children,
  preserveInstitution = true,
  ...props
}: InstitutionNavigationLinkProps) {
  // Safely get institutionId with error handling
  let institutionId = '';
  try {
    const context = useInstitution();
    if (context && typeof context === 'object' && 'institutionId' in context) {
      institutionId = context.institutionId;
    }
  } catch (error) {
    console.error('Error getting institution context:', error);
  }

  // Only modify href if it's a relative URL and preserveInstitution is true
  // Don't modify student URLs
  const isStudentUrl = href.startsWith('/student');
  const finalHref = preserveInstitution && href.startsWith('/') && !href.startsWith(`/${institutionId}`) && !isStudentUrl
    ? `/${institutionId}${href}`
    : href;

  return (
    <NavigationButton
      href={finalHref}
      {...props}
    >
      {children}
    </NavigationButton>
  );
}
