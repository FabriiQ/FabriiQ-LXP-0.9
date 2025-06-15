'use client';

import React from 'react';

/**
 * CustomActivityTypeIcon component for displaying visually distinct, modern icons
 * for different activity types with custom colors based on the brand palette.
 *
 * This component provides SVG icons with unique visual distinctions for each activity type.
 */
export interface ActivityTypeIconProps extends React.SVGProps<SVGSVGElement> {
  type: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  strokeWidth?: number;
}

export function CustomActivityTypeIcon({
  type,
  size = 24,
  primaryColor = 'currentColor',
  secondaryColor,
  strokeWidth = 2,
  ...props
}: ActivityTypeIconProps) {
  // Normalize the type to lowercase and handle both formats (UPPERCASE_WITH_UNDERSCORES and kebab-case)
  const normalizedType = type.toLowerCase().replace(/_/g, '-');

  // Default secondary color if not provided
  const secondaryColorValue = secondaryColor || primaryColor;

  // Map activity types to custom SVG icons
  switch (normalizedType) {
    // Multiple Choice - Checkboxes with one selected
    case 'multiple-choice':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="3" y="5" width="4" height="4" rx="1" fill={primaryColor} />
          <path d="M4 7l1 1 1.5-1.5" stroke="white" strokeWidth={strokeWidth} />
          <line x1="9" y1="7" x2="20" y2="7" />
          <rect x="3" y="13" width="4" height="4" rx="1" stroke={primaryColor} />
          <line x1="9" y1="15" x2="20" y2="15" />
        </svg>
      );

    // Multiple Response - Checkboxes with multiple selected
    case 'multiple-response':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="3" y="5" width="4" height="4" rx="1" fill={primaryColor} />
          <path d="M4 7l1 1 1.5-1.5" stroke="white" strokeWidth={strokeWidth} />
          <line x1="9" y1="7" x2="20" y2="7" />
          <rect x="3" y="13" width="4" height="4" rx="1" fill={primaryColor} />
          <path d="M4 15l1 1 1.5-1.5" stroke="white" strokeWidth={strokeWidth} />
          <line x1="9" y1="15" x2="20" y2="15" />
        </svg>
      );

    // True/False - Checkmark and X
    case 'true-false':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <circle cx="8" cy="12" r="5" fill={primaryColor} stroke="none" />
          <path d="M6 12l1.5 1.5 3-3" stroke="white" strokeWidth={strokeWidth} />
          <circle cx="16" cy="12" r="5" stroke={primaryColor} fill="none" />
          <path d="M14 10l4 4m0-4l-4 4" stroke={primaryColor} />
        </svg>
      );

    // Fill in the Blanks - Text with underlines
    case 'fill-in-the-blanks':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M4 7h3m4 0h2m4 0h3" />
          <path d="M7 7v4" />
          <path d="M13 7v4" />
          <line x1="7" y1="11" x2="10" y2="11" stroke={primaryColor} strokeWidth={strokeWidth * 1.5} />
          <line x1="13" y1="11" x2="17" y2="11" stroke={primaryColor} strokeWidth={strokeWidth * 1.5} />
          <path d="M4 16h16" />
        </svg>
      );

    // Matching - Connected lines
    case 'matching':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <circle cx="5" cy="6" r="2" fill={primaryColor} />
          <circle cx="5" cy="12" r="2" stroke={primaryColor} fill="none" />
          <circle cx="5" cy="18" r="2" fill={primaryColor} />
          <circle cx="19" cy="6" r="2" stroke={primaryColor} fill="none" />
          <circle cx="19" cy="12" r="2" fill={primaryColor} />
          <circle cx="19" cy="18" r="2" stroke={primaryColor} fill="none" />
          <path d="M7 6h10" />
          <path d="M7 12h10" />
          <path d="M7 18h10" />
        </svg>
      );

    // Sequence - Ordered list
    case 'sequence':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="3" y="5" width="4" height="4" rx="1" fill={primaryColor} />
          <text x="5" y="8.5" fontSize="4" fill="white" textAnchor="middle">1</text>
          <line x1="9" y1="7" x2="20" y2="7" />
          <rect x="3" y="11" width="4" height="4" rx="1" fill={secondaryColorValue} />
          <text x="5" y="14.5" fontSize="4" fill="white" textAnchor="middle">2</text>
          <line x1="9" y1="13" x2="20" y2="13" />
          <rect x="3" y="17" width="4" height="4" rx="1" fill={primaryColor} />
          <text x="5" y="20.5" fontSize="4" fill="white" textAnchor="middle">3</text>
          <line x1="9" y1="19" x2="20" y2="19" />
        </svg>
      );

    // Drag and Drop - Movable element
    case 'drag-and-drop':
    case 'drag-the-words':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="4" y="8" width="6" height="4" rx="1" fill={primaryColor} />
          <rect x="14" y="8" width="6" height="4" rx="1" stroke={primaryColor} fill="none" />
          <rect x="4" y="16" width="6" height="4" rx="1" stroke={primaryColor} fill="none" />
          <rect x="14" y="16" width="6" height="4" rx="1" fill={primaryColor} />
          <path d="M10 10h4m-4 8h4" stroke="none" />
          <path d="M7 4v2m0 12v2" />
          <path d="M17 4v2m0 12v2" />
        </svg>
      );

    // Numeric - Number input
    case 'numeric':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="4" y="6" width="16" height="12" rx="2" stroke={primaryColor} fill="none" />
          <text x="12" y="15" fontSize="8" fill={primaryColor} textAnchor="middle">123</text>
        </svg>
      );

    // Reading - Book
    case 'reading':
    case 'book':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="16" y2="11" />
          <line x1="8" y1="15" x2="12" y2="15" />
        </svg>
      );

    // Video - Play button
    case 'video':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="2" y="4" width="20" height="16" rx="2" stroke={primaryColor} fill="none" />
          <circle cx="12" cy="12" r="4" fill={primaryColor} />
          <polygon points="10.5,10 10.5,14 14.5,12" fill="white" stroke="none" />
        </svg>
      );

    // Flash Cards - Stack of cards
    case 'flash-cards':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="6" y="8" width="14" height="10" rx="1" fill={secondaryColorValue} stroke={primaryColor} />
          <rect x="4" y="6" width="14" height="10" rx="1" fill="none" stroke={primaryColor} />
          <line x1="8" y1="11" x2="14" y2="11" stroke={primaryColor} />
        </svg>
      );

    // Quiz - Question mark
    case 'quiz':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <circle cx="12" cy="12" r="9" fill="none" stroke={primaryColor} />
          <path d="M9 10a3 3 0 1 1 6 0c0 2-3 3-3 3" />
          <circle cx="12" cy="17" r="1" fill={primaryColor} />
        </svg>
      );

    // H5P - Interactive content
    case 'h5p':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" stroke={primaryColor} fill="none" />
          <text x="12" y="14" fontSize="8" fill={primaryColor} textAnchor="middle" fontWeight="bold">H5P</text>
          <path d="M7 17l10-10" stroke={primaryColor} strokeWidth={strokeWidth * 0.75} />
        </svg>
      );

    // Default fallback for all other types
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...props}
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
  }
}
