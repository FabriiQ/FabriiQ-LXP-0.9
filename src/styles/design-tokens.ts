/**
 * Design tokens for role-based theming
 * 
 * This file defines the design tokens used for role-based theming in the application.
 * It includes color palettes, typography, spacing, and other design variables.
 */

// Base color palette from UI/UX plan
export const baseColors = {
  // Primary colors
  primaryGreen: '#1F504B',
  mediumTeal: '#5A8A84',
  lightMint: '#D8E3E0',
  
  // Neutral colors
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#E0E0E0',
  darkGray: '#757575',
  black: '#212121',
  
  // State colors
  red: '#D92632',
  orange: '#FF9852',
  purple: '#6126AE',
  darkBlue: '#004EB2',
  lightBlue: '#2F96F4',
};

// Role-specific color themes
export const roleThemes = {
  systemAdmin: {
    primary: baseColors.primaryGreen,
    secondary: baseColors.mediumTeal,
    accent: baseColors.darkBlue,
    background: baseColors.white,
    foreground: baseColors.black,
    muted: baseColors.lightMint,
    mutedForeground: baseColors.darkGray,
    border: baseColors.mediumGray,
  },
  
  campusAdmin: {
    primary: baseColors.darkBlue,
    secondary: baseColors.lightBlue,
    accent: baseColors.primaryGreen,
    background: baseColors.white,
    foreground: baseColors.black,
    muted: baseColors.lightGray,
    mutedForeground: baseColors.darkGray,
    border: baseColors.mediumGray,
  },
  
  teacher: {
    primary: baseColors.mediumTeal,
    secondary: baseColors.primaryGreen,
    accent: baseColors.lightBlue,
    background: baseColors.white,
    foreground: baseColors.black,
    muted: baseColors.lightMint,
    mutedForeground: baseColors.darkGray,
    border: baseColors.mediumGray,
  },
  
  student: {
    primary: baseColors.lightBlue,
    secondary: baseColors.darkBlue,
    accent: baseColors.orange,
    background: baseColors.white,
    foreground: baseColors.black,
    muted: baseColors.lightGray,
    mutedForeground: baseColors.darkGray,
    border: baseColors.mediumGray,
  },
  
  parent: {
    primary: baseColors.purple,
    secondary: baseColors.mediumTeal,
    accent: baseColors.orange,
    background: baseColors.white,
    foreground: baseColors.black,
    muted: baseColors.lightGray,
    mutedForeground: baseColors.darkGray,
    border: baseColors.mediumGray,
  },
};

// Typography scale based on UI/UX plan
export const typography = {
  fontFamily: 'Inter, sans-serif',
  fontSizes: {
    h1: '48px',
    h2: '36px',
    h3: '24px',
    h4: '20px',
    bodyLarge: '18px',
    body: '16px',
    bodySmall: '14px',
    caption: '12px',
  },
  lineHeights: {
    h1: '56px',
    h2: '44px',
    h3: '32px',
    h4: '28px',
    bodyLarge: '28px',
    body: '24px',
    bodySmall: '20px',
    caption: '16px',
  },
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
  },
};

// Spacing scale based on UI/UX plan
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

// Border radius scale based on UI/UX plan
export const borderRadius = {
  small: '4px',
  medium: '8px',
  large: '12px',
  round: '50%',
};

// Container widths based on UI/UX plan
export const containers = {
  small: '640px',
  medium: '960px',
  large: '1280px',
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Animation durations
export const animations = {
  fast: '150ms',
  default: '300ms',
  slow: '500ms',
};

// Export all design tokens
export const designTokens = {
  baseColors,
  roleThemes,
  typography,
  spacing,
  borderRadius,
  containers,
  breakpoints,
  shadows,
  animations,
};
