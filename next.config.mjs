/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
  // External packages configuration moved from experimental to root level
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  experimental: {
    // View transitions and scroll restoration
    viewTransition: true,
    scrollRestoration: true,
  },
  async rewrites() {
    return [
      {
        source: '/admin/campus/classes/:id/actvity',
        destination: '/admin/campus/classes/:id/activities',
      },
      {
        source: '/admin/campus/classes/:id/assignments',
        destination: '/admin/campus/classes/:id/assessments',
      },
      {
        source: '/admin/campus/classes/:id/assignments/create',
        destination: '/admin/campus/classes/:id/assessments/new',
      },
      {
        source: '/admin/campus/classes/:id/assignments/:assignmentId',
        destination: '/admin/campus/classes/:id/assessments/:assignmentId',
      },
      {
        source: '/admin/campus/classes/:id/assignments/:assignmentId/edit',
        destination: '/admin/campus/classes/:id/assessments/:assignmentId/edit',
      },
      // Add worksheets routes
      {
        source: '/worksheets',
        destination: '/app/(teacher)/worksheets',
      },
      {
        source: '/worksheets/create',
        destination: '/app/(teacher)/worksheets/create',
      },
      {
        source: '/worksheets/:id',
        destination: '/app/(teacher)/worksheets/:id',
      },
    ];
  },
};

export default config;