'use client';

import React from 'react';

export interface LightbulbProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

export const Lightbulb: React.FC<LightbulbProps> = ({
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
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
};

export default Lightbulb;
