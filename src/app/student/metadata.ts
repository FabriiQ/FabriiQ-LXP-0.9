import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Student Portal',
  description: 'Access your courses, activities, and grades on the go',
  themeColor: '#4f46e5',
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Student Portal',
  },
  icons: {
    apple: '/icons/apple-icon-180.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};
