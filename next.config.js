/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle binary modules used by H5P
    if (isServer) {
      // Add all @node-rs/crc32 platform-specific binaries to externals
      config.externals.push({
        '@node-rs/crc32-win32-x64-msvc': 'commonjs @node-rs/crc32-win32-x64-msvc',
        '@node-rs/crc32-darwin-x64': 'commonjs @node-rs/crc32-darwin-x64',
        '@node-rs/crc32-linux-x64-gnu': 'commonjs @node-rs/crc32-linux-x64-gnu',
        '@node-rs/crc32-linux-x64-musl': 'commonjs @node-rs/crc32-linux-x64-musl',
        '@node-rs/crc32-android-arm64': 'commonjs @node-rs/crc32-android-arm64',
        '@node-rs/crc32-darwin-arm64': 'commonjs @node-rs/crc32-darwin-arm64',
        '@node-rs/crc32-linux-arm64-gnu': 'commonjs @node-rs/crc32-linux-arm64-gnu',
        '@node-rs/crc32-linux-arm64-musl': 'commonjs @node-rs/crc32-linux-arm64-musl',
        '@node-rs/crc32-win32-arm64-msvc': 'commonjs @node-rs/crc32-win32-arm64-msvc',
        'yauzl-promise': 'commonjs yauzl-promise'
      });
    }

    return config;
  },
  // Disable server-side rendering for H5P components
  reactStrictMode: true,
  transpilePackages: ['@lumieducation/h5p-react', '@lumieducation/h5p-webcomponents'],
  // External packages configuration moved to root level
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
  experimental: {
    // Enable View Transitions API for smooth page transitions
    viewTransition: true,
    // Disable CSS optimization to avoid critters dependency
    optimizeCss: false,
    // Maintain scroll position during navigation
    scrollRestoration: true,
  },
  // Optimize image formats for better performance
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};

module.exports = nextConfig;
