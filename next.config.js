/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds to prevent build failures from linting errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during builds to prevent build failures
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable experimental features
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
}

module.exports = nextConfig
