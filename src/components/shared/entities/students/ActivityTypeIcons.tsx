'use client';

import React from 'react';
import {
  FileText,
  BookOpen,
  MessageSquare,
  Award,
  HelpCircle,
  Clock,
  CheckCircle,
  Pencil,
} from 'lucide-react';

/**
 * ActivityTypeIcon component for displaying consistent icons for different activity types
 *
 * This component maps activity types to appropriate icons with consistent styling
 */
export function ActivityTypeIcon({
  type,
  className = "h-4 w-4",
  color
}: {
  type: string;
  className?: string;
  color?: string;
}) {
  // Normalize the type to lowercase and handle both formats (UPPERCASE_WITH_UNDERSCORES and kebab-case)
  const normalizedType = type.toLowerCase().replace(/_/g, '-');

  // Map activity types to icons
  const getIcon = () => {
    switch (normalizedType) {
      // Assessment types
      case 'multiple-choice':
      case 'multiple-response':
      case 'true-false':
        return <FileText className={className} style={color ? { color } : undefined} />;

      // Learning content types
      case 'reading':
      case 'book':
        return <BookOpen className={className} style={color ? { color } : undefined} />;

      case 'discussion':
        return <MessageSquare className={className} style={color ? { color } : undefined} />;

      // Assignment types
      case 'assignment':
        return <Pencil className={className} style={color ? { color } : undefined} />;

      case 'exam':
        return <Award className={className} style={color ? { color } : undefined} />;

      // Default fallback for all other types
      default:
        return <FileText className={className} style={color ? { color } : undefined} />;
    }
  };

  return getIcon();
}

/**
 * ActivityStatusIcon component for displaying consistent icons for different activity statuses
 */
export function ActivityStatusIcon({
  status,
  className = "h-4 w-4",
  color
}: {
  status: string;
  className?: string;
  color?: string;
}) {
  // Normalize the status to lowercase
  const normalizedStatus = status.toLowerCase();

  // Map status to icons
  const getIcon = () => {
    switch (normalizedStatus) {
      case 'completed':
        return <CheckCircle className={className} style={color ? { color } : undefined} />;
      case 'in-progress':
        return <Clock className={className} style={color ? { color } : undefined} />;
      case 'pending':
      case 'overdue':
      case 'upcoming':
        return <FileText className={className} style={color ? { color } : undefined} />;
      default:
        return <HelpCircle className={className} style={color ? { color } : undefined} />;
    }
  };

  return getIcon();
}
