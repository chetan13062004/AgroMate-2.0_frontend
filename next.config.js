/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  images: {
    domains: ['res.cloudinary.com', 'localhost:5000', '127.0.0.1:5000'],
    unoptimized: true,
    minimumCacheTTL: 60 * 60 * 24 * 7, // 1 week
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5000/api/:path*' 
          : 'https://agromate-3-621t.onrender.com/api/:path*',
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        module: false,
      };
    }

    // Enable source maps in development
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }

    // Split chunks
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      maxAsyncRequests: 25,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(
              /[\\/]node_modules[\\/](.*?)([\\/]|$)/
            )?.[1];
            return `npm.${packageName?.replace('@', '')}`;
          },
        },
      },
    };

    return config;
  },
  experimental: {
    // Enable React 18 concurrent features
    reactRoot: true,
    // Improve HMR and Fast Refresh
    scrollRestoration: true,
    // Enable webpack 5 persistent caching
    workerThreads: true,
    // Disable CSS optimization to prevent critters error
    // optimizeCss: false,
    // Enable module preloading
    optimizePackageImports: ['@heroicons/react'],
  },
  // Disable TypeScript type checking during build for faster builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable ESLint during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
