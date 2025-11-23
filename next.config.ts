import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Cloud Run
  output: 'standalone',
  
  // Disable dev indicators in production
  devIndicators: false,
  
  // Optimize for production
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  // Configure images for Cloud Storage
  images: {
    domains: [
      'storage.googleapis.com',
      ...(process.env.BUCKET_THUMBNAILS ? [`${process.env.BUCKET_THUMBNAILS}.storage.googleapis.com`] : []),
      ...(process.env.ADDITIONAL_IMAGE_DOMAINS ? process.env.ADDITIONAL_IMAGE_DOMAINS.split(',') : [])
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    unoptimized: true, // Disable image optimization for Cloud Run
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;