'use client';

import React from 'react';

export interface DumbbellProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

export const Dumbbell: React.FC<DumbbellProps> = ({
  size = 24,
  strokeWidth = 2,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 5v14" />
      <path d="M18 5v14" />
      <path d="M3 8h18" />
      <path d="M3 16h18" />
    </svg>
  );
};
